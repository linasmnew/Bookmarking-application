var added_category = [];
$(".added_category").each(function(){
  added_category.push($(this).text());
});

$.each(added_category, function(index, value){
  $('#categories_options').append($('<option/>', {
    value: value,
    text: value
  }));

});
