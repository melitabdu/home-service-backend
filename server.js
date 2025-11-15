import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

// Routes
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

// Load env
dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect MongoDB
connectDB();

// Allowed origins (local + deploy-ready)
const allowedOrigins = [
  "http://localhost:5173", // user UI
  "http://localhost:3000", // provider UI
  "http://localhost:5734", // admin UI

  "https://frontend-user-ui.vercel.app",           // deployed user UI
  "https://ethical-admin-ui-c1p1.vercel.app",      // deployed provider UI
  "https://ethical-admin-ui-yvu3.vercel.app",      // deployed admin UI
].filter(Boolean); // remove undefined / invalid entries

// Socket.io with fallback
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket", "polling"], // better cross-network support
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
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
app.use("/api/bookings", bookingRoutes);
app.use("/api/rental-bookings", rentalBookingRoutes);

// Ads + Properties
app.use("/api/advideos", adVideoRoutes);
app.use("/api/properties", propertyRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
