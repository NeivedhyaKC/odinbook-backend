var express = require('express');
var router = express.Router();
const postController = require("../controllers/postController");

router.get("/", postController.posts_get);

router.post("/", postController.post_post);

router.get("/:postId/image", postController.post_image_get);

router.delete("/:postId", postController.post_delete);


module.exports = router;
