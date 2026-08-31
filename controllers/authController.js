const isDev = process.env.NODE_ENV === 'development';

const express=require('express');
const router=express();
const userModel=require('../models/user-model');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const {generateToken}=require('../util/generateToken');
router.use(cookieParser());
const expressSession = require("express-session");
const flash = require("connect-flash");
router.use(flash());

router.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
);



module.exports.registerUser = async (req, res) => {
    try {
        let { email, password, fullname, isAdmin } = req.body;
        let user = await userModel.findOne({ email });
        if (user) return res.status(401).send('You already have an account');

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.send(err.message);
                let newUser = await userModel.create({
                    email,
                    fullname,
                    password: hash,
                    admin: isDev && isAdmin === 'on' ? true : false  // dev-only
                });
                let token = generateToken(newUser);
                res.cookie('token', token);
                res.send('User created successfully');
            });
        });
    } catch (err) {
        console.log(err.message);
    }
};

module.exports.loginUser=async (req,res)=>{
    let {email,password}=req.body;
    let user=await userModel.findOne({email:email});
    if(!user){ req.flash('error','something went wrong')
                return  res.redirect('/');}
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
          let token=generateToken(user);
          res.cookie('token',token);
          return res.redirect('/shop');
        } 
        req.flash('error','something went wrong');
        res.redirect('/');
        
    })
}
module.exports.logout=(req,res)=>{
    res.cookie('token','');
    res.redirect('/');
}