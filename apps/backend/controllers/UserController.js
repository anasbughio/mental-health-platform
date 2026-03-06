const User = require('../models/User');
const bcrypt = require('bcrypt');
exports.createUser = async (req,res) => {

try {
        const { name, email, password, role } = req.body;
        
        // 1. Check if a user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'A user with this email already exists' 
            });
        }

        // 2. Create the new user (the pre-save hook will hash the password here)
        const newUser = new User({ name, email, password, role });
        const savedUser = await newUser.save();
        
        // 3. Remove the hashed password from the response object for security
        savedUser.password = undefined;
        
        // 4. Send success response
        res.status(201).json({
            status: 'success',
            message: 'User registered securely!',
            data: savedUser
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }

}