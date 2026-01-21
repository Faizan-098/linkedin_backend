import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    // Get token from cookies
    const { token } = req.cookies;

    if (!token) {
      return res.status(400).json({ message: "Authentication token missing!" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return res.status(400).json({ message: "Invalid user token!" });
    }

    // Attach userId to request object
    req.userId = decoded.userId;

    // Move to next middleware/controller
    next();
  } catch (error) {
    console.error("isAuth middleware error:", error);

    return res.status(500).json({
      message: "isAuth middleware inernel server error!",
    });
  }
};
export default isAuth;
