const mongoose = require("mongoose");
const yup = require('yup');

const service = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    id: Number,
    nom: String,
    prenom: String,
    email: String,
    adresse: String,
    telephone: String,
    date: Date,
    pack: { 
        type: String, 
        enum: ["BRONZE", "GOLD", "DIAMOND", null], 
        default: null 
    },
    budget: Number,
    nombreInvites: Number,
    autresInfos: String,
    statu: { 
        type: String, 
        enum: ["en cours", "traité"],
         default: "en cours"
    }
});

const Service = mongoose.model("services", service);
const servicesSchema = yup.object({
   
        body: yup.object({
            nom: yup.string()
                .min(2, "Le nom doit contenir au moins 2 caractères")
                .max(30, "Le nom ne peut pas dépasser 30 caractères")
                .required("Le nom est obligatoire"),
            prenom: yup.string().min(2).max(30).required(),
            email: yup.string()
                .email("Format d'email invalide")
                .required("L'email est obligatoire"),
            adresse: yup.string().min(5).max(50).required(),
            telephone: yup.string()
                .matches(/^[0-9]{8,15}$/, "Numéro de téléphone invalide")
                .required(),
            date: yup.date()
                .typeError("Veuillez entrer une date valide")
                .required("La date de l'événement est obligatoire"),
            pack: yup.string()
                .oneOf(["DIAMOND", "GOLD", "BRONZE", null])
                .nullable(),
            budget: yup.number().min(0).nullable(),
            nombreInvites: yup.number().min(1).nullable(),
            autresInfos: yup.string().nullable(),
            statu: yup.string()
                        .oneOf(["en cours", "traité"]).required(),
        })
        
});




module.exports = {Service, servicesSchema};
