const express=require('express');
const app=express();
const bycrpt=require('bcrypt');
const jwt=require('jsonwebtoken');
const path=require('path');
const cookieParser=require('cookie-parser');

const userModel=require('./models/user-model');
const productModel=require('./models/product-model');
const db=require('./config/mongoose-connection');
const usersRouter=require('./routes/usersRouter');
const ownersRouter=require('./routes/ownersRouter');
const productsRouter=require('./routes/productsRouter');

app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());

app.use('/users',usersRouter);
app.use('/products',productsRouter);
app.use('/owners',ownersRouter);

app.get('/',(req,res)=>{
    res.send('halo bhai');
})

app.listen(3000);



