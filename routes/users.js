var express = require('express');
var router = express.Router();

const userController = require("../controllers/userController");

/* GET users listing. */
router.get('/', userController.users_get);

// Create new user
router.post("/", userController.users_post);

//User login
router.post("/login", userController.users_login_post);

module.exports = router;
