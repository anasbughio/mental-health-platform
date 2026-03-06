const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema  = new mongoose.Schema({

    name:{
        type:String,
        required:[true,'Please provide a name'],
        trim:true,
        },
        
    email:{
        type:String,
        required:[true,'Please provide an email'],
        unique:true,
        lowercase:true,
        trim:true,
    },

    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:6,
    },

    role:{
        type:String,
        enum:['patient','provider','admin'],
        default:'patient',
    },




},{timestamps:true});

// The Pre-Save Hook: Encrypt password before saving
userSchema.pre('save', async function(next) {
    // Only hash if the password was just created or modified
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a secure "salt" and scramble the password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User',UserSchema);