const User=require("../models/user");

module.exports.getSignUp=(req,res)=>{
    res.render("users/signup.ejs")
}

module.exports.createSignUp=async(req,res)=>{
    try{
    let{username,email,password}=req.body;
    const user1=new User({email,username});
    let result=await User.register(user1,password);
    console.log(result);
    req.login(result,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Welcome to WanderStay")
    res.redirect("/listings");
    })
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup")
    }
}

module.exports.getLogin=(req,res)=>{
    res.render("users/login.ejs")
}

module.exports.createLogin=async(req,res)=>{
            req.flash("success","Logged in successfully ");
            res.redirect(res.locals.redirectUrl || "/listings")
}

module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You're logged out!");
        res.redirect("/listings")
    })
}