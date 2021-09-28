require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const md5 = require('md5');

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});





const User = mongoose.model("User", userSchema);


const app = express();
const port = 3000;


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));



app.get("/", (req, res)=>{
  res.render("home");
});

// Login Route
app.get("/login", (req, res)=>{
  res.render("login");
});

app.post("/login", (req, res)=>{
  const userName = req.body.username;
  const password = md5(req.body.password);


  User.findOne({email: userName}, (err, foundUser)=>{
    if(err){
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets")
        } else{
          console.log("Wrong password");
        }
      } else {
        console.log("Check username");
      }
    }
  })
})

// Register Route

app.get("/register", (req, res)=>{
  res.render("register");
});


app.post("/register", (req, res)=>{


  const newUser = new User({
    email: req.body.username,
    password : md5(req.body.password)
  });

  newUser.save((err)=>{
    if (err) {
      res.send(err)
    } else {
      res.render("secrets")
    }
  })

});







app.listen(port,()=>{
  console.log("Server Started on 3000");
})
