const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]); //everytime mongodb atlas connected, this issue arises, so dns server error so to resolve the error, here is the result of the problem to solve dns issue

if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}
//console.log(process.env)

const express=require("express");
const app=express();
const path=require("path");
const mongoose=require("mongoose");

const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");

const expressError=require("./utils/expressError.js");
const session=require("express-session");
const MongoStore = require("connect-mongo").default;
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js")

const listingRoute=require("./routes/listing.js")
const reviewRoute=require("./routes/review.js");
const userRoute=require("./routes/user.js");

const dbUrl= process.env.ATLASDB_URL
//"mongodb://127.0.0.1:27017/WanderStay"

main().then(res=>console.log("connected successfully"))
.catch(err=>console.log(err));

async function main(){
    await mongoose.connect(dbUrl)
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
})

store.on("error",()=>{
    console.log("error in mongo session store", err);
})

app.use(session(
    {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
    }
));
app.use(flash());

app.use(passport.initialize())
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})

app.get("/demoUser",async(req,res)=>{
    let fakeUser=new User({
        email:"delta@gmail.com",
        username:"delta",
    })
    let result=await User.register(fakeUser,"helloworld");
    res.send(result);
})

app.use("/listings",listingRoute);
app.use("/listings/:id/reviews",reviewRoute);
app.use("/",userRoute)



app.all("/{*splat}",(req,res,next)=>{
    next(new expressError(404,"page not found"));
});
app.use((err,req,res,next)=>{
   let{status=404,message}=err;
   res.status(status).render("error.ejs",{message});
  //res.status(status).send(message);
})
app.listen(8080,()=>{
    console.log("app listening");
})


/*

app.get("/listing",(req,res)=>{
   let sample=new Listing({
    title:"My New Villa",
    description:"by the beach",
    price:1200,
    location:"Calangute, Goa",
    country:"India",
   })
   sample.save();
   console.log("saved");
   res.send("listing done");
})

*/