const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
fullname: String,
email: String,
password: String,
cart: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:'product',
}],

admin :{
   type: Boolean,
   default:false,
},

order: {
      type: Array,
    default:[]

},
contact:Number,
picture: String

})

module.exports= mongoose.model('user',userSchema);