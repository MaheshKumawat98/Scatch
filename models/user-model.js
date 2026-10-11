const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
fullname: String,
email: String,
password: String,
cart: [{
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
}],

role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
},

orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
}],
contact:Number,
picture: String

})

module.exports= mongoose.model('user',userSchema);