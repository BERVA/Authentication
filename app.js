require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const mongoose = require('mongoose');
const port = 3000;
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
  password: String
});

userSchema.plugin(passportLocalMongoose);



const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





app.get("/", (req, res) => {
  res.render("home");
});

app.get("/secrets", (req,res)=>{

  if(req.isAuthenticated()){
    res.render("secrets")
  } else{
    res.redirect("/login")
  }


})
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
        res.redirect("/secrets")
      });
    }
  })



});
// Register Route
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user)=>{
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

// Logout


app.get("/logout", (req, res)=>{
  req.logout();
  res.redirect("/");
})



app.listen(port, () => {
  console.log("Server Started on 3000");
});
