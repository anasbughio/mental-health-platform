const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

    

dotenv.config();
exports.createUser = async (req, res) => {
   
    
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
        console.error('[DEBUG] Error in controller:', error.message);
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
}

exports.loginUser =  async (req,res) =>{

   try{

    console.log("BODY:", req.body);
      const {email,password} = req.body;
    const emailTrim = email.trim();
      // 1. Find the user by email
      const user =  await  User.findOne({email:emailTrim});

      if(!user) {
        return res.status(400).json({
            status:'fail',
            message:'Invalid email or password'
        });
      }
      // 2. Check if the provided password matches the user's hashed password
      const isMatch = await bcrypt.compare(password,user.password);

      

      if(!isMatch){  
         return res.status(400).json({ 
            status:'fail',
            message:'Invalid email or password'
         });
      }
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); 
    
    // Refresh Token (long life)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

      // store refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
      res.cookie("token",token,{
            httpOnly:true,
            secure:truncates,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite:"none"
      })

   // 3. If everything is valid, send a success response (token generation can be added here later)
      res.status(200).json({
        status:'success',
        message:'Login successful',
        data: {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token
        }
      });         



   }catch(error){
    console.error('[DEBUG] Error in login controller:', error.message);
    console.log('[DEBUG] Request body:', req.body);
    res.status(400).json({
        status:'fail',
        message:error.message
    });
   } 
}


exports.logout = async (req,res) => {
res.clearCookie("token");
res.json({
    success: true,
    message: "Logged out successfully",
  });
}

