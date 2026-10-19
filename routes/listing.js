const express=require("express");
const router=express.Router();
const Listing=require("../models/listing.js");
const wrapAsync=require("../utils/wrapAsync.js");
const expressError=require("../utils/expressError.js");
const {listingSchema}=require("../schema.js");
const {isLoggedIn, isOwner}=require("../middleware.js");
const listingController=require("../controllers/listings.js");
const multer=require("multer");
const {storage}=require("../cloudConfig.js")
const upload=multer({storage})

const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
   if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new expressError(400,errMsg);
   } else{
     next();
   }
}

router.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn, upload.single('listing[image]'),validateListing, wrapAsync(listingController.create))

// WanderMatch: personalized, explainable accommodation matching
router.get("/match", wrapAsync(listingController.match));

//new
router.get("/new",isLoggedIn,listingController.newForm);

router.route("/:id")
.get(wrapAsync(listingController.show))
.put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing,wrapAsync(listingController.update))
.delete(isLoggedIn, isOwner, wrapAsync(listingController.destroy))

//edit
router.get("/:id/edit",isLoggedIn, isOwner, wrapAsync(listingController.edit));



module.exports=router;