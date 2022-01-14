// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path')
const User = require('./model/userModel')
const routes = require('./routes/route.js');
const connectDB = require('./db/connect');

require("dotenv").config()
 //({
//  path: path.join(__dirname, "../.env")
// });

const app = express();

const PORT = 3000;

const start = async () => {
    try {
      await connectDB(process.env.MONGO_URI)
      app.use('/', routes); 
      app.listen(PORT, console.log(`Server is listening on port ${PORT}...`))
    } catch (error) {
      console.log(error)
    }
  }

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));
  
app.use(express.json());

app.use(async (req, res, next) => {
 if (req.headers["x-access-token"]) {
  const accessToken = req.headers["x-access-token"];
  const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
  
  // Check if token has expired
  if (exp < Date.now().valueOf() / 1000) { 
   return res.status(401).json({ error: "JWT token has expired, please login to obtain a new one" });
  } 
  res.locals.loggedInUser = await User.findById(userId); next(); 
 } else { 
  next(); 
 } 
});

start();
