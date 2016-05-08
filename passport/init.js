var LocalStrategy = require('passport-local').Strategy;
var register = require('./register');
var login = require('./login');
var connection = require('../models/db_mysql.js');

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
  //only store user id in the session, storing the whole object
  //and sending it back and forth is slow
  //(basically - the key of user object you provide in the second argument of done
  // is saved in the session, and thats what is used to retrieve the WHOLE object
  // via deserialize function below)
  passport.serializeUser(function(user, done) {
      //console.log('serializing user: ');console.log(user);
      done(null, user.id);
  });

  //then use that user id to find the user and get back the user object
  //basiclaly the whole object is retrvied with the help of id (though that could
  //be any other key of the user object e.i their name, email et.c)
  //the result of this function is attached to req.user
  passport.deserializeUser(function(id, done) {
    connection.query('SELECT * from user where id ='+id, function(err, rows){
      done(err, rows);
    });
  });

  // Setting up Passport Strategies for Login
  register(connection,passport,LocalStrategy);
  login(connection,passport,LocalStrategy);

}
