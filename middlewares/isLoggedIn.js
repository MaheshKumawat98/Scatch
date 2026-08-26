const jwt =require('jsonwebtoken');
const userModel=require('../models/user-model');

module.exports=async (req,res,next)=>{
    if(!req.cookies.token){
        req.flash('error','you need to login first');
        return res.redirect('/');
    }
    try{
      let decode=jwt.verify(req.cookies.token,process.env.JWT_KEY);
      let user=await userModel
      .findOne({email: decode.email})
      .select('-password') //means user ka password nahi chaiye to password ki - kar diya
      req.user=user; // req  me nai fild create kar di user 
      next();
    }
    catch(err){
        req.flash('error','somthing went wrong');//flash ka matlab '/'(jaha redirect ho raha) route par ye error dikeha ok 
        res.redirect('/');
    }
}