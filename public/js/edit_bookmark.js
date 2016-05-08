$(document).ready(function(){

  $('#edit_bookmark').click(function(evt){
    evt.preventDefault();
    //url contains the bookmark id
    var editBookmarkLink = $("#edit_bookmark").attr('href');

    var updated_tags = $("#updated_tags").val();

    var data = {"bookmarkId": editBookmarkLink, "tags": updated_tags};
    jQuery.ajax({
      type: 'POST',
      url: '/user/bookmarks/edit/tags',
      data: data,
      cache: false,
      error: function(xhr, error){
        console.log(error);
      },
      success: function(response){
        if(response.data == 'error'){
          $('#edit_notice').text('error, please try again later');
        }else{
          $('#edit_notice').text('Updated');
          $("#updated_tags").val(response.tags);

        }
      }

    });

  });




});
