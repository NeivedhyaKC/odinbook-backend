var express = require('express');
var router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const jwt = require("jsonwebtoken");

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
      passport.authenticate("local", (err, user, info) => {
          if (err) {
              return next(err);
          }
          if (!user)
              return res.json({ info});
          if (user)
          {
              const finalUser = {
                  first_name: user.first_name,
                  last_name: user.last_name,
                  _id: user._id,
                  email: user.email,
                  gender: user.gender,
                  __v:user.__v
              }
            // eslint-disable-next-line no-undef
            jwt.sign({ user: finalUser }, process.env.JWT_SECRET_KEY, (err, token) =>
            {
              return res.json({ msg: "Login successful",user:finalUser ,token});
            })
          }
      })(req, res, next);
  }
  
])

module.exports = router;
