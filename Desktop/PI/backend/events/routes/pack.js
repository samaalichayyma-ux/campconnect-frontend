const express =  require('express');
const router = express.Router();
const {Pack,packSchema} = require('../models/pack');
const validate = require('../middelwares/validate');

const {addpacks,getpacks,getPackByName,updatePack,deletePack} = require('../controllers/pack/packController');


router.post('/packs', validate(packSchema), addpacks )

router.get('/packs',getpacks)

router.get('/getPackByName/:Name', getPackByName)

router.put("/updatePack/:id" , validate(packSchema), updatePack)

router.delete('/deletePack/:id',deletePack) 


module.exports = router;
