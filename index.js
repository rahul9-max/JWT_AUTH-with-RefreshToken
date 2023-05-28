require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connect } = require('./db');
const User = require('./user');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to parse request bodies

// Connect to MongoDB
connect();


// Sign up a new user
app.post("/register",async(req,res)=>{
  const {fullName,email,password}=req.body;
  try{
    const existingUser=await User.findOne({email});
    if(existingUser){
     return res.status(400).json("user already exists")
    }
       // Hash the password
    const hashedPassword=await bcrypt.hash(password,10);
    // Create the user
    const newUser=await User({fullName,email,password:hashedPassword})
    await newUser.save()
    res.status(200).json({message:"user registered"})
  }catch(error){
    console.error(error);
    res.status(500).json({ message: 'Internal server error' })
  }
})
// login the user
app.post("/login",async(req,res)=>{
const {email,password}=req.body;
try{
    const existingUser=await User.findOne({email});
    if(!existingUser){
      return res.status(404).json({ message: 'User not found' })
    }
    const isMatch=await bcrypt.compare(password,existingUser.password);
    if(!isMatch){
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken=generateAccessToken(existingUser);
    const refreshToken=generateRefreshToken(existingUser);
    res.json({accessToken,refreshToken})
}catch(error){
  console.error(error);
    res.status(500).json({ message: 'Internal server error' })
  }
}
)
app.post("/refreshToken",async(req,res)=>{
  const refreshToken=req.body.refreshToken;
  console.log(refreshToken);
  if(!refreshToken){
    return res.status(404).json({message:"Refresh Token not found"})
  }
  jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user)=>{
    if(err){
      return res.status(400).json({message:"Invalid Refresh Token"})
    }
    const accessToken=generateAccessToken(user)
    const refreshToken=generateRefreshToken(user)
    res.json({accessToken,refreshToken})
  })
})


// generate Access Token
const generateAccessToken=(user)=>{
 return jwt.sign({email:user.email},process.env.JWT_SECRET,{expiresIn:"15min"})
}
// generate refresh Token
const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' });
  console.log(refreshToken); // Add this line
  return refreshToken;
};
// const generateRefreshToken=(user)=>{
//   return jwt.sign({email:user.email},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"24hrs"})
// }

app.get("/protected",authenticateUser,(req,res)=>{
  const {fullName,email}=req.user
  res.status(200).json({fullName,email,message:"protected route has been accessed"})
})
// Middleware to authenticate JWT token
// function authenticateToken(req, res, next) {
//   const authHeader = req.headers['authorization'];// This line retrieves the value of the 'Authorization' header from the req object and assigns it to the authHeader constant.
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Token not found' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(404).json({ message: 'Invalid token' });
//     }

//     req.user = user;
//     next();
//   });
// }
function authenticateUser(req,res,next){
const authenticate=req.headers['authorization'];// This line retrieves the value of the 'Authorization' header from the req object and assigns it to the authHeader constant.
const token=authenticate.split(' ')[1];

if(!token){
return  res.status(404).json({message:"Token not found"})
}
jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
  if(err){
  return  res.status(401).json({message:"invalid Token"})
  }
  req.user=user;
  next();
})
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

