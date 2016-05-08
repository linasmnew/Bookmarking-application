var assert = require('assert'),
fs = require('fs'),
test = require('selenium-webdriver/testing'),
webdriver = require('selenium-webdriver'),
driver = new webdriver.Builder()
  .withCapabilities(webdriver.Capabilities.chrome())
  .build();


//the test suite has the ability to perform specific actions before and after all the
//individual tests have completed, for instance open the browser driver
//(which we NEED to do) and after kill the browser.
test.describe('My Website', function(){
  //a tests default timeout is 2000ms so if for whatever reason the page doesn't
  //load within that time limit the test fails so I as standard override that setting
  this.timeout(15000);
  test.before(function() {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();
  });
  test.after(function() {
    driver.quit();
  });
});





test.it('Login form should return success', function(done){
  driver.get('http://localhost:3000/login');
  driver.findElement(webdriver.By.name('username')).sendKeys('test123');
  driver.findElement(webdriver.By.name('password')).sendKeys('testt123');
  driver.findElement(webdriver.By.id('login-form')).submit();
  done();
});
