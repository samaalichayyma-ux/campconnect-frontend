const mongoose = require("mongoose");
const yup = require('yup');

// Schéma de la réservation
const reservationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, // Référence à l'événement réservé
    Nom: { type: String, required: true },
    Prenom: { type: String, required: true },
    Nbticket: { type: Number, required: true, min: 1 },
    dateReservation: { type: Date, default: Date.now },
});

// Création du modèle de réservation
const Reservation = mongoose.model("Reservation", reservationSchema);

// Validation avec Yup pour la réservation
const reservSchema = yup.object({
    body: yup.object({
        event: yup.string().required("L'ID de l'événement est obligatoire"),
        Nom: yup.string().min(3, "Le nom doit contenir au moins 3 caractères").required(),
        Prenom: yup.string().min(3, "Le prénom doit contenir au moins 3 caractères").required(),
        Nbticket: yup.number().min(1, "Le nombre de tickets doit être supérieur à zéro").required(),
    })
});

module.exports = { Reservation, reservSchema };
