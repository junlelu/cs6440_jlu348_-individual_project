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

router.post("/admin/register", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var role = req.body.role;
    var patient_id = req.body.patient_id;

    User.register(new User({username: username, role: role, patient_id: patient_id}),
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

router.post('/admin/update_password' , function (req, res) {
    var new_password = req.body.new_password;
    var username = req.body.username;

    User.findByUsername(username).then(function(sanitizedUser){
        if (sanitizedUser){
            sanitizedUser.setPassword(new_password, function(){
                sanitizedUser.save();
                res.render("admin", {result: "Updated the password!"});
            });
        } else {
            return res.render("admin", {error: {message: "The username does not exist in the database.", name: "Failed to update user password."}});
        }
    },function(err){
        console.error(err);
    })
});

router.post('/user/update_password' , function (req, res) {
    var new_password = req.body.password1;
    var username = req.user.username;
    console.log(username);
    console.log(new_password);
    User.findByUsername(username).then(function(sanitizedUser) {
        if (new_password === undefined) {
            return res.render("account_setting", {
                error: {
                    message: "Invalid password.",
                    name: "Failed to update user password. Please log out and try again."
                }
            });
        } else if (sanitizedUser) {
            sanitizedUser.setPassword(new_password, function () {
                sanitizedUser.save();
                res.render("account_setting", {result: "Updated the password! Please log out and log in with new password"});
            });
        } else {
            return res.render("account_setting", {
                error: {
                    message: "The username does not exist in the database.",
                    name: "Failed to update user password. Please log out and try again."
                }
            });
        }
    },function(err){
        console.error(err);
    })
});

router.post("/login", passport.authenticate("local", {
    failureRedirect: "/",
    failureMessage: "Invalid username or password"
}), function (req, res) {
    var username = req.user.username;
    User.find({username}, function (err, user) {
        console.log(user);
        if (user[0].role === "admin") {
            res.redirect("/admin");
        } else {
            res.redirect("/patient_dashboard");
        }
    });
});

router.get("/logout", function (req, res) {
    req.logout();
    req.session.messages = [];
    res.redirect("/");
});

router.post('/admin/print_all_users', function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.render("admin", {result: "Something went wrong!"});
            next();
        }
        if (users.length === 0) {
            res.render("admin", {result: "No user found in the database."});
        } else {
            res.render("admin", {result: users});
        }
    });
});

router.post('/admin/delete_all_users', function (req, res) {
    User.remove({}, function (err, users) {
        if (err) {
            res.render("admin", {result: "Something went wrong!"});
            next();
        }
        res.render("admin", {result: "Deleted all users!"});
    });
});

module.exports = router;