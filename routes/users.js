var express = require('express');
var router = express.Router();
var postRouter = require("./posts");
require('dotenv').config();
// const gfsAndDbInit = require("../middlewares/gfsInit");

const userController = require("../controllers/userController");
const { isUserAuthenticated } = require('../middlewares/auth');

/* GET users listing. */
router.get('/', [isUserAuthenticated,userController.users_get]);

// Create new user
router.post("/", userController.users_post);

router.get("/authUser", [isUserAuthenticated, userController.authUser_get]);
//Get user detail
router.get('/:userId', [isUserAuthenticated, userController.user_detail]);

router.use("/:userId/posts", [isUserAuthenticated, postRouter]);

router.put("/:userId", [isUserAuthenticated, userController.user_put]);

router.get("/:userId/image", [isUserAuthenticated, userController.user_image_get]);

router.get("/:userId/image/:filename", [isUserAuthenticated, userController.user_image_get]);

router.put("/:userId/:friendReqId/friendRequest", [isUserAuthenticated, userController.user_friendRequest_put]);

router.put("/:userId/:friendReqId/removeFriendRequest", [isUserAuthenticated, userController.user_removeFriendRequest_put]);

router.put("/:userId/:friendId/addFriend", [isUserAuthenticated, userController.user_addFriend_put]);


module.exports = router;
