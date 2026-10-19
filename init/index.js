const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listing.js");

main().then(res=>console.log("connected successfully"))
.catch(err=>console.log(err));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/WanderStay")
}

const initDB=async()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:"6ac79e8438ab22458825edcf"}))
    await Listing.insertMany(initData.data);
    console.log("data saved");
}

initDB();