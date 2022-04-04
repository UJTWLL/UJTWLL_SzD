'use strict';

//---------------------------------------------------------------------------------------------------------------------------------------
// MODULOK IMPORTÁLÁSA
//---------------------------------------------------------------------------------------------------------------------------------------

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

console.log("The localhost is available");

//---------------------------------------------------------------------------------------------------------------------------------------
// A KÖVETKEZŐ KOMMENTBLOKKOT AKKOR KELL "KIKOMMENTEZNI", HA ÚJ FELHASZNÁLÓKAT SZERETNÉNK HOZZÁADNI AZ ADATBÁZISHOZ!
// A 0-S ID-JŰ FELHASZNÁLÓ AZ (EGYETLEN) ADMINISZTRÁTOR!
// CSAK "SIMA" FELHASZNÁLÓK HOZZÁADÁSA LEHETSÉGES!
//---------------------------------------------------------------------------------------------------------------------------------------

/*MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}).then((db) => {
  var dbo = db.db("test");
  var myobj = { username: "test", password: bcrypt.hashSync("test", 10) }; //10 KÖRNYI SALT!!!
  return dbo.collection("profiles").insertOne(myobj, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).then((collection) => {
    console.log("1 document inserted");
    console.log(collection);
  }).catch(err => {
    console.log(`DB Connection Error: ${err.message}`);
  }).finally(() => {
    console.log('Close DB');
    db.close();
  });
});*/

//---------------------------------------------------------------------------------------------------------------------------------------
// SZERVER KONFIGURÁCIÓJA
//---------------------------------------------------------------------------------------------------------------------------------------

const halfHour = 1000 * 60 * 30; // A felhasználói "session" fél óráig tart (1 800 000 miliszekundum)

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, '/programmes/uploaded/');
  },

  filename: function(req, file, cb) {
      cb(null, file.originalname + path.extname(file.originalname));
  }
});

app.use(session({
	secret: "szakdolgozat",
  saveUninitialized: true,
  cookie: { maxAge: halfHour },
  resave: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/views'));
app.use(cookieParser());

/*app.use(function(req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});*/

//---------------------------------------------------------------------------------------------------------------------------------------
// AUTENTIKÁCIÓ
//---------------------------------------------------------------------------------------------------------------------------------------

// http://localhost:3000/auth
app.post('/auth', function(req, res, next) {

  var inuser = req.body.username,
      inpass = req.body.password;
  var myobj = { username: inuser };
  console.log(`Login credentials: ` + JSON.stringify(myobj));

  MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).then((db) => {
    var dbo = db.db("test");
    var profile = dbo.collection("profiles").findOne(myobj).then((collection) => {
      if (bcrypt.compareSync(inpass, collection.password)) {
        req.session.loggedin = true;
        req.session.username = inuser;
        console.log(req.session);

        if(inuser == "admin") res.redirect('/admin');
        else res.redirect("/home");
      } else {
        res.redirect('/badauth');
      }			
      res.end();
    }).catch(err => {
      console.log(`DB Connection Error: ${err.message}`);
      res.redirect('/notfound');
    }).finally(() => {
        console.log('Close DB');
        db.close();
    })
  });
});

//---------------------------------------------------------------------------------------------------------------------------------------
// ADMINISZTRÁTOR MŰVELETEK KEZELÉSE
//---------------------------------------------------------------------------------------------------------------------------------------

// http://localhost:3000/add
app.post('/add', function(req, res, next) {

  var addUser = req.body.addUName,
      addPW = req.body.addPW,
      addPWAgain = req.body.addPWAgain;
  var addObj = { username: addUser, password: bcrypt.hashSync(addPW, 10) };

  if(addPW != addPWAgain){
    console.log("Passwords don't match!");
    res.redirect('/notmatching');
  }
  else{
    MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }).then((db) => {
      var dbo = db.db("test");
      dbo.collection("profiles").findOne({ username: addUser }).then((collection) => {
        if (collection) {
          console.log("User already exists!");
          res.redirect('/exists');
        }
        else{
          MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
            useUnifiedTopology: true,
            useNewUrlParser: true,
          }).then((db) => {
            var dbo = db.db("test");
            dbo.collection("profiles").insertOne(addObj).then((collection) => {
              console.log("User added!");
              res.redirect('/dbsuccess');
            })
          });
        }
      }).catch(err => {
        console.log(`DB Connection Error: ${err.message}`);
        res.redirect('/notfound');
      }).finally(() => {
        console.log('Close DB');
        db.close();
      })
    });
  }
});

