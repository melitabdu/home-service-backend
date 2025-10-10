// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { cloudinary } from "./config/cloudinary.js"; // ✅ Add this line

// ✅ Load environment variables first
dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Connect to MongoDB
connectDB();

// ✅ Quick Cloudinary Check (optional for logs)
console.log("☁️ Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing",
});

// ✅ Socket.io setup
export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // User UI
      "http://localhost:3000", // Provider UI
      "http://localhost:5734", // Admin UI
    ],
    credentials: true,
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5734",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Serve static uploads (still needed for local uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * 🔹 API Routes
 */
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/AuthRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import providerAuthRoutes from "./routes/providerAuthRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adVideoRoutes from "./routes/adVideoRoutes.js";
import providerUnavailableDateRoutes from "./routes/providerUnavailableDateRoutes.js";
import adminUnavailableDateRoutes from "./routes/adminUnavailableDateRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import ownerAuthRoutes from "./routes/ownerAuthRoutes.js";
import rentalBookingRoutes from "./routes/rentalBookingRoutes.js";
import adminRentalBookingRoutes from "./routes/adminRentalBookingRoutes.js";

// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Providers
app.use("/api/providers/auth", providerAuthRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/providers/unavailable-dates", providerUnavailableDateRoutes);

// Admin
app.use("/api/admin", adminRoutes);
app.use("/api/admin/unavailable-dates", adminUnavailableDateRoutes);
app.use("/api/admin/rental-bookings", adminRentalBookingRoutes);

// Owners
app.use("/api/owners", ownerRoutes);
app.use("/api/owners/auth", ownerAuthRoutes);

// Bookings
app.use("/api/bookings", bookingRoutes); // service bookings
app.use("/api/rental-bookings", rentalBookingRoutes); // rental bookings

// Ads & Properties
app.use("/api/advideos", adVideoRoutes);
app.use("/api/properties", propertyRoutes);

// ✅ Optional: Cloudinary connection test endpoint
app.get("/api/test-cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ message: "✅ Cloudinary connected successfully", result });
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
    res.status(500).json({ message: "❌ Cloudinary not connected", error });
  }
});

// ✅ Default error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
