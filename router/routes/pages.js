var express = require('express');
var router = express.Router();
var connection = require('../../models/db_mysql.js');
var dateFormat = require('dateformat');


function convertStringTagsToArray(rows){
  //convert the tags string into array
  for(var i=0; i<rows.length; i++){
    var tags = rows[i].tags;

    //if more than one tag
    if(tags.indexOf(',') > -1){
      var newTags = tags.split(",");
      rows[i].tags = newTags;
    }else{
      var newTags = [];
      newTags.push(rows[i].tags);
      rows[i].tags = newTags;
    }
  }
}


function formatBookmarkDates(rows, today){
  //get todays date in same format
  var todaysDate = dateFormat(today, "yyyy-mm-dd");
  var todaysYear = todaysDate.substring(0,4);
  var todaysMonth = todaysDate.substring(5,7);
  var todaysDay = todaysDate.substring(8,10);

  for(var i=0; i<rows.length; i++){
    //change date format
    rows[i].dateAdded = dateFormat(rows[i].dateAdded, "yyyy-mm-dd");

    var addedYear = rows[i].dateAdded.substring(0,4);
    var addedMonth = rows[i].dateAdded.substring(5,7);
    var addedDay = rows[i].dateAdded.substring(8,10);

    //compare dates to determine a corresponding string
    if(rows[i].dateAdded == todaysDate){
       rows[i].dateAdded = 'today';
    }else if(addedYear == todaysYear && addedMonth == todaysMonth && (todaysDay - addedDay)==1){
      rows[i].dateAdded = 'yesterday';
    }
  }
}


function getUserIdFromUsername(username, account_type, next, cb){
	connection.query("SELECT * FROM user WHERE username = ? AND account_type = ?", [username, account_type], function(err, rows){
		if(err){
			 cb(err, null);
		}else{
      //if specified user has private account type then render 404
      if(rows.length<1){
        return next();
      }

			cb(null, rows[0].id);
		}

	});
}


//:category*? means that the second param is optional
router.get('/:username/:category*?', function(req, res, next){
	var username = req.params.username;
	var account_type = 'public';
  var category = 'general';

  if(req.params.category){
    category = req.params.category;
  }

	getUserIdFromUsername(username, account_type, next, function(err, data){
		if(err){
			return console.error(err);
		}else{
			connection.query("SELECT * FROM bookmark WHERE user_id = ? and category = ? ORDER BY dateAdded DESC LIMIT 8", [data, category], function(err, rows){
				if(err){
					 return console.error(err);
				}
				formatBookmarkDates(rows, new Date());
				convertStringTagsToArray(rows);

				connection.query("SELECT * FROM topic WHERE user_id = ?", data, function(err, categoryRows){
					if(err){
						 return console.error(err);
					}
					res.render('public_profiles',{activity: rows, categories: categoryRows, username: username, category: category});
				});//end select from topic
			});//end select from bookmark
		}//end else
	});//end getUserIdFromUsername

});






router.post('/', function(req, res, next){
  var account_type = 'public';
  var offset = Number(req.body.count);
  var category = req.body.category;
  var username = req.body.username;

	getUserIdFromUsername(username, account_type, next, function(err, data){
		if(err){
			return console.error(err);
		}else{
			connection.query("SELECT * FROM bookmark WHERE user_id = ? AND category = ? ORDER BY dateAdded DESC LIMIT 8 OFFSET ?", [data, category, offset], function(err, rows){
				if(err){
					 return console.error(err);
				}
				formatBookmarkDates(rows, new Date());
				convertStringTagsToArray(rows);
        res.json({"data": rows});
			});//end select from bookmark
		}//end else
	});//end getUserIdFromUsername
});






module.exports = router;
