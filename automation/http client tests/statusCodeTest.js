var request = require('superagent');
var expect = require('expect.js');

describe('basic functionality testing', function(req){

  it('login page should respond with 200', function(done){
    request.get('http://localhost:3000/login').end(function(err, res){
      expect(res.status).to.equal(200);
      done();
    });
  });

  it('register page should respond with 200', function(done){
    request.get('http://localhost:3000/register').end(function(err, res){
      expect(res.status).to.equal(200);
      done();
    });
  });

  it('home page should respond with 200', function(done){
    request.get('http://localhost:3000/').end(function(err, res){
      expect(res.status).to.equal(200);
      done();
    });
  });




});
