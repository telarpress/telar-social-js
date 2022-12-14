const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CircleSchema = new Schema(
  {
    objectId: { type: String },
    ownerUserId: { type: String },
    name: { type: String },
    isSystem: { type: Boolean },
    created_date: { type: Number },
  },
  { collection: "circle" }
);

module.exports = mongoose.model("circle", CircleSchema);
