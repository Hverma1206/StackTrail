import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
  };

  next();
};
