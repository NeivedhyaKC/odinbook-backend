module.exports.isUserAuthenticated = (req,res,next) =>
{
    if (req.user)
    {
        next();    
    }
    else
    {
        res.status(401).json({msg: "You must login first"});    
    }
}