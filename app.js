var createError = require('http-errors');
var express = require('express'),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
        require("passport-local-mongoose"),
    User = require("./models/user");
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/auth_demo_app");

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
  secret: "Rusty is a dog",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Handling user signup
app.post("/register", function (req, res) {
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
              res.render("admin");
            });
      });
});

//Handling user login
app.post("/login", passport.authenticate("local", {
  successRedirect: "/admin",
  failureRedirect: "/"
}), function (req, res) {
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

app.get('/users_list', function(req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.send("Something went wrong!");
            next();
        }
        res.json(users);
    });
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
