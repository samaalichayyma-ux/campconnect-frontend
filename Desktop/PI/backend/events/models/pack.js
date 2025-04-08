const mongoose = require("mongoose");
const yup = require('yup');



const pack = new mongoose.Schema({
    id:Number,
    Name: String,
    Description: String,
  
});

const Pack = mongoose.model("packs", pack);
const packSchema = yup.object({
    body: yup.object({
        Name: yup.string().min(3,"Le nom doit contenir au moins 3 caractères").required(),
        Description: yup.string().required(),
    })
});


module.exports = {Pack, packSchema};
