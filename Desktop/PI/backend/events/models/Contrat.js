const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  nom: String,
  prenom: String,
  filename: String,         // nom du fichier dans GridFS
  uploadDate: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Contrat', contratSchema);
