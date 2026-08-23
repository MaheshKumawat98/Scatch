const express=require('express');
const router=express();

router.get('/',(req,res)=>{
    res.send('hey  its working ')
})

module.exports=router;