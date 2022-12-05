const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    objectId: { type: String },
    postTypeId: { type: Number },
    score: { type: Number },
    votes: { type: [String] },
    viewCount: { type: Number },
    body: { type: String },
    ownerUserId: { type: String },
    ownerDisplayName: { type: String },
    ownerAvatar: { type: String },
    tags: { type: [String] },
    commentCounter: { type: Number },
    image: { type: String },
    imageFullPath: { type: String },
    video: { type: String },
    thumbnail: { type: String },
    urlKey: { type: String },
    album: [
      {
        count: { type: Number },
        cover: { type: String },
        coverId: { type: String },
        photos: { type: [String] },
        title: { type: String },
      },
    ],
    disableComments: { type: Boolean },
    disableSharing: { type: Boolean },
    deleted: { type: Boolean },
    deletedDate: { type: Number },
    created_date: { type: Number },
    last_updated: { type: Number },
    accessUserList: { type: [String] },
    permission: {
      type: [String],
      enum: ["OnlyMe", "Public", "Circles", "Custom"],
      default: ["Public"],
    },
    version: { type: String },
  },
  { collection: "post" }
);

module.exports = mongoose.model("post", PostSchema);
