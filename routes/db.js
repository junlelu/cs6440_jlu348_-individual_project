var express = require('express'),
    mongoose = require("mongoose"),
    passport = require("passport"),
    User = require("../models/user");

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

var MONGODB_URI = process.env.MONGODB_URL || "mongodb://localhost/jlu348_db";
mongoose.connect(MONGODB_URI);
var router = express.Router();

// Handling user signup
router.post("/register", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    User.register(new User({username: username}),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("admin", {error: err});
            }

            passport.authenticate("local")(
                req, res, function () {
                    res.render("admin", {result: "Created new user"});
                });
        });
});

//Handling user login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/patient_dashboard",
    failureRedirect: "/"
}), function (req, res) {
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}
router.post('/users_list', function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.render("admin", {result: "Something went wrong!"});
            next();
        }
        res.render("admin", {result: users});
    });
});

module.exports = router;