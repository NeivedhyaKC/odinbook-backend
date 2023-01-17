const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const gfsAndDbInit = require("../middlewares/gfsInit");
const getUpload = require("../middlewares/gridFsStorage");
const Post = require("../models/post");

exports.logout = (req,res) =>
{
    // req.logout(function (err)
    // {
    //     if (err)
    //     {
    //         next(err);    
    //     }
    //     req.user = null;
    //     return res.json({ msg: "Logged out successfully" });
    // })
    req.logout();
    req.user = null;
    return res.json({ msg: "Logged out successfully" });
}

exports.users_get = (req, res,next) =>
{
    User.find({}, {password:0}).populate("friends").populate("friendRequests").populate("savedPosts").exec((err, users) =>
    {
        if (err)
            next(err);
        return res.json(users);
    });    
}

exports.users_post = [
    body("firstName", "first_name required").isAlpha().trim().isLength({ min: 1 }).escape(),
    body("lastName", "last_name required").isAlpha().trim().isLength({ min: 1 }).escape(),
    body("email", "email required").trim().isLength({ min: 1 }).escape(),
    body("password", "more than 8 character for pasword required").trim().isLength({ min: 8 }).escape(),

    async (req, res,next) =>
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
        }
        let count = await User.find({ email: req.body.email }).count();
        if (count > 0)
        {
            return res.json({ info: { msg: "User with this email is already registered", err:-1 } });    
        }

        var hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            description:"Hey there! I am using ShareSpace."
        })      
        
        user.save((err) => 
        {
            if (err)
            {
                next(err);
            }
            passport.authenticate("local",async (err, user, info) => {
                if (err) {
                    return next(err);
                }
                if (!user)
                    return res.json({ info});
                if (user)
                {
                  req.login(user, async (err) =>
                  {
                    if (err) { next(); }
                    
                    let populatedUser = await User.findOne({ _id: user._id }).populate("friends").populate("friendRequests").populate("savedPosts").exec();
                    return res.json({ msg: "Login successful", user:populatedUser });
                  })
                }
            })(req, res, next);
        })
    }
]

exports.user_detail = (req,res,next) =>
{
    User.findById(req.params.userId, { password: 0 }).populate("friends").populate("friendRequests").populate("savedPosts").exec((err, user) =>
    {
        if (err)
        {
            next(err);    
        }
        return res.json({ user: user });
    })    
}

exports.authUser_get = (req, res) =>
{
    User.findById(req.user._id, { password: 0 }).populate("friends").populate("friendRequests").populate("savedPosts").exec((err, user) =>
    {
        if (err)
        {
            next(err);    
        }
        return res.json({ user: user });
    })    
}

exports.user_put = [

    getUpload().single("profilePic"),

    body("description", "description required").isLength({ min: 1 }),
    async (req, res, next) =>
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
        }

        User.findOne({ _id: req.params.userId }, function (err, user)
        {
            if (err)
            {
                next(err);
            }
            
            if (req.fileInfo)
            {
                User.findByIdAndUpdate(user._id, { "$set": {description:req.body.description, photoUrl:req.fileInfo.filename} }, {}, (err, theUser) => {
                    if (err) {
                        next(err);
                    }
                    theUser.description = req.body.description;
                    theUser.photoUrl = req.fileInfo.filename;
                    return res.json({ msg: "User updated successfully", user: theUser });
                });
            }
            else
            {
                User.findByIdAndUpdate(user._id, { "$set": { description: req.body.description } }, {}, (err, theUser) => {
                    if (err) {
                        next(err);
                    }
                    theUser.description = req.body.description;
                    return res.json({ msg: "User updated successfully", user: theUser });
                });    
            }
        })
    }
]
exports.user_image_get = async (req,res,next) =>
{
    User.findOne({ _id: req.params.userId }, function (err, user) {
        if (err) {
            next(err);
        }
        let { gfs, gridFsBucket } = gfsAndDbInit();
        if (!user.photoUrl)
        {
            const readstream = gridFsBucket.openDownloadStreamByName("d21e45b1c1b96b95b969c657e0bf77ac.jpg");
            return readstream.pipe(res);
        }
        gfs.files.findOne({ filename: user.photoUrl }, (err, file) => {
            
            if (err) {
                next(err);
            }
        
            // Check if file
            if (!file || file.length === 0) {
                const readstream = gridFsBucket.openDownloadStreamByName("d21e45b1c1b96b95b969c657e0bf77ac.jpg");
                return readstream.pipe(res);
            }

            // Check if image
            if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                // Read output to browser
                //   const readstream = gfs.createReadStream(file.filename);
        
                const readstream = gridFsBucket.openDownloadStreamByName(file.filename);
                readstream.pipe(res);
            } else {
                res.status(404).json({
                    err: 'Not an image'
                });
            }
        });
    });
}

