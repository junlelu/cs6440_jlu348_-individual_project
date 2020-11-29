var express = require('express'),
    mongoose = require("mongoose"),
    passport = require("passport"),
    User = require("../models/user");

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/auth_demo_app");
var router = express.Router();

// Handling user signup
router.post("/register", function (req, res) {
    var username = req.body.username
    var password = req.body.password
    User.register(new User({ username: username }),
        password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("admin",{error:err});
            }

            passport.authenticate("local")(
                req, res, function () {
                    res.render("admin",{result : "Created new user"});
                });
        });
});

router.get("/login", function (req, res) {
    res.render("login");
});
//Handling user login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/"
}), function (req, res) {
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
};

router.post('/users_list', function(req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.render("admin",{result : "Something went wrong!"});
            next();
        }
        res.render("admin",{result : users});
    });
});

module.exports = router;