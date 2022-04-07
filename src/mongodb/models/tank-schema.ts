import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const loggingSchema = new Schema({
  _id: reqString, // Game ID
  sr: reqString, // SR gained/lost
  timestamp: reqString,
  ifEndSr: Boolean,
});

const name = "tank";

export default mongoose.models[name] ||
  mongoose.model(name, loggingSchema, name);
