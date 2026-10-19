const { response } = require("express");
const Listing=require("../models/listing");
const mbxGeocoding=require('@mapbox/mapbox-sdk/services/geocoding')
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async(req,res,next)=>{
    const searchTerm = (req.query.search || "").trim();
    let filter = {};

    // Escape regex special characters so user input is treated as plain text.
    if (searchTerm) {
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedTerm, "i");
        filter = {
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { idealFor: searchRegex },
                { amenities: searchRegex }
            ]
        };
    }

    const listings = await Listing.find(filter).sort({ _id: -1 });
    res.render("listings/index.ejs", { listings, searchTerm });
}

// WanderMatch is a transparent rules-based matcher, not an AI claim.
module.exports.match=async(req,res,next)=>{
    const {budget, purpose} = req.query;
    const selectedAmenities = req.query.amenities
        ? (Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities])
        : [];
    let listings = [];
    let hasSearched = Object.keys(req.query).length > 0;

    if (hasSearched) {
        const allListings = await Listing.find();
        listings = allListings.map(listing => {
            let rawScore = 0;
            let possibleScore = 0;
            let reasons = [];
            const maxBudget = Number(budget);

            if (budget && Number.isFinite(maxBudget) && maxBudget > 0) {
                possibleScore += 40;
                if (listing.price <= maxBudget) {
                    rawScore += 40;
                    reasons.push("Within your budget");
                } else {
                    const overBy = (listing.price - maxBudget) / maxBudget;
                    rawScore += Math.max(0, 40 - Math.ceil(overBy * 40));
                }
            }

            if (purpose) {
                possibleScore += 30;
                if (listing.idealFor && listing.idealFor.includes(purpose)) {
                    rawScore += 30;
                    reasons.push("Fits your stay purpose");
                }
            }

            if (selectedAmenities.length) {
                possibleScore += 30;
                const listingAmenities = listing.amenities || [];
                const matched = selectedAmenities.filter(a => listingAmenities.includes(a));
                rawScore += Math.round(30 * matched.length / selectedAmenities.length);
                if (matched.length) reasons.push(matched.length + " of " + selectedAmenities.length + " preferred amenities");
            }

            const score = possibleScore ? Math.round(rawScore / possibleScore * 100) : 0;
            return { listing, score, reasons };
        }).sort((a,b) => b.score - a.score);
    }
    res.render("listings/match.ejs", { listings, budget: budget || "", purpose: purpose || "", selectedAmenities, hasSearched });
}

module.exports.newForm=(req,res)=>{
    res.render("listings/new.ejs")
}

module.exports.show=async(req,res,next)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id).populate({path: "reviews", populate:{path:"author",},}).populate("owner");
    if(!listing){
        req.flash("error","listing does not exist");
        return res.redirect("/listings")
    }
    res.render("listings/show.ejs",{listing});
}

module.exports.create=async(req,res,next)=>{
    let result=await geocodingClient.forwardGeocode({
        query:req.body.listing.location,
        limit:1,
    })
    .send()

    let url=req.file.path;
    let filename=req.file.filename;

    let listing= new Listing(req.body.listing);
    listing.owner = req.user._id;
    listing.image={url,filename};
    listing.geometry=result.body.features[0].geometry;
    await listing.save();
    req.flash("success","listing added successfully")
    res.redirect("/listings")
}

module.exports.edit=async(req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","listing does not exist");
        return res.redirect("/listings")
    }
    let oriImgUrl=listing.image.url;
    oriImgUrl= oriImgUrl.replace("/upload", "/upload/h_200,w_300")
    res.render("listings/edit.ejs", {listing, oriImgUrl});
}

module.exports.update=async(req,res,next)=>{

    let {id}=req.params;
    const updateData = {
        ...req.body.listing,
        idealFor: req.body.listing.idealFor
            ? (Array.isArray(req.body.listing.idealFor) ? req.body.listing.idealFor : [req.body.listing.idealFor])
            : [],
        amenities: req.body.listing.amenities
            ? (Array.isArray(req.body.listing.amenities) ? req.body.listing.amenities : [req.body.listing.amenities])
            : []
    };
    let listing= await Listing.findByIdAndUpdate(id, updateData);

    if(typeof req.file !== "undefined"){
     let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
 }

    req.flash("success","listing updated successfully")
    res.redirect(`/listings/${id}`);
}

module.exports.destroy=async(req,res,next)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","listing deleted successfully")
    res.redirect("/listings");
}