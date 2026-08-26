const express=require('express');
const router=express();
const ownerModel=require('../models/owner-model');

router.get('/',(req,res)=>{
    res.send('hey  its working ')
})
 
// mean jab development mode me hi is route to access kar sacte h 
if(process.env.NODE_ENV==="development"){
router.post('/create',async (req,res)=>{
    let owners =await ownerModel.find();
    if(owners.length>0){
        return res
        .status(503)
        .send('you dont have the permission to create new owner');
    }
    let{fullname,email,password}=req.body;
    let createOwner=await ownerModel.create({
        fullname,
        email,
        password
    })
    res.status(201).send(createOwner);

})

}

router.get('/admin',(req,res)=>{
    let success=req.flash('success');
   res.render("createproducts", { success });
})

router.get("/create", (req, res) => {
    // Pass the flash message (or an empty array/string if none exists)
    const success = req.flash("success"); 
    res.render("createproducts", { success });
});


module.exports=router;