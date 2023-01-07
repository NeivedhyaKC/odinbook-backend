var express = require('express');
var router = express.Router();
var postRouter = require("./posts");
require('dotenv').config();
// const gfsAndDbInit = require("../middlewares/gfsInit");

const userController = require("../controllers/userController");
const { isUserAuthenticated } = require('../middlewares/auth');

// const verifyToken = (req,res,next) =>
// {
//     const token = req.headers['authorization'];
//     if (token !== undefined)
//     {
//         // eslint-disable-next-line no-undef
//         jwt.verify(token, process.env.JWT_SECRET_KEY, (err, authData) =>
//         {
//             if (err)
//             {
//                 return res.sendStatus(403);    
//             }
//             else
//             {
//                 console.log(authData);
//                 req.authData = authData;
//                 next();
//             }
//         })
//     }
//     else
//     {
//         return res.sendStatus(403);    
//     }
// }

/* GET users listing. */
router.get('/', [isUserAuthenticated,userController.users_get]);

// Create new user
router.post("/", userController.users_post);

router.get("/authUser", [isUserAuthenticated, userController.authUser_get]);
//Get user detail
router.get('/:userId', [isUserAuthenticated, userController.user_detail]);

router.use("/:userId/posts", [isUserAuthenticated,postRouter]);


module.exports = router;
