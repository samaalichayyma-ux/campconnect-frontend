
const {Service} = require('../../models/service');
const nodemailer = require("nodemailer");
const { conn } = require('../../config/gridfs');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');               
const { getGfs } = require('../../config/gridfs');
const PDFDocument = require('pdfkit');          // 👈 génération PDF
const fs = require("fs");
const path = require("path");


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mounahamrouni43@gmail.com",
        pass: "pnma nkhu fivy fzkf",  
    },
});
exports.addservice =   async (req, res, next)=>{
    try {
        const serv = new Service(req.body);
        await serv.save();
            const mailOptions = {
                from: "mounahamrouni43@gmail.com",
                to: serv.email,  
                subject: "Nouvel Événement Créé !",
                text: `Bonjour,\n\nVotre demande d organisation d' événement  a bien été soumis.\nIl est en cours de traitement et sera évalué sous 24 heures.\n\non vous contactera le plus tot possible \n\ Restez joignable \n\nMerci de votre patience !`,
            };
    
            await transporter.sendMail(mailOptions);
    
            res.status(201).send({ message: "Demande créé avec succès et e-mail envoyé", serv });
    
        } catch (error) {
            res.status(500).send({ message: "Erreur lors de la création de la demande ", error: error.message });
        }
};



 exports.getservice = async (req,res,next)=>{
    const serv = await Service.find();
    res.json(serv);
};

exports.getserviceByPack = async (req, res, next) => {
    try {
        let pack = req.params['pack'];
        if (pack === "null") {
            pack = null;
        }
        const serv = await Service.find({ pack: pack });
        res.json(serv);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des services", error });
    }
};

 exports.deleteService = async (req, res, next)=>{
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.send('service supprimé');
};

exports.updateService = async (req, res, next) => {
    const { id } = req.params;
    const updatedService = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  
    if (req.body.statu === "traité") {
      const pdfBuffer = await generateContractPDF(updatedService);
      const filename = `contract-${updatedService._id}.pdf`;
      await savePDFToGridFS(pdfBuffer, filename);
      await sendEmailWithAttachment(updatedService.email, pdfBuffer, filename);
    }
  
    res.json(updatedService);
  };
  
  // Génération du PDF avec pdfkit
  async function generateContractPDF(service) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
  
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
  
      // Logo Evento
      const logoPath = path.join(__dirname, "evento-logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 60 });
      }
  
      // Titre
      doc
        .fontSize(20)
        .text("CONTRAT DE PRESTATION DE SERVICE", { align: "center" })
        .moveDown();
  
      // Infos entreprise
      doc
        .fontSize(10)
        .text("Evento - Organisation d'Événements", { align: "center" })
        .text("www.evento.com | contact@evento.com", { align: "center" })
        .moveDown(2);
  
      // Infos client
      doc
        .fontSize(12)
        .text("Informations du client", { underline: true })
        .moveDown(0.5)
        .text(`Nom : ${service.nom}`)
        .text(`Prénom : ${service.prenom}`)
        .text(`Adresse : ${service.adresse}`)
        .text(`Téléphone : ${service.telephone}`)
        .text(`Email : ${service.email}`)
        .text(`Date de l’événement : ${new Date(service.date).toLocaleDateString()}`)
        .moveDown();
  
      // Détails prestation
      doc
        .text("Détails de la prestation", { underline: true })
        .moveDown(0.5)
        .text(`Pack choisi : ${service.pack}`)
        .text(`Budget : ${service.budget} TND`)
        .text(`Nombre d'invités : ${service.nombreInvites}`)
        .text(`Informations supplémentaires : ${service.autresInfos || "N/A"}`)
        .moveDown();
  
      // Conditions
      doc
        .text("Conditions générales", { underline: true })
        .moveDown(0.5)
        .font("Times-Roman")
        .fontSize(10)
        .text(
          `1. Le prestataire s'engage à fournir les services décrits dans ce contrat conformément aux besoins exprimés par le client. `
        )
        .moveDown(0.3)
        .text(
          `2. Toute modification de la date ou des conditions initiales doit être signalée au minimum 15 jours avant l'événement. `
        )
        .text(
          `   En cas de changement de date ou d’annulation de la part du client, Evento ne pourra être tenu responsable de l’indisponibilité de certains prestataires ou services.`
        )
        .moveDown(0.3)
        .text(
          `3. Le client s'engage à verser 50% du montant total à la signature du contrat. Le solde (50%) devra être réglé le jour de l’événement.`
        )
        .moveDown(0.3)
        .text(
          `4. En cas de résiliation du contrat à moins de 10 jours de l'événement, l’acompte de 50% ne sera pas remboursé.`
        )
        .moveDown(0.3)
        .text(
          `5. Evento décline toute responsabilité en cas de force majeure (intempéries, grèves, pandémies, etc.) rendant impossible la réalisation totale ou partielle de la prestation.`
        )
        .moveDown(0.3)
        .text(
          `6. Les informations fournies par le client sont confidentielles et utilisées uniquement dans le cadre de l’organisation de l’événement.`
        )
        .moveDown(0.3)
        .text(
          `7. Toute réclamation devra être formulée par écrit dans un délai de 5 jours après l’événement.`
        )
        .moveDown(0.3)
        .text(
          `8. Ce contrat est régi par la législation tunisienne. En cas de litige, les tribunaux de Tunis seront compétents.`
        )
        .moveDown();
  
      // Signatures
      doc
        .fontSize(12)
        .text("Signature du client :", 50, doc.y + 30)
        .text("Signature du prestataire :", 300, doc.y - 15)
        .moveDown(5);
  
      // Date de génération
      doc
        .fontSize(10)
        .text("Fait à Tunis, le " + new Date().toLocaleDateString(), { align: "right" });
  
      doc.end();
    });
  }
  // Sauvegarde dans GridFS
  async function savePDFToGridFS(pdfBuffer, filename) {
    const bucket = new GridFSBucket(conn.db, {
      bucketName: "contracts",
    });
  
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "application/pdf",
    });
  
    uploadStream.end(pdfBuffer);
  }
  
  // Envoi d'email avec la pièce jointe
  async function sendEmailWithAttachment(toEmail, pdfBuffer, filename) {
    const mailOptions = {
      from: "mounahamrouni43@gmail.com",
      to: toEmail,
      subject: "Contrat de prestation",
      text: `Bonjour,\n\nVeuillez trouver ci-joint votre contrat pour la prestation demandée.\n\nMerci pour votre confiance.`,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    };
  
    await transporter.sendMail(mailOptions);
  };
