const  jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
exports.authMiddleware = (req,res,next) => {
try{
    // console.log('[DEBUG] Cookies received from Thunder Client:', req.cookies);
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];// get token from cookies

    if(!token){
        return res.status(401).json({
            status:'fail',
            message:'Unauthorized: No token provided'
        });
    }

      const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();


}catch(error){

   return res.status(401).json({
        status:'fail',
        message:'Unauthorized: Invalid or missing token'
    })
}
}


exports.refreshToken = (req, res) => {

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token missing"
    });
  }

  try {

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      accessToken: accessToken
    });

  } catch (error) {

    return res.status(403).json({
      message: "Invalid refresh token"
    });

  }
};