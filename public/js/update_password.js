$(document).ready(function(){

  $('#profile_password_form').submit(function(evt){
    evt.preventDefault();

    var oldPassword = $("#oldpassword").val();
    var newPassword = $("#newpassword").val();
    var newPassword2 = $("#newpassword2").val();

    var data = {"oldpassword": oldPassword, "newpassword": newPassword, "newpassword2": newPassword2};
    jQuery.ajax({
      type: 'POST',
      url: '/user/profile/update_password',
      data: data,
      cache: false,
      error: function(xhr, error){
        console.log(error);
      },
      success: function(response){
        if(response.data == 'error'){
          $('#password_notice').text('error, please try again later');
        }else{
          $('#password_notice').text('Updated');
        }

        if(response.data == 'error'){
          $('#password_notice').text('error, please try again later');
        }else if(response.data == 'empty'){
          $('#password_notice').text('Please fill in all fields');
        }else if(response.data == 'nomatch'){
          $('#password_notice').text('New passwords do not match');
        }else if(response.data == 'oldincorrect'){
          $('#password_notice').text('Incorrect old password');
        }else{
          $('#password_notice').text('Updated');
        }


      }

    });

  });




});
