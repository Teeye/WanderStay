const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");
const userController=require("../controllers/users.js")

const { saveRedirectUrl } = require("../middleware.js");


router.route("/signup")
.get(userController.getSignUp)
.post(wrapAsync(userController.createSignUp))


router.route("/login")
.get(userController.getLogin)
.post(saveRedirectUrl,
    passport.authenticate
    ("local",
        {
            failureRedirect:"/login", 
            failureFlash:true
        }),userController.createLogin)

//logout
router.get("/logout",userController.logout)

module.exports=router;