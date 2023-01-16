const getUpload = require("../middlewares/gridFsStorage");
const gfsAndDbInit = require("../middlewares/gfsInit");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const Post = require("../models/post");
const { ObjectId } = require("mongodb");
const { post } = require("../routes");

exports.posts_get = (req, res, next) =>
{
  Post.find({}).populate("userId").populate("comments.userId").exec((err, posts) =>
  {
      if (err)
          next(err);
      res.json(posts);
  });  
}

exports.userPosts_get = async (req, res, next) =>
{
  let posts = await Post.find({ userId: req.params.userId }).populate("userId").populate("comments.userId").exec();
  posts.sort((a, b) => { return b.postedAt - a.postedAt });
  return res.json({ posts: posts });
}

exports.friendsPosts_get = async (req,res,next) =>
{
  let user = await User.findOne({ _id: req.params.userId }).exec();
  let posts = [];

  let userPosts = await Post.find({ userId: req.params.userId }).populate("userId").populate("comments.userId").exec();
  posts.push(...userPosts);

  for (friendId of user.friends)
  {
    let tempPosts = await Post.find({ userId: friendId }).populate("userId").populate("comments.userId").exec();
    posts.push(...tempPosts);
  }

  posts.sort((a, b) => { return b.postedAt - a.postedAt });
  return res.json(posts);
}

exports.post_post = [
  
  getUpload().single("postImage"),

  body("content", "content required").isLength({ min: 1 }),
  body("postedAt","Date posted is required").isISO8601().toDate(),
  
  async (req, res, next) =>
  {
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
      return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
    }

    let count = await User.find({ _id:req.body.userId }).count();
    if (count === 0)
    {
      return res.status(400).json({ msg: "User with this id does not exist"});    
    }

    const post = new Post({
      userId: req.body.userId,
      content: req.body.content,
      photoUrl: req.fileInfo ? req.fileInfo.filename : undefined,
      postedAt: req.body.postedAt,
      likes: [],
      comments: []
    });

    post.save((err) =>
    {
      if (err)
      {
        next(err);
      }
      return res.json({ msg: "post created successfully",post:post });
    })
}];

exports.post_comment_put = [
  body("comment").isLength({ min: 1 }),
  async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty)
    {
      return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
    }

    let count = await User.find({ _id:req.body.userId }).count();
    if (count === 0)
    {
      return res.status(400).json({ msg: "User with this id does not exist"});    
    }
    let user = await User.findOne({ _id:req.body.userId }).exec();

    Post.findOne({ _id: req.params.postId }, async (err, post) => {
      if (err) {
        next(err);
      }
      post.comments.push({comment : req.body.comment ,userId : req.body.userId});

      // eslint-disable-next-line no-unused-vars
      let thePost = await Post.findByIdAndUpdate(post._id, post, {}).populate("userId").populate("comments.userId").exec();
      if (err) {
        return next(err);
      }
      thePost.comments.push({ comment: req.body.comment, userId: user });
      return res.json({ msg: "post successfully updated", post: thePost });
    }).populate("userId").populate("comments.userId");
  }
]

exports.post_like_put = async (req, res, next) =>
{
  let count = await User.find({ _id:req.body.userId }).count();
  if (count === 0)
  {
    return res.status(400).json({ msg: "User with this id does not exist"});    
  }

  Post.findOne({ _id: req.params.postId }, (err, post) => {
    if (err) {
      next(err);
    }

    if (req.body.operation === 'add')
    {
      post.likes.push(req.body.userId);
    }
    else if (req.body.operation === 'remove')
    {
      post.likes = post.likes.filter((el) => {return el.toString() !== req.body.userId; });
    }

    // eslint-disable-next-line no-unused-vars
    Post.findByIdAndUpdate(post._id, post, {}, (err, thepost) => {
      if (err) {
        return next(err);
      }

      return res.json({ msg: "post successfully updated", post: post });
    });
  })
}

exports.post_image_get = async (req, res, next) =>
{

  Post.findOne({ _id: req.params.postId }, (err,post) =>
  {
    if (err)
    {
      next(err);  
    }
    let { gfs, gridFsBucket } = gfsAndDbInit();
    gfs.files.findOne({ filename: post.photoUrl}, (err, file) => {
        
      if (err)
      {
        next(err);
      }
      
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
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

exports.post_delete = async (req, res, next) =>
{

  const post = await Post.findOne({ _id: req.params.postId});
  if (post.userId.toString() !== req.params.userId)
  {
    return res.status(400).json({ msg: "Only OP can delete post" });  
  }

  if (post.photoUrl !== undefined)
  {
    let { gfs, gridFsBucket } = gfsAndDbInit();

    gfs.files.findOne({ filename: post.photoUrl }, (err, file) =>
    {
      if (err)
      {
        next(err);  
      }

      gridFsBucket.delete(ObjectId(file._id));
      //   // eslint-disable-next-line no-unused-vars
      // gfs.remove({ filename:post.photoUrl, root: "uploads" ,_id:file._id }, (err, gridStore) =>
      // {
      //   if (err)
      //     next(err);
      // })
    })
  }

  Post.findByIdAndDelete(post._id, (err) =>
  {
    if (err)
    {
      return next(err);  
    }
    return res.json({ msg: "post delete successful" });
  })
}
