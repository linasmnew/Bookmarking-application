$(document).ready(function(){

  var checkedBookmarks = [];

  $('.bookmark_select').change(function(){
    var stringOfCheckedBookmarkIds = '';

    checkedBookmarks = [];
    var checkElement = $('.bookmark_select');

    for(var i=0; checkElement[i]; i++){
      if(checkElement[i].checked){
        checkedBookmarks.push(checkElement[i].value);
      }
    }

    stringOfCheckedBookmarkIds = checkedBookmarks.join("&");
    $('#delete_bookmark').attr('href',stringOfCheckedBookmarkIds);
  });




  $('#delete_bookmark').click(function(evt){
    evt.preventDefault();
    //we post the url because it contains the id's seperated by &'s
    var deleteBookmarkLink = $("#delete_bookmark").attr('href');
    var data = {"bookmarks": deleteBookmarkLink};
    jQuery.ajax({
      type: 'POST',
      url: '/user/bookmarks/delete',
      data: data,
      cache: false,
      error: function(xhr, error){
        console.log(error);
      },
      success: function(response){
        //remove bookmark from the dom
        $('.bookmark_select').each(function(){
          var id = $(this).val();

          if($.inArray(id, checkedBookmarks) !== -1 ){
            $(this).closest('div').remove();
          }
        });
        //remove previously checked id's
        $('#delete_bookmark').attr('href','');
      }

    });

  });




});
