import mongoose from "mongoose";


const __NAME__Schema = new mongoose.Schema({
  // add your fields here


}, { timestamps: true });


export default mongoose.model("__NAME__", __NAME__Schema);
