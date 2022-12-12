const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VoteSchema = new Schema(
  {
    objectId: { type: String },
    ownerUserId: { type: String },
    ownerDisplayName: { type: String },
    ownerAvatar: { type: String },
    postId: { type: String },
    typeId: { type: Number },
    created_date: { type: Number },
  },
  { collection: "vote" }
);

module.exports = mongoose.model("vote", VoteSchema);
