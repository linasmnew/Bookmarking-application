var bcrypt = require('bcryptjs');

module.exports = function(connection,passport,LocalStrategy){
//'login' is the name of the strategy which we will use to identify this strategy
//later
/*
argument 1: we give a name to the strategy which we will use to identify this strategy later
argument 2: the type of strategy that we want to create, here we use the
            username & password or the LocalStrategy
by default LocalStrategy expects to find user credentials in username & password
parameters but it allows us to use any other named parameters as well
*/
  passport.use('local-login', new LocalStrategy({
    //this config variable allows us to access the request object in the callback,
    //thereby enabling us to use any parameter associated with the request
      passReqToCallback: true
    },
    //this is the callback that we mentioned above
    //done denotes a method using which we could signal success or failure to passport module
    //to signify failure: either the first param should contain the error or the second
                        //param should evaluate to false
    //to signify success: the first parameter should be null and the second parameter
                       // should evaluate to a truthy value, in which case it will be
                       // made available on the request object
      function(req, username, password, done){
      //check in mongo if a user with username exists or not

      req.sanitize("username").escape();
      req.sanitize("password").escape();

      req.sanitize("username").trim();
      req.sanitize("password").trim();

      req.checkBody("username", "Enter a valid username").notEmpty().isAlphanumeric().len(1,32);
      req.checkBody("password", "Enter a valid password").notEmpty().isAlphanumeric().len(5);

      var errors = req.validationErrors();

      if(errors){
        console.log(errors);
        return done(null, false, req.flash('login', 'Invalid username/password provided'));
      }else{


        connection.query('SELECT * FROM user WHERE username = ?', username, function(err, rows){
          if(err){
             return done(err,null);
           }
           //if user doesn't exist
           if(rows.length==0){
             return done(null, false, req.flash('login', 'Incorrect username'));
           }
           //if password is incorrect
           if(!validPassword(password, rows[0])){
             console.log('incorrect pass');
             return done(null, false, req.flash('login','Incorrect Password'));
           }
           //if everything is correct, return the user
           return done(null, rows[0]);
        });


      }//end errors else
    }//end function with username,pass,done etc
  ));//end passport use

  var validPassword = function(password, user){
    return bcrypt.compareSync(password, user.password);
  }

}
