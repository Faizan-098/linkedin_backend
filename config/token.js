import jwt from "jsonwebtoken";
const generateToken =  (userId) => {
  try {
    const token =  jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log(error?.message);
    return res.status(500).json({message:"Token Internal Server Error!"})
  }
};
export default generateToken;
