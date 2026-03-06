const User = require('../models/User');
const bcrypt = require('bcrypt');
exports.createUser = async (req,res) => {

 const {name,email,password,role} = req.body;

 try{
    const existingUser =  await User.findOne({email});
    if(existingUser)   res.status(400).json({status:'error',message:'Email already in use'});

    const hashedPassword = await bcrypt.hash(password,10);

    const newUser  = await User.create({
        name,
        email,
        password:hashedPassword,
        role,
    });

    res.status(201).json({status:'success',data:{user:newUser}});
   
 }catch(err){
    console.error('Error creating user:', err);
    res.status(500).json({status:'error',message:'Server error while creating user'});
 }

}