// http://localhost:3000/modify
app.post('/modify', function(req, res, next) {

  var modifyUser = req.body.modifyUName,
      modifyPW = req.body.modifyPW,
      modifyPWAgain = req.body.modifyPWAgain;
  var modifyObj = { username: modifyUser };
  var newValues = { $set: { password: bcrypt.hashSync(modifyPW, 10) } };

  if(modifyPW != modifyPWAgain){
    console.log("Passwords don't match!");
    res.redirect('/notmatching');
  }
  else{
    MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }).then((db) => {
      var dbo = db.db("test");
      var profile = dbo.collection("profiles").findOne({ username: modifyUser }, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }).then((collection) => {
        if (collection) {
          MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
            useUnifiedTopology: true,
            useNewUrlParser: true,
          }).then((db) => {
            var dbo = db.db("test");
            dbo.collection("profiles").updateOne(modifyObj, newValues, {
              useUnifiedTopology: true,
              useNewUrlParser: true,
            }).then((collection) => {
              console.log("User updated!");
              res.redirect('/dbsuccess');
            })
          });
        }
        else{
          console.log("Username not found!");
          res.redirect('/notfound');
        }
      }).catch(err => {
        console.log(`DB Connection Error: ${err.message}`);
        res.redirect('/notfound');
      }).finally(() => {
        console.log('Close DB');
        db.close();
      })
    });
  }
});

// http://localhost:3000/remove
app.post('/remove', function(req, res, next) {

  var removeUser = req.body.removeUName;
  var removeObj = { username: removeUser };

  MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).then((db) => {
    var dbo = db.db("test");
    dbo.collection("profiles").findOne({ username: removeUser }, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }).then((collection) => {
      if(collection){
        MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
          useUnifiedTopology: true,
          useNewUrlParser: true,
        }).then((db) => {
          var dbo = db.db("test");
          dbo.collection("profiles").deleteOne(removeObj, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
          }).then((collection) => {
            console.log("User removed!");
            res.redirect('/dbsuccess');
          })
        });
      }
      else{
        console.log("Username not found!");
        res.redirect('/notfound');
      }
    }).catch(err => {
      console.log(`DB Connection Error: ${err.message}`);
      res.redirect('/notfound');
    }).finally(() => {
      console.log('Close DB');
      db.close();
    })
  });
});

//---------------------------------------------------------------------------------------------------------------------------------------
// FELTÖLTÉSEK KEZELÉSE
//---------------------------------------------------------------------------------------------------------------------------------------

// http://localhost:3000/fileupload
app.post('/fileupload', (req, res) => {
  var upload = multer({ storage: storage }).single('fileUp');
  upload(req, res, function(err) {
    if(!req.file){
      res.redirect('/nofile');
    }
    else{
      res.redirect('/uploadsuccess');
    }
  });
});

// http://localhost:3000/programmeupload
app.post('/programmeupload', (req, res) => {
  var upload = multer({ storage: storage }).single('programmeUp');
  upload(req, res, function(err) {
    if(!req.file){
      res.redirect('/nofile');
    }
    else{
      res.send(req.file);
      //res.redirect('/uploadsuccess');
    }
  });
});

//---------------------------------------------------------------------------------------------------------------------------------------
// CÍMEK, ÁTIRÁNYÍTÁSOK KEZELÉSE
//---------------------------------------------------------------------------------------------------------------------------------------

//http://localhost:3000/
app.get('/', function(req, res) {
  req.session.loggedin = false;
  req.session.username = '';
  res.render("login");
});

// http://localhost:3000/home
app.get('/home', function(req, res) {
	if (!req.session.loggedin) {
    res.redirect("invalid");
	} else {
    res.render("home");
	}
});

// http://localhost:3000/files
app.get('/files', function(req, res) {
	if (!req.session.loggedin) {
    res.redirect("invalid");
	} else {
    res.render("files");
	}
});

// http://localhost:3000/fileUpload
app.get('/fileupload', function(req, res) {
	if (!req.session.loggedin) {
    res.redirect("invalid");
	} else {
    res.render("fileUpload");
	}
});

// http://localhost:3000/programmes
app.get('/programmes', function(req, res) {
	if (!req.session.loggedin) {
    res.redirect("invalid");
	} else {
    res.render("programmes");
	}
});

// http://localhost:3000/programmeUpload
app.get('/programmeupload', function(req, res) {
	if (!req.session.loggedin) {
    res.redirect("invalid");
	} else {
    res.render("programmeUpload");
	}
});

// http://localhost:3000/admin
app.get('/admin', function(req, res) {
	if (req.session.username != "admin") {
    res.send('Please login as an administrator to view this page!');
	} else {
    res.render("admin");
	}
});

// http://localhost:3000/dbsuccess
app.get('/dbsuccess', function(req, res) {
  res.render("dbsuccess");
});

// http://localhost:3000/uploadsuccess
app.get('/uploadsuccess', function(req, res) {
  res.render("uploadsuccess");
});

// http://localhost:3000/invalid
app.get('/invalid', function(req, res) {
  res.render("invalid");
});

// http://localhost:3000/badauth
app.get('/badauth', function(req, res) {
  res.render("badauth");
});

// http://localhost:3000/notmatching
app.get('/notmatching', function(req, res) {
  res.render("notmatching");
});

// http://localhost:3000/notfound
app.get('/notfound', function(req, res) {
  res.render("notfound");
});

// http://localhost:3000/notfile
app.get('/nofile', function(req, res) {
  res.render("nofile");
});

// http://localhost:3000/exists
app.get('/exists', function(req, res) {
  res.render("exists");
});

//---------------------------------------------------------------------------------------------------------------------------------------
// PORT DEFINIÁLÁSA
//---------------------------------------------------------------------------------------------------------------------------------------

app.listen(3000);