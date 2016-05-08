var bodyParser = require('body-parser');
var validator = require('express-validator');
var expressSession = require('express-session');
var bcrypt = require('bcryptjs');
var csrf = require('csurf');
var express = require('express');

var passport = require('passport');
var handlebars = require('express3-handlebars').create({
  defaultLayout:'main',
  helpers: {
    section: function(name, options){
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }});


var app = express();



app.set('port', process.env.PORT || 3000);
app.disable('x-powered-by');

//view engine
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


var initPassport = require('./passport/init');
initPassport(passport);

app.use(bodyParser.urlencoded({extended: true}));
app.use(validator());

app.use(express.static(__dirname + '/public'));

app.use(expressSession({
  secret: 'dasdasdasdsaw',
  resave: true,
  saveUninitialized: false,
}));

app.use(passport.initialize());

app.use(passport.session());

var flash = require('connect-flash');
app.use(flash());

//makes csrfToken() available for us in the request object
// app.use(csrf());
// app.use(function(req, res ,next){
//   res.locals._csrfToken = req.csrfToken();
//   next();
// });

var router = require('./router/index')(app);

app.use(function(req,res,next){
  res.status(404);
  res.render('404');
});

app.use(function(err,req,res,next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started press Ctrl-C to terminate');
});
