const express=require('express');
const app=express();
require('dotenv').config(); // matlab ab aap .env file varible use kar sacte ho like example JWT_KEY so how use process.env.JWT_KEY 
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const path=require('path');
const cookieParser=require('cookie-parser');
const expressSession=require('express-session');
const flash=require('connect-flash');

const userModel=require('./models/user-model');
const productModel=require('./models/product-model');
const db=require('./config/mongoose-connection');
const usersRouter=require('./routes/usersRouter');
const ownersRouter=require('./routes/ownersRouter');
const productsRouter=require('./routes/productsRouter');
const index=require('./routes/index');



app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());
app.use(
    expressSession({
         resave:false,
         saveUninitialized:false,
         secret:process.env.EXPRESS_SESSION_SECRET,
    })
)
app.use(flash());

app.use('/users',usersRouter);
app.use('/products',productsRouter);
app.use('/owners',ownersRouter);
app.use('/',index);


app.listen(3000);



