'use strict';

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');

console.log("The localhost is available");

/*MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}).then((db) => {
  var dbo = db.db("test");
  var myobj = { _id: 1, username: "test", password: bcrypt.hashSync("test", 10) }; //10 KÖRNYI SALT!!!
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
  /*return dbo.createCollection("users").then((collection) => {
      console.log("Collection created!");
      console.log(collection);
  }).catch(err => {
      console.log(`DB Connection Error: ${err.message}`);
  }).finally(() => {
      console.log('Close DB');
      db.close();
  })
});*/

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'static')));

/*app.use(function(req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});*/

// http://localhost:3000/auth
app.post('/auth', function(req, res, next) {

  var inuser = req.body.username,
      inpass = req.body.password;

  var myobj = { username: inuser};
  console.log(`Login credentials: ` + JSON.stringify(myobj));

  MongoClient.connect('mongodb+srv://jokermta:QTIq5re1999@szdcluster.4fntd.mongodb.net/test?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).then((db) => {
      var dbo = db.db("test");

      var profile = dbo.collection("profiles").findOne(myobj).then((collection) => {
          console.log(collection);
          if (bcrypt.compareSync(inpass, collection.password)) {
            // Authenticate the user
            req.session.loggedin = true;
            req.session.username = inuser;
            //res.json({ token: jwt.sign({ email: user.email, fullName: user.fullName, _id: user._id }, 'RESTFULAPIs') });
            // Redirect to home page
            if(inuser == "admin") res.redirect('/admin');
            else res.redirect('/home');
          } else {
            res.send('Incorrect Username and/or Password!');
          }			
          res.end();
      }).catch(err => {
          console.log(`DB Connection Error: ${err.message}`);
      }).finally(() => {
          console.log('Close DB');
          db.close();
      })
  });
});

//http://localhost:3000/
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/login.html'));
});

// http://localhost:3000/home
app.get('/home', function(req, res) {
	if (!req.session.loggedin) {
    res.send('Please login to view this page!');
	} else {
	}
	res.end();
});

// http://localhost:3000/admin
app.get('/admin', function(req, res) {
	if (req.session.username != "admin") {
    res.send('Please login as an administrator to view this page!');
	} else {
	}
	res.end();
});

/*app.use(function(req, res, next) {
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
    jsonwebtoken.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode) {
      if (err) req.user = undefined;
      req.user = decode;
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
});*/

app.listen(3000);

module.exports = app;