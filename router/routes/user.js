var express = require('express');
var router = express.Router();
var connection = require('../../models/db_mysql.js');
var dateFormat = require('dateformat');
var bcrypt = require('bcryptjs');


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


function renderWithRecentActivity(req, res, renderOrRedirect){
  connection.query("SELECT * FROM bookmark WHERE user_id = ? ORDER BY dateAdded DESC LIMIT ?", [req.user[0].id, 6], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);

    connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
      if(err){
         return console.error(err);
      }

      if(renderOrRedirect == 'render'){
        res.render('user/index',{user: req.user, activity: rows, categories: categoryRows});
      }else if(renderOrRedirect == 'redirect'){
        res.redirect('/user/');
      }

    });
  });
}


router.get('/', function(req, res){
  renderWithRecentActivity(req, res, 'render');
});


router.post('/', function(req, res){

  req.sanitizeBody("tags").escape();

  var numberOfTags = 0;
  var cleanedTags = '';

  var category = req.body.category;
  category = category.trim();

  if(req.body.tags.length > 0){

    var freshTags = req.body.tags.split(",");
    var cleanerTags = [];

    for(var i=0; i<freshTags.length; i++){
      //remove all white space from the tags and change tags to lowercase
      cleanerTags.push(freshTags[i].replace(/\s+/g, "").toLowerCase());
    }

    numberOfTags = cleanerTags.length;
    //all tags cleaned up and joined into a string again
    cleanedTags = cleanerTags.join();
  }

  var formattedUrl = req.body.url.replace(/.*?:\/\//g, "");

  var post = {url: formattedUrl, tags: cleanedTags, user_id: req.user[0].id, number_of_tags: numberOfTags, category: category};
  connection.query("INSERT INTO Bookmark SET ?", post, function(err, rows){
    if(err){
       return console.error(err);
    }
    renderWithRecentActivity(req, res, 'redirect');
  });

});


router.get('/bookmarks', function(req, res){
  var category = 'general';
  connection.query("SELECT * FROM bookmark WHERE user_id = ? and category = ? ORDER BY dateAdded DESC LIMIT ?", [req.user[0].id, category, 8],
    function(err, rows){
      if(err) return console.error(err);

      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err) return console.error(err);
        res.render('user/listBookmarks',{user: req.user, activity: rows, categories: categoryRows});
      });
  });
});


router.post('/bookmarks', function(req, res){
  var offset = Number(req.body.count);
  var category = req.body.category;
  console.log('posted');
  console.log(offset);
  console.log(category);

  connection.query("SELECT * FROM bookmark WHERE user_id = ? AND category = ? ORDER BY dateAdded DESC LIMIT 8 OFFSET ?", [req.user[0].id, category, offset], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);
    res.json({"data": rows});
  });

});




router.get('/bookmarks/tags/:tag', function(req, res){
  var tag = req.params.tag;

  connection.query("SELECT * FROM bookmark WHERE tags LIKE ? AND user_id = ? ORDER BY dateAdded DESC LIMIT ?", ['%'+tag+'%', req.user[0].id, 8], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);

    connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
      if(err){
         return console.error(err);
      }

      res.render('user/bookmarks_by_tags',{user: req.user, activity: rows, categories: categoryRows, tag: tag});

    });

  });

});


router.get('/bookmarks/find', function(req, res){
  var q = req.query.search;
  console.log(q);

  connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? ORDER BY dateAdded DESC", ['[[:<:]]'+q+'[[:>:]]', req.user[0].id], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);

    connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
      if(err){
         return console.error(err);
      }

      res.render('user/search-results',{user: req.user, activity: rows, categories: categoryRows});

    });
  });

});



router.get('/bookmarks/advanced/search', function(req, res, next){

  var keyword = req.query.keyword;

  if(keyword){
    return next();
  }

  connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
    if(err){
       return console.error(err);
    }

    res.render('user/advanced_search',{user: req.user, categories: categoryRows});

  });
});