exports.user_friendRequest_put = async (req,res,next) =>
{
    let count = await User.findOne({ _id: req.params.friendReqId }).count();
    if (count === 0)
    {
        return res.json({ msg: "User with this id does not exist" });    
    }

    let friendReq = await User.findOne({ _id: req.params.friendReqId }).exec();

    if (!friendReq)
    {
        return res.json({ msg: "error when finding friendReq" });
    }

    friendReq.friendRequests.push(req.params.userId);

    User.findByIdAndUpdate(friendReq._id, friendReq, {}, (err, theFriendReq) =>
    {
        if (err)
        {
            next(err);
        }
        res.json({ msg: "FriendReq successfully updated", friendReq: theFriendReq });
    })
}

exports.user_removeFriendRequest_put =async (req, res, next) =>
{
    let count = await User.findOne({ _id: req.params.friendReqId }).count();
    if (count === 0)
    {
        return res.json({ msg: "User with this id does not exist" });    
    }

    let user = await User.findOne({ _id: req.params.userId }).exec();

    user.friendRequests = user.friendRequests.filter((el) => { return el.toString() !== req.params.friendReqId });
    await User.findByIdAndUpdate(user._id, user, {}).exec();

    let finalUser = await User.findOne({ _id: user._id }).populate("friends").populate("friendRequests").populate("savedPosts").exec();
    return res.json({ msg: "Remove friend request completed successfully" ,user:finalUser});
}

exports.user_addFriend_put = async (req, res, next) =>
{
    let user = await User.findOne({ _id: req.params.userId }).exec();
    let friend = await User.findOne({ _id: req.params.friendId }).exec();

    let friendReqSentInUser = false;
    let friendReqSentInFriend = false;

    user.friendRequests.forEach((friendReq) =>
    {
        if (friendReq.toString() === req.params.friendId)
        {
            friendReqSentInUser = true;    
        }
    })

    friend.friendRequests.forEach((friendReq) =>
    {
        if (friendReq.toString() === req.params.userId)
        {
            friendReqSentInFriend = true;
        }
    })
    if (!friendReqSentInFriend && !friendReqSentInUser)
    {
        return res.status(400).json({ msg: "Can't add as friends as neither have friend requests from each other" });    
    }

    if (friendReqSentInUser)
    {
        user.friendRequests = user.friendRequests.filter((el) => { return el.toString() !== req.params.friendId });
    }
    if (friendReqSentInFriend)
    {
        friend.friendRequests = friend.friendRequests.filter((el) => { return el.toString() !== req.params.userId });
    }

    user.friends.push(req.params.friendId);
    friend.friends.push(req.params.userId);

    await User.findByIdAndUpdate(user._id, user, {}).exec();
    await User.findByIdAndUpdate(friend._id, friend, {}).exec();

    let finalUser = await User.findOne({ _id: user._id }).populate("friends").populate("friendRequests").populate("savedPosts").exec();
    return res.json({ msg: "Add Friends completed successfully" ,user:finalUser});
}

exports.user_savePost_put = async (req,res,next) =>
{
    let user = await User.findOne({ _id: req.params.userId }).exec();
    if (req.body.operation === "add")
    {
        user.savedPosts.push(req.params.postId);
    }
    else if ( req.body.operation === "remove")
    {
        user.savedPosts = user.savedPosts.filter((el) => { return el.toString() !== req.params.postId; });
    }

    await User.findByIdAndUpdate(user._id, user, {}).exec();

    let finalUser = await User.findOne({ _id: user._id }).populate("friends").populate("friendRequests").populate("savedPosts").exec();
    return res.json({ msg: "save/unsave completed successfully" ,user:finalUser});
}
exports.user_savedPosts_get = async (req, res, next) =>
{
    let user = await User.findOne({ _id: req.params.userId }).exec();
    let posts = [];
    for (let postId of user.savedPosts)
    {
        let tempPost = await Post.findOne({ _id: postId }).populate("userId").exec();
        posts.push(tempPost);
    }
    return res.json({ posts: posts });
}