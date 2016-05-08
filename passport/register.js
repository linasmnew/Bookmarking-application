var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var mailTransport = nodemailer.createTransport('smtps://emailUsername:emailPassword@smtp.gmail.com');

module.exports = function(connection,passport,LocalStrategy){

  passport.use('local-registration', new LocalStrategy({
    passReqToCallback: true
  },
  function(req, username, password, done) {
    //add a check for spaces inbetween words
    req.sanitize("username").escape();
    req.sanitize("password").escape();
    req.sanitize("email").escape();

    req.sanitize("username").trim();
    req.sanitize("password").trim();
    req.sanitize("email").trim();

    req.checkBody("username", "Enter a valid username").notEmpty().isAlphanumeric().len(1,32);
    req.checkBody("password", "Enter a valid password").notEmpty().isAlphanumeric().len(5);
    req.checkBody("email", "Enter a valid email address").notEmpty().isEmail().len(4,320);

    var errors = req.validationErrors();

    if(errors){
  console.log(errors);
      //access errors which is in the following format
      // [ { param: 'email', msg: 'enter a valid email address', value: 'example@gmail.com//' } ]
      // for(var i=0; i<errors.length; i++){
      //   errorMessage += errors[i].msg;
      // }
      return done(null, false, req.flash('registration-validation', errors));
    }else{

    findOrCreateUser = function(){
      //Check if username is unique
      connection.query('select * from user where username = ? OR email = ?',[username, req.body.email], function(err,rows){
        if(err){
           return done(err,null);
         }
         if(rows.length>0){
           if(rows[0].username === username){
             return done(null, false, req.flash('registration-exists', 'username already exists'));
           }else if(rows[0].email === req.body.email){
             return done(null, false, req.flash('registration-exists', 'email already exists'));
           }
        }else{


          console.log('hashing');
          //if username is unique create the user

          var seed = crypto.randomBytes(20);
          var authToken = crypto.createHash('sha1').update(seed+req.body.email).digest('hex');

          var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));


          var userObject = new Object();
          userObject.username = username;
          userObject.email = req.body.email;
          userObject.password = hash;
          userObject.authToken = authToken;

          var post = {username: username, email: req.body.email, password:hash, authToken: authToken};
          connection.query('INSERT INTO user SET ?', post, function(err, rows){
            //mysql library exposes users id from insert query inside insertID field
            userObject.id = rows.insertId;


            var authenticationURL = 'http://localhost:3000/verify_email?token='+userObject.authToken;

            //send email here
            mailTransport.sendMail({
              from: '"Bookmarky" <do-not-reply@bookmarky.com>',
              to: userObject.email,
              subject: 'Confirm your email address',
              html: '<a target=_blank href=\"'+ authenticationURL +'\">Confirm your email</a>',
              generateTextFromHtml: true,
            }, function(err){
              if(err) console.error('Unable to send email: '+err);
            });

            console.log('sent email');


            return done(null, userObject, req.flash('registration-validation', 'Registered'));
          });


        }
      });//end check for uniqueness


    };

}

    process.nextTick(findOrCreateUser);
  }));
}
