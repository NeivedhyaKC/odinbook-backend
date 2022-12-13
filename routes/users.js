var express = require('express');
var router = express.Router();

const userController = require("../controllers/userController");

const verifyToken = (req,res,next) =>
{
    const token = req.headers['authorization'];
    if (token !== undefined)
    {
        req.token = token;
        next();
    }
    else
    {
        res.sendStatus(403);    
    }
}

/* GET users listing. */
router.get('/', [verifyToken,userController.users_get]);

// Create new user
router.post("/", userController.users_post);

module.exports = router;
