const Listing=require("./models/listing");
const Review=require("./models/review");
const ExpressError=require("./utils/expressError");
const {listingSchema, reviewSchmea}=require("./schema");

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must logged in!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}

module.exports.isReviewAuthor=async(req,res,next)=>{
    const {id, reviewId} = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found.");
        return res.redirect(`/listings/${id}`);
    }

    // Enforce review ownership on the server as well as hiding the button in the UI.
    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You can only delete your own review.");
        return res.redirect(`/listings/${id}`);
    }

    next();
}
module.exports.isOwner=async(req,res,next)=>{
    const {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing does not exist.");
        return res.redirect("/listings");
    }
    if(!listing.owner || !listing.owner.equals(req.user._id)){
        req.flash("error","You can only manage your own listings.");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
