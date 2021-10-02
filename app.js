require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const port = 3000;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB");
// Mongoose Schema for usig plugin
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  provider: String,
  username: {type: String, unique: true},
  secret: String
});
userSchema.plugin(passportLocalMongoose, {usernameField: "username"});
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id },{ provider: "google", email: profile._json.email}, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/secrets", (req,res)=>{
  User.find({"secret": {$ne:null}}, (err, foundUsers)=>{
    if (err) {

    } else{
      if (foundUsers) {
        res.render("secrets", {userWithSecrets: foundUsers});
      }
    }
  });
});
app.route('/auth/google')
  .get(passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });
// Login Route
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if(err){
      console.log(err);
    } else{
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  });
});
// Register Route
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  User.register({username: req.body.username, email: req.body.username, provider: "local"}, req.body.password, (err, user)=>{
    if(err){
      console.log(err);
      res.redirect("/register")
    } else{

      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });

    }
  });
});
// Submit
app.get("/submit", (req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit")
  } else{
    res.redirect("/login")
  }
});
app.post("/submit", (req, res)=>{
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, (err, foundUser)=>{
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(()=>{
          res.redirect("/secrets")
        })
      }
    }
  });
});
// Logout
app.get("/logout", (req, res)=>{
  req.logout();
  res.redirect("/");
});
app.listen(port, () => {
  console.log("Server Started on 3000");
});
