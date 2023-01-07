var express = require('express');
var router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require("passport");

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
            req.login(user, (err) =>
            {
              if (err) { next(); }
              return res.json({ msg: "Login successful", user });
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
    successRedirect: "http://localhost:3000/login/success",
    failureRedirect: "http://localhost:3000/login"
  }))
module.exports = router;
