$(document).ready(function(){

  $('#profile_email_form').submit(function(evt){
    evt.preventDefault();
    var email_input = $("#email_input").val();
    var data = {"email": email_input};

    jQuery.ajax({
      type: 'POST',
      url: '/user/profile/update_email',
      data: data,
      cache: false,
      error: function(xhr, error){
        console.log(error);
      },
      success: function(response){
        if(response.data == 'error'){
          $('#email_notice').text('error, please try again later');
        }else if(response.data == 'empty'){
          $('#email_notice').text('Please fill in all fields');
        }else if(response.data == 'exists'){
          $('#email_notice').text('Email already exists');
        }else{
          $('#email_notice').text('Updated');
        }
      }
    });

  });




});
