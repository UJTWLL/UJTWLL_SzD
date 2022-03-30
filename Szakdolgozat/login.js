'use strict';

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

console.log("The localhost is available");

/*MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}).then((db) => {
  var dbo = db.db("test");
  var myobj = { _id: 0, username: "admin", password: bcrypt.hashSync("QTIq5re", 10) , token: ""}; //10 KÖRNYI SALT!!!
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

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

/*app.use(function(req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});*/

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
            collection.token = jwt.sign({inuser}, "szakdolgozat",
            {
              expiresIn: '600s', // The token's lifespan is 10 minutes (600 seconds)!
            });
            console.log(collection);

            if(jwt.verify(collection.token, "szakdolgozat")){
              console.log('Successful token validation!');
              if(inuser == "admin") res.redirect('/admin');
              else res.redirect("/home");
            }
            else res.redirect('/expired');
          } else {
            res.send('Incorrect Username and/or Password!');
          }			
          res.end();
      }).catch(err => {
          console.log(`DB Connection Error: ${err.message}`);
          res.send("Username not found!");
      }).finally(() => {
          console.log('Close DB');
          db.close();
      })
  });
});

//http://localhost:3000/
app.get('/', function(req, res) {
  res.render("login");
});

// http://localhost:3000/home
app.get('/home', function(req, res) {
	if (!req.session.loggedin) {
    res.send('Please login to view this page!');
	} else {
    res.render("home");
	}
});

// http://localhost:3000/files
app.get('/files', function(req, res) {
	if (!req.session.loggedin) {
    res.send('Please login to view this page!');
	} else {
    res.render("files");
	}
});

// http://localhost:3000/programmes
app.get('/programmes', function(req, res) {
	if (!req.session.loggedin) {
    res.send('Please login to view this page!');
	} else {
    res.render("programmes");
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

// http://localhost:3000/expired
app.get('/expired', function(req, res) {
  res.render("expired");
});

app.listen(3000);