const express =  require('express');
const {Pack} = require('../../models/pack');


exports.addpacks = async (req , res, next)=>{
    const pack = new Pack(req.body);
    await pack.save();
    res.status(201).send({ message: "pack créé avec succès", pack });
} ;

exports.getpacks = async (req,res,next)=>{
    const packs = await Pack.find();
    res.json(packs);
};

 exports.getPackByName =async (req,res,next)=>{
    const pack = await Pack.find({Name : req.params['Name']});
    res.json(pack);
};

 exports.updatePack = async (req, res, next) => {
    const { id } = req.params;
    const newPack = await Pack.findByIdAndUpdate(id, {
        Name: req.body.Name, 
        Description: req.body.Description,
        
    });
    res.json(newPack);

}
exports.deletePack = async (req, res, next)=>{
    const { id } = req.params;
    await Pack.findByIdAndDelete(id);
    res.send('Pack supprimé');
};

