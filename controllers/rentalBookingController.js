import fs from "fs";
import path from "path";
import RentalBooking from "../models/RentalBooking.js";
import Property from "../models/Property.js";

/** ─────────────────────────────────────────────────────────────────────────────
 * Helpers & Constants
 * ────────────────────────────────────────────────────────────────────────────*/
const BLOCKING_STATUSES = ["pending", "owner_confirm", "awaiting_payment", "processing", "completed"];
const OWNER_DELETABLE_STATUSES = ["rejected", "completed"];

const normalizeDate = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => (aStart < bEnd) && (aEnd > bStart);

const canOwnerTransition = (current, next) => {
  if (next === "owner_confirm") return current === "pending";
  if (next === "rejected") return ["pending", "owner_confirm", "awaiting_payment"].includes(current);
  return false;
};

const canAdminTransition = (current, next, isPaid) => {
  switch (next) {
    case "awaiting_payment":
      return current === "owner_confirm"; 
    case "processing":
      return current === "awaiting_payment" && isPaid;
    case "completed":
      return ["processing", "awaiting_payment"].includes(current) && isPaid;
    case "cancelled":
      return !isPaid && ["pending", "owner_confirm", "awaiting_payment"].includes(current);
    default:
      return false;
  }
};

const emitSafe = (req, event, payload) => {
  try {
    const io = req.app.get("io");
    if (io) io.emit(event, payload);
  } catch {}
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Create rental booking (User)
 * ────────────────────────────────────────────────────────────────────────────*/
export const createRentalBooking = async (req, res) => {
  try {
    const {
      propertyId,
      startDate,
      endDate,
      fullName,
      phone,
      email,
      guests,
      notes,
    } = req.body;

    const idFile = req.file?.path;
    if (!idFile) return res.status(400).json({ message: "ID file is required" });

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    if (!start || !end) return res.status(400).json({ message: "Invalid dates" });
    if (!(start < end)) return res.status(400).json({ message: "startDate must be before endDate" });

    const overlapping = await RentalBooking.findOne({
      propertyId,
      status: { $in: BLOCKING_STATUSES },
      $expr: {
        $and: [
          { $lt: [start, "$endDate"] },
          { $gt: [end, "$startDate"] },
        ],
      },
    }).lean();

    if (overlapping) {
      return res.status(409).json({
        message: "Selected dates are not available for this property.",
        conflictWith: { id: overlapping._id, startDate: overlapping.startDate, endDate: overlapping.endDate, status: overlapping.status },
      });
    }

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return res.status(400).json({ message: "Booking must be at least 1 night" });

    const nightly = Number(property.price) || 0;
    const totalPrice = totalDays * nightly;

    const booking = new RentalBooking({
      propertyId,
      userId: req.user?._id || null,
      ownerId: property.owner,
      fullName,
      phone,
      email,
      guests,
      notes,
      idFile,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
    });

    await booking.save();
    emitSafe(req, "newBooking", booking);

    return res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * User views their own bookings (reveal owner only if paid)
 * ────────────────────────────────────────────────────────────────────────────*/
export const getMyRentalBookings = async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ userId: req.user._id })
      .populate("propertyId")
      .populate("ownerId")
      .sort({ startDate: -1 })
      .lean();

    const safe = bookings.map((b) => {
      const reveal = b.paymentStatus === "paid";
      const owner = b.ownerId || {};
      return {
        ...b,
        ownerContact: reveal
          ? { name: owner.name || "Owner", phone: owner.phone, email: owner.email }
          : { name: "Hidden until payment", phone: "Hidden until payment", email: "Hidden until payment" },
      };
    });

    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Owner views bookings (reveal renter only if paid)
 * ────────────────────────────────────────────────────────────────────────────*/
export const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ ownerId: req.user._id })
      .populate("propertyId")
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();

    const safe = bookings.map((b) => {
      const reveal = b.paymentStatus === "paid";
      return {
        ...b,
        renterContact: reveal
          ? {
              fullName: b.fullName,
              phone: b.phone,
              email: b.email,
              address: b.address,
              notes: b.notes || "",
            }
          : {
              fullName: "Hidden until payment",
              phone: "Hidden until payment",
              email: "Hidden until payment",
              address: "Hidden until payment",
              notes: "Hidden until payment",
            },
      };
    });

    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await RentalBooking.find({})
      .populate("propertyId")
      .populate("userId")
      .populate("ownerId")
      .sort({ startDate: 1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Update booking status (Owner)
 * ────────────────────────────────────────────────────────────────────────────*/
export const updateBookingStatusOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;

    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!req.user || booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (!["owner_confirm", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status for owner" });

    if (!canOwnerTransition(booking.status, status))
      return res.status(409).json({ message: `Cannot change status ${booking.status} → ${status}` });

    booking.status = status;
    booking.history.push({ status, changedBy: req.user._id, note: note || "" });
    await booking.save();

    if (status === "owner_confirm") emitSafe(req, "booking-owner-confirmed", booking);

    return res.json({ message: "Booking updated by owner", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Update booking status (Admin)
 * ────────────────────────────────────────────────────────────────────────────*/
export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;

    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isPaid = booking.paymentStatus === "paid";
    const ALLOWED = ["awaiting_payment", "processing", "completed", "cancelled"];
    if (!ALLOWED.includes(status))
      return res.status(400).json({ message: "Invalid status for admin" });

    if (!canAdminTransition(booking.status, status, isPaid))
      return res.status(409).json({ message: `Cannot change status ${booking.status} → ${status}` });

    booking.status = status;
    booking.history.push({ status, changedBy: req.user?._id || (req.isAdminSecret ? "admin_secret" : null), note: note || "" });
    await booking.save();

    if (status === "awaiting_payment") emitSafe(req, "booking-awaiting-payment", booking);
    else emitSafe(req, "bookingUpdated", booking);

    return res.json({ message: "Booking updated by admin", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Mark booking as paid (Admin)
 * ────────────────────────────────────────────────────────────────────────────*/
export const markBookingAsPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.paymentStatus = "paid";
    if (booking.status === "awaiting_payment") booking.status = "processing";
    booking.history.push({ status: booking.status, changedBy: req.user?._id || (req.isAdminSecret ? "admin_secret" : null), note: "Marked paid by admin" });

    await booking.save();
    emitSafe(req, "booking-paid", booking);

    return res.json({ message: "Booking marked as paid", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Delete booking (Admin) – 🔥 no restrictions
 * ────────────────────────────────────────────────────────────────────────────*/
export const deleteBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 🗑️ Delete ID file if it exists
    if (booking.idFile) {
      const filePath = path.isAbsolute(booking.idFile)
        ? booking.idFile
        : path.join(process.cwd(), booking.idFile);

      fs.unlink(filePath, (err) => {
        if (err) console.error("⚠️ Failed to delete ID file:", err.message);
      });
    }

    await booking.deleteOne();
    emitSafe(req, "bookingDeleted", bookingId);

    return res.json({ message: "✅ Booking deleted by admin", bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Delete booking (Owner) – still restricted
 * ────────────────────────────────────────────────────────────────────────────*/
export const deleteBookingOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!req.user || booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (!OWNER_DELETABLE_STATUSES.includes(booking.status))
      return res.status(400).json({ message: "Can only delete completed or rejected bookings" });

    await booking.deleteOne();
    emitSafe(req, "bookingDeleted", bookingId);

    return res.json({ message: "Booking deleted by owner", bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