router.get('/bookmarks/advanced/search', function(req, res){

  var keyword = req.query.keyword;
  var numberoftags = req.query.numberoftags;
  var fromdate = req.query.fromdate + ' 00:00:00';
  var todate = req.query.todate + ' 00:00:00';
  var category = req.query.category;

if(category == 'default'){
  if(keyword && numberoftags && fromdate.length==19 && todate.length==19){
    console.log('first');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND dateAdded BETWEEN ? and ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, fromdate, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length==19 && todate.length==19){
    console.log('second');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND dateAdded BETWEEN ? and ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, fromdate, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length<10 && todate.length==19){
    console.log('third');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND dateAdded < ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length==19 && todate.length<10){
    console.log('four');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND dateAdded > ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, fromdate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length==19 && todate.length<10){
    console.log('five');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND dateAdded > ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, fromdate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length<10 && todate.length==19){
    console.log('six');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND dateAdded < ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length<10 && todate.length<10){
    console.log('seven');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length<10 && todate.length<10){
    console.log('eight');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }

}else{

  if(keyword && numberoftags && fromdate.length==19 && todate.length==19){
    console.log('first');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND category = ? AND dateAdded BETWEEN ? and ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, category, fromdate, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length==19 && todate.length==19){
    console.log('second');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND category = ? AND dateAdded BETWEEN ? and ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, category, fromdate, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length<10 && todate.length==19){
    console.log('third');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND category = ? AND dateAdded < ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, category, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length==19 && todate.length<10){
    console.log('four');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND category = ? AND dateAdded > ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, category, fromdate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length==19 && todate.length<10){
    console.log('five');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND category = ? AND dateAdded > ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, category, fromdate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length<10 && todate.length==19){
    console.log('six');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND category = ? AND dateAdded < ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, category, todate], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && !numberoftags && fromdate.length<10 && todate.length<10){
    console.log('seven');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND category = ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, category], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }else if(keyword && numberoftags && fromdate.length<10 && todate.length<10){
    console.log('eight');

    connection.query("SELECT * FROM bookmark WHERE tags regexp ? AND user_id = ? AND number_of_tags = ? AND category = ? ORDER BY dateAdded DESC", ['[[:<:]]'+keyword+'[[:>:]]', req.user[0].id, numberoftags, category], function(err, rows){
      if(err){
         return console.error(err);
      }
      formatBookmarkDates(rows, new Date());
      convertStringTagsToArray(rows);

      connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
        if(err){
           return console.error(err);
        }

        res.render('user/advanced_search',{user: req.user, activity: rows, categories: categoryRows});
        return;
      });
    });

  }
}


});


router.post('/bookmarks/categories/add', function(req, res){
  var cat = req.body.new_categorie;
  cat = cat.trim();

  if(cat.length < 1){
    res.json({"data": "invalid"});
    return;
  }else{

    var post = {name: cat, user_id: req.user[0].id};

    connection.query("INSERT INTO topic SET ? ", post, function(err, rows){
      if(err){
          console.error(err);
          res.json({"data": "error"});
          return;
      }

      res.json({"data": "added"});
    });

  }

});




router.post('/bookmarks/categories/delete', function(req, res){
  var id = req.body.id;

  connection.beginTransaction(function(err){
    if(err) {
      res.json({"data":"error"});
      throw err;
    }
    connection.query("SELECT name FROM topic where id = ?", id, function(err, rows){
      if(err){
        return connection.rollback(function(){
          res.json({"data":"error"});
          throw err;
        });
      }

      var catName = rows[0].name;
      connection.query("DELETE FROM topic WHERE id = ? AND user_id = ?", [id, req.user[0].id], function(err, rows){
        if(err){
          return connection.rollback(function(){
            res.json({"data":"error"});
            throw err;
          });
        }

        connection.query("DELETE FROM bookmark WHERE category = ? AND user_id = ?", [catName, req.user[0].id], function(err, rows){
          if(err){
            return connection.rollback(function(){
              res.json({"data":"error"});
              throw err;
            });
          }

          connection.commit(function(err){
            if(err){
              return connection.rollback(function(){
                res.json({"data":"error"});
                throw err;
              });
            }
            res.json({"data":"removed"});
          });//end commit

        });//end delete from bookmark

      });//end delete from topic

    });//end select name
  });//end transaction
});




router.get('/bookmarks/:catname', function(req, res){

  var category = req.params.catname;

  console.log(category);
  connection.query("SELECT * FROM bookmark WHERE category = ? AND user_id = ? ORDER BY dateAdded DESC LIMIT ?", [category, req.user[0].id, 8], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);

    connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
      if(err){
         return console.error(err);
      }

      res.render('user/listBookmarks',{user: req.user, activity: rows, categories: categoryRows, category: category});
    });

  });

});




function deleteBookmark(id,req){
  connection.query("DELETE FROM bookmark WHERE id = ? AND user_id = ?", [id, req.user[0].id], function(err, rows){
    if(err){
      console.error(err);
      res.json({"data":'error'});
      return;
    }
  });
}

//***************** EDIT BOOKMARKS **************//

