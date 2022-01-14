// Setting up User authentication

const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { roles } = require('../roles')
// const user = new User(req.body)

async function validatePassword(plainPassword, hashedPassword) {
 return await bcrypt.compare(plainPassword, hashedPassword);
}

// User Signup 

exports.signup = async (req, res) => {
  try {
    // You can descide to add this to make email unique field
    if(await User.findOne({email: req.body.email})){
        res.status(400).send(`User with email ${req.body.email} already exists`);
    }

    const user = new User(req.body);
    console.log(user);
    if (req.body.password) {
      user.password = bcrypt.hashSync(req.body.password, 10);
     }
     const accessToken = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {
        expiresIn: "1d"
     })
     user.accessToken = accessToken;
     await user.save();
     res.json({
       data:user,
       accessToken
     })
     // res.status(200).send(`${user.name} is successfully registered`);
 } catch (error) {
     console.log(error);
     res.status(500).json({error});
 }
}

// User Login

exports.login = async (req, res, next) => {
 try {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) return next(new Error('Email does not exist'));
  const validPassword = await validatePassword(password, user.password);
  if (!validPassword) return next(new Error('Password is not correct'))
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
   expiresIn: "1d"
  });
  await User.findByIdAndUpdate(user._id, { accessToken })
  res.status(200).json({
   data: { email: user.email, role: user.role },
   accessToken
  })
 } catch (error) {
  next(error);
 }
}

// setting up routes

// Getting all users
exports.getUsers = async (req, res, next) => {
 const users = await User.find({});
 res.status(200).json({
  data: users
 });
}

// Getting a particular user
exports.getUser = async (req, res, next) => {
 try {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) return next(new Error('User does not exist'));
   res.status(200).json({
   data: user
  });
 } catch (error) {
  next(error)
 }
}

// Updating a user
exports.updateUser = async (req, res, next) => {
 try {
  const update = req.body
  const userId = req.params.userId;
  await User.findByIdAndUpdate(userId, update);
  const user = await User.findById(userId)
  res.status(200).json({
   data: user,
   message: 'User has been updated'
  });
 } catch (error) {
  next(error)
 }
}

// Deleting a user
exports.deleteUser = async (req, res, next) => {
 try {
  const userId = req.params.userId;
  await User.findByIdAndDelete(userId);
  res.status(200).json({
   data: null,
   message: 'User has been deleted'
  });
 } catch (error) {
  next(error)
 }
}

// creating middleware for restricting access to only logged in users and also a middleware for allowing access to only users with specific roles.

// Allows only users with certain roles access to the route.
exports.grantAccess = function(action, resource) {
 return async (req, res, next) => {
  try {
   const permission = roles.can(req.user.role)[action](resource);
   if (!permission.granted) {
    return res.status(401).json({
     error: "You don't have enough permission to perform this action"
    });
   }
   next()
  } catch (error) {
   next(error)
  }
 }
}

//  Filter and only grant access to users that are logged in.
exports.allowIfLoggedin = async (req, res, next) => {
 try {
  const user = res.locals.loggedInUser;
  if (!user)
   return res.status(401).json({
    error: "You need to be logged in to access this route"
   });
   req.user = user;
   next();
  } catch (error) {
   next(error);
  }
}

