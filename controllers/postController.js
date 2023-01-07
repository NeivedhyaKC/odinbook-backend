const getUpload = require("../middlewares/gridFsStorage");
const gfsAndDbInit = require("../middlewares/gfsInit");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const Post = require("../models/post");

exports.posts_get = (req, res, next) =>
{
  Post.find({}).populate("userId").exec((err, posts) =>
  {
      if (err)
          next(err);
      res.json(posts);
  });  
}

exports.post_post = [
  
  getUpload().single("postImage"),

  body("content", "content required").isLength({ min: 1 }).escape(),
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
    if (req.body.likes === undefined)
    {
      return res.status(400).json({ msg: "no of like for post to be created is 0" });  
    }

    const post = new Post({
      userId: req.body.userId,
      content: req.body.content,
      photoUrl: req.fileInfo ? req.fileInfo.filename : undefined,
      postedAt: req.body.postedAt,
      likes: req.body.likes,
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

exports.post_delete = (req,res) =>
{
  // yet to be tested
  //Deletes only post image
  let { gfs} = gfsAndDbInit();
  // eslint-disable-next-line no-unused-vars
  gfs.remove({ _id: req.params.postId, root: "uploads" }, (err, gridStore) =>
  {
    if (err)
      return res.status(404).json({ err: err });
    
    return res.json({ msg: "post delete successful" });
  })
}
