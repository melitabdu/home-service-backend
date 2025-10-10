import RentalBooking from "../models/RentalBooking.js";
import Property from "../models/Property.js";
import { cloudinary } from "../config/cloudinary.js";

/** ─────────────────────────────────────────────────────────────
 * Helpers & Constants
 */
const BLOCKING_STATUSES = ["pending", "owner_confirm", "awaiting_payment", "processing", "completed"];
const OWNER_DELETABLE_STATUSES = ["rejected", "completed"];

const normalizeDate = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

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

/** ─────────────────────────────────────────────────────────────
 * Create rental booking (User)
 */
export const createRentalBooking = async (req, res) => {
  try {
    const { propertyId, startDate, endDate, fullName, phone, email, guests, notes } = req.body;

    if (!req.file) return res.status(400).json({ message: "ID ፎቶ አስፈላጊ ነው" });

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "ንብረቱ አልተገኘም" });

    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    if (!start || !end) return res.status(400).json({ message: "ትክክለኛ ቀናት ያስገቡ" });
    if (!(start < end)) return res.status(400).json({ message: "መነሻ ቀን ከመጨረሻ ቀን ትክክል መሆን አለበት" });

    // Check overlapping bookings
    const overlapping = await RentalBooking.findOne({
      propertyId,
      status: { $in: BLOCKING_STATUSES },
      $expr: { $and: [{ $lt: [start, "$endDate"] }, { $gt: [end, "$startDate"] }] },
    }).lean();

    if (overlapping)
      return res.status(409).json({
        message: "የተመረጡት ቀናት ስለዚህ ንብረት የማይገኝ ነው",
        conflictWith: {
          id: overlapping._id,
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
          status: overlapping.status,
        },
      });

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return res.status(400).json({ message: "ቦኪንግ ቢያንስ 1 ሌሊት መሆን አለበት" });

    const nightly = Number(property.price) || 0;
    const totalPrice = totalDays * nightly;

    // Upload ID file
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "home-serv",
      resource_type: "image",
    });

    const booking = new RentalBooking({
      propertyId,
      userId: req.user?._id || null,
      ownerId: property.owner,
      fullName,
      phone,
      email,
      guests,
      notes,
      idFile: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: "image",
      },
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
    });

    await booking.save();
    emitSafe(req, "newBooking", booking);

    return res.status(201).json({ message: "✅ ቦኪንግ ተፈጥሯል", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ ቦኪንግ ላይ ስህተት ተከስቷል", error: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * User views their own bookings
 */
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
          : { name: "እስካሁን ክፍያ ሳይከፈል", phone: "እስካሁን ክፍያ ሳይከፈል", email: "እስካሁን ክፍያ ሳይከፈል" },
      };
    });

    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Owner views bookings
 */
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
          ? { fullName: b.fullName, phone: b.phone, email: b.email, notes: b.notes || "" }
          : { fullName: "እስካሁን ክፍያ ሳይከፈል", phone: "እስካሁን ክፍያ ሳይከፈል", email: "እስካሁን ክፍያ ሳይከፈል", notes: "እስካሁን ክፍያ ሳይከፈል" },
      };
    });

    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Admin views all bookings
 */
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

/** ─────────────────────────────────────────────────────────────
 * Owner updates status
 */
export const updateBookingStatusOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;

    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "ቦኪንግ አልተገኘም" });
    if (!req.user || booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "የማይፈቀድዎ ነው" });
    if (!["owner_confirm", "rejected"].includes(status))
      return res.status(400).json({ message: "ቦኪንግ ሁኔታ ለባለቤት የተፈቀደ አይደለም" });
    if (!canOwnerTransition(booking.status, status))
      return res.status(409).json({ message: `ከ ${booking.status} ወደ ${status} ማስተካከያ አይቻልም` });

    booking.status = status;
    booking.history.push({ status, changedBy: req.user._id, note: note || "" });
    await booking.save();

    if (status === "owner_confirm") emitSafe(req, "booking-owner-confirmed", booking);
    return res.json({ message: "ቦኪንግ በባለቤት ተሻሽሏል", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Admin updates status
 */
export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;

    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "ቦኪንግ አልተገኘም" });

    const isPaid = booking.paymentStatus === "paid";
    const ALLOWED = ["awaiting_payment", "processing", "completed", "cancelled"];
    if (!ALLOWED.includes(status))
      return res.status(400).json({ message: "ቦኪንግ ሁኔታ ለአስተዳዳሪ የተፈቀደ አይደለም" });
    if (!canAdminTransition(booking.status, status, isPaid))
      return res.status(409).json({ message: `ከ ${booking.status} ወደ ${status} ማስተካከያ አይቻልም` });

    booking.status = status;
    booking.history.push({
      status,
      changedBy: req.user?._id || (req.isAdminSecret ? "admin_secret" : null),
      note: note || "",
    });
    await booking.save();

    if (status === "awaiting_payment") emitSafe(req, "booking-awaiting-payment", booking);
    else emitSafe(req, "bookingUpdated", booking);

    return res.json({ message: "ቦኪንግ በአስተዳዳሪ ተሻሽሏል", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Mark as paid
 */
export const markBookingAsPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "ቦኪንግ አልተገኘም" });

    booking.paymentStatus = "paid";
    if (booking.status === "awaiting_payment") booking.status = "processing";
    booking.history.push({
      status: booking.status,
      changedBy: req.user?._id || (req.isAdminSecret ? "admin_secret" : null),
      note: "በአስተዳዳሪ የተከፈለበት ተደርጓል",
    });

    await booking.save();
    emitSafe(req, "booking-paid", booking);
    return res.json({ message: "ቦኪንግ ክፍያ ተከፍሏል", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Delete booking (Admin)
 */
export const deleteBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "ቦኪንግ አልተገኘም" });

    // Delete ID image
    if (booking.idFile?.public_id) {
      try {
        await cloudinary.uploader.destroy(booking.idFile.public_id, { resource_type: "image" });
      } catch (err) {
        console.error("⚠️ የID ፎቶ ማጥፊያ አልተሳካም:", err.message);
      }
    }

    await booking.deleteOne();
    emitSafe(req, "bookingDeleted", bookingId);
    return res.json({ message: "ቦኪንግ በአስተዳዳሪ ተሰርዟል", bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** ─────────────────────────────────────────────────────────────
 * Delete booking (Owner)
 */
export const deleteBookingOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "ቦኪንግ አልተገኘም" });

    if (!req.user || booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "የማይፈቀድዎ ነው" });

    if (!OWNER_DELETABLE_STATUSES.includes(booking.status))
      return res.status(400).json({ message: "ብቻ የተዘረዘሩ ወይም የተሰረዙ ቦኪንግ መሰረዝ ይቻላል" });

    // Delete ID image
    if (booking.idFile?.public_id) {
      try {
        await cloudinary.uploader.destroy(booking.idFile.public_id, { resource_type: "image" });
      } catch (err) {
        console.error("⚠️ የID ፎቶ ማጥፊያ አልተሳካም:", err.message);
      }
    }

    await booking.deleteOne();
    emitSafe(req, "bookingDeleted", bookingId);
    return res.json({ message: "ቦኪንግ በባለቤት ተሰርዟል", bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
