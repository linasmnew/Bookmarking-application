var counter=8;
$(window).scroll(function() {
  if($(window).scrollTop() + window.innerHeight == $(document).height()) {
    //if scroll hits the bottom
    var category = $('.add-bookmark-h1').text();
    $.ajax({
      url:'/user/bookmarks',
      type: 'POST',
      data: {'count': counter, 'category':category},
      cache: false,
      error: function(xhr, error){
        console.log(error);
      },
      success: function(response){
        console.log('success');

        var len = response.data.length;

        function constructTags(i){
            var lol = ' ';

            for(var j=0; j<response.data[i].tags.length; j++){
              lol = lol + '<p class="tags">'+response.data[i].tags[j]+'</p> ';
            }
            return lol;
        }

        function constructReturnedBookmarks(i){
          response.data[i].url
          response.data[i].dateAdded
          response.data[i].tags

          var url = '<p class="view_bookmark_url"><a href="http://'+response.data[i].url+"\""+'target="_blank">'+response.data[i].url+'</a></p>';
          var dateAdded = '<p class="view_bookmark_dateAdded">'+response.data[i].dateAdded+'</p>';

          var constructed = constructTags(i);

          var complete = url + dateAdded + '<div class="view_bookmark_tags">'+constructed+'</div>';
          return complete;
        }

        for(var i=0; i<len; i++){
          $('#view_bookmark_div').append(constructReturnedBookmarks(i));
        }

        counter = counter+8;

      }

  });

}
});
