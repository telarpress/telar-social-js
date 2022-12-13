const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    objectId: { type: String },
    score: { type: Number },
    ownerUserId: { type: String },
    ownerDisplayName: { type: String },
    ownerAvatar: { type: String },
    postId: { type: String },
    text: { type: String },
    deleted: { type: Boolean },
    deletedDate: { type: Number },
    created_date: { type: Number },
    last_updated: { type: Number },
  },
  { collection: "comment" }
);

module.exports = mongoose.model("comment", CommentSchema);
