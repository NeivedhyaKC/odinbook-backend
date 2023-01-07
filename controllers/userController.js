const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const passport = require("passport");

exports.users_get = (req, res,next) =>
{
    User.find({}, {password:0}).exec((err, users) =>
    {
        if (err)
            next(err);
        res.json(users);
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
            password: hashedPassword
        })      
        
        user.save((err) => 
        {
            if (err)
            {
                next(err);
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
        })
    }
]

exports.user_detail = (req,res,next) =>
{
    User.findById(req.params.userId, { password: 0 }).exec((err, user) =>
    {
        if (err)
        {
            next(err);    
        }
        return res.json(user);
    })    
}

exports.authUser_get = (req, res) =>
{
    return res.json({ user: req.user });
}
