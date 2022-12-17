const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userRelMeta = {
  userId: { type: String },
  created_date: { type: Number },
  fullName: { type: String },
  socialName: { type: String },
  instagramId: { type: String },
  twitterId: { type: String },
  facebookId: { type: String },
  linkedinId: { type: String },
  banner: { type: String },
  avatar: { type: String },
};

const UserRelSchema = new Schema(
  {
    objectId: { type: String },
    left: userRelMeta,
    leftId: { type: String },
    right: userRelMeta,
    rightId: { type: String },
    rel: { type: Array, default: [] },
    tags: { type: Array, default: [] },
    circleIds: { type: Array, default: [] },

    created_date: { type: Number },
  },
  { collection: "userRel" }
);

module.exports = mongoose.model("userRel", UserRelSchema);
