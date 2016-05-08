var express = require('express');
var nodemailer = require('nodemailer');
var mailTransport = nodemailer.createTransport('smtps://linasbjj%40gmail.com:Imeer17Tea7C1zw@smtp.gmail.com');
var router = express.Router();
var passport = require('passport');
var connection = require('../../models/db_mysql.js');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
};


router.get('/', function(req, res, next){
  	res.render('index', {message: req.flash('registration-validation')});
});

router.post('/', passport.authenticate('local-registration', {
	  successRedirect: '/user',
	  failureRedirect: '/register',
	  failureFlash: true,
}));

router.get('/login', function(req, res){
  res.render('login', {message: req.flash('login')});
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/user',
  failureRedirect: '/login',
  failureFlash: true,
}));

router.get('/home', isAuthenticated, function(req, res){
  res.render('home', {user: req.user });
});

router.get('/register', function(req, res){
  res.render('register', {alreadyExists: req.flash('registration-exists'), registrationValidation: req.flash('registration-validation')});
});

router.post('/register', passport.authenticate('local-registration', {
  successRedirect: '/user',
  failureRedirect: '/register',
  failureFlash: true,
}));



router.post('/check_username', function(req, res){
	var username = req.body.username;

	connection.query("SELECT * FROM user WHERE username = ?", username, function(err, rows){
    if(err){
       console.error(err);
			 res.json({success: 'error', data: 'Try again, there was an issue with the database connection'});
     }else if(rows[0]){
			 res.json({success: 'unavailable', data: 'The username is already taken'});
     }else{
			 res.json({success: 'available', data: 'The username is available'});
		 }
  });


});



function updateUserStatusAndSendConfirmationEmail(res, rows){
	var post = {verified: 1, authToken: ' '};
	connection.query("UPDATE user SET ? WHERE id = ?", [post, rows[0].id], function(err, updatedRows){
		 if(err) return console.error(err);
		 mailTransport.sendMail({
			 from: '"Bookmarky" <do-not-reply@bookmarky.com>',
			 to: rows[0].email,
			 subject: 'Email confirmed',
			 html: 'Thank you! Your email has been confirmed',
			 generateTextFromHtml: true,
		 }, function(err){
			 if(err) console.error('Unable to send email: '+err);
		 });
		 res.render('index');
	 });
}

function matchTokenWithUser(req, res, cb){
	connection.query("SELECT * FROM user WHERE authToken = ?", req.query.token, function(err, rows){
		if(err) return console.error(err);
		 cb(res, rows);
	 });
}

router.get('/verify_email', function(req, res){
	matchTokenWithUser(req, res, updateUserStatusAndSendConfirmationEmail);
});




module.exports = router;
