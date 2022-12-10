const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const passport = require("passport");

exports.users_get = (req, res) =>
{
    User.find({}, {password:0}).exec((err, users) =>
    {
        res.json(users);
    });    
}

exports.users_post = [
    body("first_name", "first_name required").trim().isLength({ min: 1 }).escape(),
    body("last_name", "last_name required").trim().isLength({ min: 1 }).escape(),
    body("email", "email required").trim().isLength({ min: 1 }).escape(),
    body("password", "password required").trim().isLength({ min: 1 }).escape(),
    body("gender", "gender required").trim().isLength({ min: 1 }).escape(),

    async (req, res,next) =>
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({msg:"Invalid data", errors : errors.array()});    
        }
        if (User.find({ email: req.body.email }).count().exec())
        {
            return res.status(400).json({ msg: "User with this email is already registered" });    
        }

        var hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        const user = new User({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hashedPassword,
            gender : req.body.gender,
        })      
        
        user.save((err) => 
        {
            if (err)
            {
                next(err);
            }
            return res.json({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                gender: user.gender,
            });
        })
    }
]

exports.users_login_post = [
    body("email", "email required").trim().isLength({ min: 1 }).escape(),
    body("password", "password required").trim().isLength({ min: 1 }).escape(),
    (req, res, next) =>
    {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user)
                return res.json({ msg: info });
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
                return res.json({ msg: "Login successful", finalUser });
            }
        })(req, res, next);
    }
    
];

