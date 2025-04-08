const {Event} = require('../../models/event');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mounahamrouni43@gmail.com",
        pass: "pnma nkhu fivy fzkf",  
    },
});
exports.addevent = async (req, res) => {
    try {
        // Vérifie que l'image est bien envoyée
        if (!req.file) {
          return res.status(400).json({ message: "Le fichier image est requis" });
        }
    
        req.body.Image = req.file.filename; 
        req.body.userId = "66149dcfcbac8d2c0a9b0192";
    
        const event = new Event(req.body);
        await event.save();
    
        // Envoi d'e-mail
        const mailOptions = {
          from: "mounahamrouni43@gmail.com",
          to: event.email,
          subject: "Demande Nouvel Événement en cours !",
          text: `Bonjour,\n\nVotre événement "${event.Nom}" a bien été soumis. Il est en cours de traitement et sera évalué sous 24 heures.\n\nVous recevrez une confirmation dès qu'il sera accepté ou refusé.\n\nMerci de votre patience !\n\nCordialement,\nEVENTO`,
        };
    
        await transporter.sendMail(mailOptions);
    
        res.status(201).send({
          message: "Événement créé avec succès et e-mail envoyé",
          event,
        });
    
      } catch (error) {
        res.status(500).send({
          message: "Erreur lors de la création de l'événement",
          error: error.message,
        });
      }
    
};


exports.updateEvent =  async (req, res, next) => {
    try {
        const { id } = req.params;
        const newEvent = await Event.findByIdAndUpdate(id, {
            Nom: req.body.Nom, 
            Lieu: req.body.Lieu,
            Heure: req.body.Heure,
            durée:req.body.durée,
            NbPersonne: req.body.NbPersonne,
            email: req.body.email,
            Prix: req.body.Prix,
            Date: req.body.Date,
            Image: req.body.Image,
            Type: req.body.Type,
            Statu: req.body.Statu,
        }, { new: true }); // new: true pour retourner le document mis à jour

        // Vérifie si le statut a changé en "accepté"
        if (newEvent.Statu === "accepté") {
            const mailOptions = {
                from: "mounahamrouni43@gmail.com",
                to: newEvent.email,
                subject: "Votre événement a été accepté ! 🎉",
                text: `Bonjour,\n\nVotre événement "${newEvent.Nom}" a été accepté ! 🎉\n\nMerci d'avoir utilisé notre plateforme.\n\nCordialement, L'équipe.`
            };

            await transporter.sendMail(mailOptions); // Envoi de l'email
        }

        // Envoie la réponse après l'envoi de l'email
        res.json({ message: "Événement mis à jour avec succès", event: newEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement", error: error.message });
    }
};

exports.getEventByLieu =  async (req,res,next)=>{
    const event = await Event.find({Lieu : req.params['Lieu']});
    res.json(event);
};

 exports.deleteEvent = async (req, res, next)=>{
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.send('Evenement supprimé');
};


exports.getEventByType = async (req,res,next)=>{
    const event = await Event.find({Type : req.params['Type']});
    res.json(event);
};


exports.getevent = async (req,res,next)=>{
    const events = await Event.find();
    res.json(events);
};