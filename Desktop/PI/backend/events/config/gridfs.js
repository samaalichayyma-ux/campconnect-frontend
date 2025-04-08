const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

// Créer une nouvelle connexion Mongoose (indépendante de l'autre)
const conn = mongoose.createConnection(require('./db.json').mongo.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('contracts'); // nom de la collection GridFS
  console.log('GridFS initialisé !');
});

module.exports = { conn, gfs };
