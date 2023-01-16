const { Router } = require('express');
var express = require('express');
var router = express.Router({mergeParams: true});
const postController = require("../controllers/postController");

router.get("/", postController.posts_get);

router.get("/userPosts", postController.userPosts_get);

router.get("/friendsPosts", postController.friendsPosts_get);

router.post("/", postController.post_post);

router.put("/:postId/comment", postController.post_comment_put);

router.put("/:postId/like", postController.post_like_put);

router.get("/:postId/image", postController.post_image_get);

router.delete("/:postId", postController.post_delete);

module.exports = router;
