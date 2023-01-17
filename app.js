var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
// const session = require("express-session");
const cookieSession = require("cookie-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const bcrypt = require("bcryptjs");
// const methodOverride = require('method-override');
require('dotenv').config()

const gfsAndDbInit = require("./middlewares/gfsInit");

const User = require("./models/user");

gfsAndDbInit();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// eslint-disable-next-line no-undef
// const inProd = process.env.NODE_ENV === "production";


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Headers", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Headers, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
  next();
});
app.options('/*', (_, res) => {
  res.sendStatus(200);
});
// view engine setup
// eslint-disable-next-line no-undef
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

passport.use(
  new LocalStrategy({usernameField: "email"},(email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { msg: "Incorrect email" ,err:-1});
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {

          User.findOne({ email: email }, { password: 0 }).exec((err, user) =>
          {
            if (err)
            {
              return done(err);
            }
            // passwords match! log user in
            return done(null, user)
          })
        } else {
          // passwords do not match!
          return done(null, false, { msg: "Incorrect password",err: -2 })
        }
      })
    });
  })
);
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById( id,function (err, user) {
    // eslint-disable-next-line no-unused-vars
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  // eslint-disable-next-line no-undef
  clientID: process.env.GOOGLE_CLIENT_ID,
  // eslint-disable-next-line no-undef
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/redirect"
}, async (accessToken,refreshToken,profile,done) =>
{
  const count = await User.find({ email: profile.email }).count().exec();
  if (count > 0)
  {
    User.findOne({ email: profile.email }, {password:0}).exec((err, user) => {
      if (err)
        return done(err);
      else
        return done(null, user);
    });
  }
  else
  {
    var hashedPassword = await bcrypt.hash(profile.email, 10);
    const user = new User({
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      password: hashedPassword
    });

    user.save(async (err) =>
    {
      if (err)
      {
        done(err);
      }
      let populatedUser = await User.findOne({ _id: user._id }).populate("friends").populate("friendRequests").populate("savedPosts").exec();
      return done(null, populatedUser);
    })
  }
}))

// app.use(session({
//   secret: "cats", resave: false, saveUninitialized: true, cookie:
//   {
//     maxAge: 24 * 60 * 60 * 1000,
//     sameSite: `${inProd ? "none" : "lax"}`, // cross site // set lax while working with http:localhost, but none when in prod
//     secure: `${inProd ? "true" : "auto"}`
//   }
// }));
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['cats'],
  sameSite: process.env.NODE_ENV === "development"? false: 'none',
  secure: process.env.NODE_ENV === "development" ? false : true,
  httpOnly:process.env.NODE_ENV ==="development" ?false:true
}));
// app.use((req, res, next) => {
//   req["sessionCookies"].secure = true;
//   next();
// });
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({credentials:true, origin:"http://localhost:3000"}));
app.options('*', cors()) // include before other routes



app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
