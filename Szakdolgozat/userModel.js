'use strict';

var mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  Schema = mongoose.Schema;

/**
 * Felhasználói séma
 */
var UserSchema = new Schema({
  userName: {
    type: String,
    trim: true,
    required: true
  },
  hash_password: {
    type: String
  },
});

mongoose.model('User', UserSchema);