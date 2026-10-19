const Joi = require("joi")

module.exports.listingSchema=Joi.object({
    listing:Joi.object({
        title:Joi.string().required(),
        description:Joi.string().required(),
        location:Joi.string().required(),
        country:Joi.string().required(),
        price:Joi.number().required().min(0),
        idealFor:Joi.array().items(Joi.string().valid("Student", "Work", "Family", "Short stay")).single(),
        amenities:Joi.array().items(Joi.string().valid("Wi-Fi", "Kitchen", "Workspace", "Laundry", "Parking", "Public transport nearby")),
        image:Joi.string().allow("",null),
    }).required()
})

module.exports.reviewSchema=Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required(),
    }).required()
})