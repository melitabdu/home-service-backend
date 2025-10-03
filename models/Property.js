import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["house", "car", "shop/store", "store", "whole/tent", "other"],
    },
    images: [{ url: String, public_id: String }],

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
