var isauth = require('../passport/auth.js');

module.exports = function(app){

  app.use('/', require('./routes/index'));
  app.use('/pages', require('./routes/pages'));
  app.use('/user',isauth, require('./routes/user'));

};
