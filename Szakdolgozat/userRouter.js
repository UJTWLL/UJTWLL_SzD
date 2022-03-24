'use strict';
module.exports = function(app) {
    var userHandlers = require('./userController');
    // todoList Routes
    app.route('/tasks').post(userHandlers.loginRequired, userHandlers.profile);
    app.route('/register').post(userHandlers.register);
    app.route('/login').post(userHandlers.sign_in);
};