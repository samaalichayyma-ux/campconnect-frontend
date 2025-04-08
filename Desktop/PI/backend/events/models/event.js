const mongoose = require("mongoose");
const yup = require('yup');
const AutoIncrement = require("mongoose-sequence")(mongoose);


const event = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    id:Number,
    Nom: String,
    Lieu: String,
    Date: Date,
    Heure: String,
    durée:Number,
    NbPersonne: Number,
    email: String,
    Prix:Number, 
    Image: String, 
    Type: { 
        type: String, 
        enum: ["Comédie", "Drame", "Concert", "Action", "Amour" ,"Autre"] 
    },
    Statu: { 
        type: String, 
        enum: ["en cours", "accepté", "refusé"],
         default: "en cours"
    }
});


event.plugin(AutoIncrement, { inc_field: "id" });

const Event = mongoose.model("events", event);
const eventsSchema = yup.object({
    body: yup.object({
        Nom: yup.string()
            .min(3, "Le nom doit contenir au moins 3 caractères")
            .max(15, "Le nom ne peut pas dépasser 15 caractères")
            .required("Le nom est obligatoire"),
        Lieu: yup.string().min(3).max(15).required(),
        Date: yup.date()
            .typeError("Veuillez entrer une date valide")
            .required("La date est obligatoire"),
        
        Heure: yup.string()
            .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Format de l'heure invalide (HH:mm)")
            .required("L'heure est obligatoire"),
        Prix: yup.number().min(0).required(),
        durée: yup.number().min(0).required(),

        NbPersonne: yup.number().min(0).required(),
        Type: yup.string()
            .oneOf(["Comédie", "Drame", "Concert", "Action", "Amour", "Autre"], "Type invalide")
            .required(),
        Statu: yup.string()
            .oneOf(["en cours", "accepté", "refusé"], "Statu invalide")
            .required(),
    })
});


module.exports = {Event, eventsSchema};
