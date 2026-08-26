const express=require('express');
const isLoggedIn = require('../middlewares/isLoggedIn');
const router=express.Router();
const productModel=require('../models/product-model');
const cookieparsar=require('cookie-parser');
const userModel = require('../models/user-model');
router.use(cookieparsar());

router.get('/',(req,res)=>{
    let error=req.flash('error');
    res.render('index', { error,loggedin:false});
})

router.get('/shop',isLoggedIn,async (req,res)=>{
     let products=await productModel.find();
     let success= req.flash('success');
    res.render('shop',{products,success});
})
router.get('/cart',isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate('cart');
   let bill= 0;

     user.cart.forEach(function(item) {
    bill += Number(item.price) - Number(item.discount);
      });


    res.render('cart',{user,bill});
})
router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }); 
    user.cart.push(req.params.productid);
    await user.save();
    req.flash('success', 'Added to cart');  
    res.redirect('/shop');
});



module.exports=router;