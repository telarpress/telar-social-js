const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MediaSchema =
  ({
    objectId: { type: String },
    deletedDate: { type: Number },
    created_date: { type: Number },
    thumbnail: { type: String },
    url: { type: String },
    fullPath: { type: String },
    caption: { type: String },
    directory: { type: String },
    fileName: { type: String },
    ownerUserId: { type: String },
    last_updated: { type: Number },
    albumId: { type: String },
    width: { type: Number },
    height: { type: Number },
    meta: { type: String },
    accessUserList: [{ type: String }],
    permission: {
      type: [String],
      enum: ["Public", "OnlyMe", "Circles", "Custom"],
      default: ["Public"],
    },
    deleted: { type: Boolean },
  },
  { collection: "media" });

module.exports = mongoose.model("media", MediaSchema);
