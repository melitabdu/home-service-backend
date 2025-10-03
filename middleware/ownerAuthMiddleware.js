import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";

// ✅ Protect Owner routes
export const protectOwner = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find owner by decoded ID
      const owner = await Owner.findById(decoded.id).select("-password");
      if (!owner) {
        return res.status(401).json({ message: "Owner not found / Unauthorized" });
      }

      req.user = owner; // normalize as req.user for consistency
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
