var userFlagg;
var passFlagg;
var emailFlagg;

  $(document).ready(function(){

    $('#username').blur(checkUsername);
    $('#password').blur(checkPassword);
    $('#email').blur(checkEmail);

    $("form").submit(function(event){

    if(userFlagg === "connectionError"){
        event.preventDefault();
        var feedback = document.getElementById('feedback');
        feedback.textContent = 'Not connected, please check your network connection';
      }else if(userFlagg === "available" && passFlagg && emailFlagg){
        return;
      }else if(userFlagg === "unavailable"){
        event.preventDefault();
      }else{
        event.preventDefault();
        var feedback = document.getElementById('feedback');
        feedback.textContent = 'Please make sure you have entered all fields correctly before submitting the form';
      }

    });

  });


  function flagUser(userFlag){
    userFlagg = userFlag;
  }
  function flagPass(passFlag){
    passFlagg = passFlag;
  }
  function flagEmail(emailFlag){
    emailFlagg = emailFlag;
  }


  function checkUsername(){
      var token = $('#token').val();
      var username = $('#username').val();

      if(username.length > 0){
        if(username.match(/^[a-z0-9]+$/i)){
            jQuery.ajax({
              type: 'POST',
              url: '/check_username',
              data: {
                'username':username,
                '_csrf': token,
              },
              cache: false,
              error: function(xhr, error){
                console.log(error);
                flagUser('connectionError');
              },
              success: function(response){
                  var usernameLabel = document.getElementById('usernameLabel');

                  switch(response.success){
                    case 'error':
                      usernameLabel.textContent = response.data;
                      flagUser('dberror');
                    break;
                    case 'unavailable':
                      usernameLabel.textContent = response.data;
                      flagUser('unavailable');
                    break;
                    case 'available':
                      usernameLabel.textContent = response.data;
                      flagUser('available');
                    break;
                }
              }
            });
          }else{
            usernameLabel.textContent = 'Username should only consist of Uppercase, lowercase and numbers';
            flagUser(false);
          }
      }else{
        usernameLabel.textContent = 'Please enter a username';
        flagUser(false);
      }
    }


function checkPassword(){
  var passwordLabel = document.getElementById('passwordLabel');
  var password = $('#password').val();

  if(password.length < 1){
     passwordLabel.textContent = 'Password must be 5 or more characters long';
     flagPass(false);
  }
  if(password.match(/^[a-z0-9]+$/i)){
     passwordLabel.textContent = 'Good password';
     flagPass(true);
  }else{
     passwordLabel.textContent = 'Password should only consist of Uppercase, lowercase and numbers';
     flagPass(false);
  }
}

function checkEmail(){
  var emailLabel = document.getElementById('emailLabel');
  var email = $('#email').val();
  var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  if(email.length > 4 && email.length < 320){
    if(email.match(emailregex)){
       emailLabel.textContent = 'Good email';
       flagEmail(true);
    }else{
       emailLabel.textContent = 'Invalid email';
       flagEmail(false);
    }
  }else{
     emailLabel.textContent = 'Email has to be between 5 and 320 characters long';
     flagEmail(false);
  }
}
