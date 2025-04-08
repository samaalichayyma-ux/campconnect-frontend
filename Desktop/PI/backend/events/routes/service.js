const express =  require('express');
const router = express.Router();
const {Service,servicesSchema} = require('../models/service');
const validate = require('../middelwares/validate');
const nodemailer = require("nodemailer");

const {addservice , getservice,getserviceByPack,updateService,deleteService} = require('../controllers/service/serviceController');

router.post('/service', validate(servicesSchema), addservice)

router.get('/service', getservice)

router.get('/getserviceByPack/:pack', getserviceByPack)
router.put("/updateService/:id", updateService)
router.delete('/deleteService/:id',deleteService) 

module.exports = router;
