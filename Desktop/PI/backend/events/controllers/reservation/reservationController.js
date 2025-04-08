const {Reservation} = require('../../models/reservation');
const { Event } = require('../../models/event');
const stripe = require('stripe')('sk_test_51RAK8z4CJsmk8OWqXOkOOrJcPmwWEAU1Xu7H0zUNlYaP3h68ekpGhqbtgD9EmmN7KBEVE5iKRz4mm1Zl2Dnsn9A500n9f4IfU1');


exports.addreservation = async function(req, res, next) {
  try {
    const { event, Nom, Prenom, Nbticket, token } = req.body;

    // Vérifier que l'événement existe
    const evenement = await Event.findById(event);
    if (!evenement) {
        return res.status(404).json({ message: "Événement non trouvé." });
    }

    // Vérifier si le nombre de places restantes est suffisant
    if (evenement.NbPersonne < Nbticket) {
        return res.status(400).json({ message: `Nombre de places insuffisant pour l'événement ${evenement.Nom}.` });
    }

    // Calculer le montant total à payer
    const montantTotal = evenement.Prix * Nbticket;  // Montant total en centimes

    // Créer une intention de paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantTotal, // Montant en centimes
      currency: 'EUR', // Devise
      payment_method_data: {
        type: 'card', // Type de paiement
        card: {
          token: token, // Passe le token ici dans card[token]
        },
      },
      automatic_payment_methods: {
        enabled: true, // Active les méthodes de paiement automatiques
        allow_redirects: 'never', // Ne permet pas les redirections
      },
    });

    // Confirmer ensuite le `PaymentIntent` une fois qu'il a la méthode de paiement
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentIntent.payment_method, // Le token est utilisé ici pour confirmer
    });

    if (confirmedPaymentIntent.status === 'succeeded') {
        // Si le paiement est réussi, créer la réservation
        const nouvelleReservation = new Reservation({
            event,
            Nom,
            Prenom,
            Nbticket
        });

        // Sauvegarder la réservation
        const reservationSauvegardee = await nouvelleReservation.save();

        // Mise à jour du nombre de personnes restantes dans l'événement
        evenement.NbPersonne -= Nbticket;
        await evenement.save();

        res.json({
            message: "Réservation réussie et paiement effectué",
            reservation: reservationSauvegardee,
            eventUpdated: evenement
        });
    } else {
        res.status(400).json({ message: "Le paiement a échoué, veuillez réessayer." });
    }
} catch (error) {
    console.error("Erreur de paiement ou de réservation", error);
    next(error);  // Pour une gestion d'erreur globale plus propre
}
};

  
  
 exports.getreservation =async (req,res,next)=>{
    const reserv = await Reservation.find();
    res.json(reserv);
};

exports.getreservsByName = async (req,res,next)=>{
    const reserv = await Reservation.find({Nom : req.params['Nom']});
    res.json(reserv);
};

exports.updateRsrv = async (req, res, next) => {
    const { id } = req.params;
    const reserv = await Reservation.findByIdAndUpdate(id, {
        Nom: req.body.Nom, 
        Prenom: req.body.Prenom,
        Nbticket: req.body.Nbticket,
        
    });
    res.json(reserv);

};

 exports.deleteReservation = async (req, res, next)=>{
    const { id } = req.params;
    await Reservation.findByIdAndDelete(id);
    res.send('Reservation supprimé');
};


