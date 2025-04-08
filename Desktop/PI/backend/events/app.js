var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');



const mongoose= require ("mongoose")
const configDb = require ("./config/db.json")

var eventsRouter = require('./routes/event');
var packsRouter = require('./routes/pack');
var reservsRouter = require('./routes/reservation');
var servicesRouter = require('./routes/service');






var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'http://localhost:4200', // URL de ton frontend Angular
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use('/uploads', express.static('uploads'));




app.use('/', eventsRouter);
app.use('/', packsRouter);
app.use('/', reservsRouter);
app.use('/', servicesRouter);








// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


mongoose.connect(configDb.mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connexion à MongoDB réussie !');
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB :', err);
  });


module.exports = app;
