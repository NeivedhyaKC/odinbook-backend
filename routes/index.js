var express = require('express');
var router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const User = require("../models/user");

/* GET home page. */
router.get('/', function(req, res) {
  res.json({ user: req.user? req.user:"" });
});

router.post('/login',[
  body("email", "email required").trim().isLength({ min: 1 }).escape(),
  body("password", "password required").trim().isLength({ min: 1 }).escape(),
  (req, res, next) =>
  {
      const errors = validationResult(req);
      if (!errors.isEmpty())
      {
          return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
      }
    passport.authenticate("local",(err, user, info) => {
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
  }
  
])

router.get('/auth/google',passport.authenticate("google", {
  scope:['profile','email']
}))

router.get('/auth/google/redirect', passport.authenticate('google',
  {
    successRedirect: `${process.env.FRONT_END_URL}/login/success`,
    failureRedirect: `${process.env.FRONT_END_URL}/login`
  }))
module.exports = router;
