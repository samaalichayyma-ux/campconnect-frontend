const express =  require('express');
const router = express.Router();
const {Reservation,reservSchema} = require('../models/reservation');
const validate = require('../middelwares/validate');
const { Event } = require('../models/event');
const {addreservation,getreservation,getreservsByName,updateRsrv,deleteReservation} = require('../controllers/reservation/reservationController');


router.post('/reservation', validate(reservSchema), addreservation) 

router.get('/reservs', getreservation) 

router.get('/getreservsByName/:Nom', getreservsByName )

router.put("/updateRsrv/:id" , validate(reservSchema),updateRsrv) 

router.delete('/deleteReservation/:id', deleteReservation ) 


module.exports = router;