//delete bookmarks
router.post('/bookmarks/delete', function(req, res){
  var ids = req.body.bookmarks;

  if(ids.indexOf('&') === -1){
    connection.query("DELETE FROM bookmark WHERE id = ? AND user_id = ?", [ids, req.user[0].id], function(err, rows){
      if(err){
        console.error(err);
        res.json({"data":'error'});
        return;
      }
      res.json({"data":'removed'});
    });
  }else{
    ids = ids.split('&');
    for(var i=0; i<ids.length; i++){
      deleteBookmark(ids[i],req);
    }
    res.json({"data":'removed'});
  }

});

//edit bookmark tags
router.get('/bookmarks/edit/tags/:id', function(req, res){
  var bookmarkId = req.params.id;

  connection.query("SELECT * FROM bookmark WHERE id = ? AND user_id = ?", [bookmarkId, req.user[0].id], function(err, rows){
    if(err){
       return console.error(err);
    }
    formatBookmarkDates(rows, new Date());
    convertStringTagsToArray(rows);

    connection.query("SELECT * FROM topic WHERE user_id = ?", req.user[0].id, function(err, categoryRows){
      if(err){
         return console.error(err);
      }
      res.render('user/edit_bookmark', {user: req.user, activity: rows, categories: categoryRows});
    });
  });
});


//edit bookmark AJAX
router.post('/bookmarks/edit/tags', function(req, res){
  var id = req.body.bookmarkId;

  req.sanitizeBody("tags").escape();

  var numberOfTags = 0;
  var cleanedTags = '';

  if(req.body.tags.length > 0){

    var freshTags = req.body.tags.split(",");
    var cleanerTags = [];

    for(var i=0; i<freshTags.length; i++){
      //remove all white space from the tags and change tags to lowercase
      cleanerTags.push(freshTags[i].replace(/\s+/g, "").toLowerCase());
    }

    numberOfTags = cleanerTags.length;
    //all tags cleaned up and joined into a string again
    cleanedTags = cleanerTags.join();
  }

  connection.query("UPDATE bookmark SET tags = ? WHERE id = ? AND user_id = ?", [cleanedTags, id, req.user[0].id], function(err, rows){
    if(err){
      console.error(err);
      res.json({"data":'error'});
      return;
    }
    res.json({"data":'updated', "tags":cleanedTags});
  });

});


//***************** USER PROFILE **************//
router.get('/profile', function(req, res){
  connection.query("SELECT account_type FROM user WHERE id = ?", req.user[0].id, function(err, rows){
    if(err){
       return console.error(err);
    }
    var account_type = rows[0].account_type;
    res.render('user/profile/', {user: req.user, account_type: account_type});
  });
});




router.post('/profile/update_email', function(req, res, next){
  var errors = '';
  var email = req.body.email;

  if(email == ''){
    res.json({"data":"empty"});
  }else{
    connection.query('SELECT * FROM user WHERE email = ?', email, function(err,rows){
      if(err){
        console.error(err);
        res.json({"data":"error"});
        return;
      }
       if(rows.length>0){
         res.json({"data":"exists"});
       }else{
         connection.query("UPDATE user SET email = ? WHERE id = ?", [email, req.user[0].id], function(err, rows){
           if(err){
             console.error(err);
             res.json({"data":"error"});
             return;
           }
           res.json({"data":"updated"});
         });
       }
     });//end select query
  }
});




var validPassword = function(newPassword, oldPassword){
  return bcrypt.compareSync(newPassword, oldPassword);
}

router.post('/profile/update_password', function(req, res){
  var errors = '';
  var oldPassword = req.body.oldpassword;
  var newPassword = req.body.newpassword;
  var newPassword2 = req.body.newpassword2;

  if(oldPassword != '' || newPassword != '' || newPassword2 != ''){

    if(newPassword === newPassword2){

      if(validPassword(oldPassword, req.user[0].password)){

        var hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

          connection.query("UPDATE user SET password = ? WHERE id = ?", [hash, req.user[0].id], function(err, rows){
            if(err){
              console.error(err);
              res.json({"data":"error"});
              return;
            }
            res.json({"data":"updated"});
          });

      }else{
          res.json({"data":"oldincorrect"});
      }
    }else{
        res.json({"data":"nomatch"});
    }
  }else{
    res.json({"data":"empty"});
  }

});




//change account to private
router.post('/profile/private', function(req, res){
  var account_type = 'private';
  connection.query("UPDATE user SET account_type = ? WHERE id = ?", [account_type, req.user[0].id], function(err, rows){
    if(err){
       return console.error(err);
    }
    res.redirect('/user/profile');
  });
});

//change account to public
router.post('/profile/public', function(req, res){
  var account_type = 'public';
  connection.query("UPDATE user SET account_type = ? WHERE id = ?", [account_type, req.user[0].id], function(err, rows){
    if(err){
       return console.error(err);
    }
    res.redirect('/user/profile');
  });
});










router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});



module.exports = router;
