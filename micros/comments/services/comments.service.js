const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const Comment = require("../models/comment");
const { v4: uuidv4 } = require("uuid");
// const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// SaveComment save the post
exports.saveComment = async function (comment) {
  if (!comment.objectId) {
    try {
      comment.objectId = uuidv4();
      if (comment.created_date == 0) {
        comment.created_date = Math.floor(Date.now() / 1000);
      }
      return await Comment(comment).save();
    } catch (uuidErr) {
      return uuidErr;
    }
  }
};

// UpdateComment update the Comment
exports.updateCommentById = async function (data) {
  let filter = {
    objectId: data.objectId,
    ownerUserId: data.ownerUserId,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    return await Comment.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }
};

// UpdateCommentProfile update the post
exports.updateCommentProfile = async function (
  ownerUserId,
  ownerDisplayName,
  ownerAvatar
) {
  const filter = {
    ownerUserId: ownerUserId,
  };
  const data = {
    ownerDisplayName: ownerDisplayName,
    ownerAvatar: ownerAvatar,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    await Comment.updateMany(filter, updateOperator);
  } catch (error) {
    return error;
  }

  return true;
};

// DeleteCommentByOwner delete comment by ownerUserId and commentId
exports.deleteCommentByOwner = async function (ownerUserId, commentId) {
  let filter = {
    objectId: commentId,
    ownerUserId: ownerUserId,
  };

  try {
    return await Comment.deleteOne(filter);
  } catch (error) {
    return error;
  }
};
// DeleteCommentsByPostId delete comments by postId
exports.deleteCommentsByPostId = async function (ownerUserId, postId) {
  let filter = {
    postId: postId,
    ownerUserId: ownerUserId,
  };
  try {
    return await Comment.deleteMany(filter);
  } catch (error) {
    return error;
  }
};

// GetCommentByPostId get all comments by postId
exports.getCommentByPostId = async function (postId, sortBy, page) {
  let sortMap = {};
  sortMap[sortBy] = -1;
  let skip = numberOfItems * (page - 1);
  let limit = numberOfItems;
  let filter = {};
  if (postId) {
    filter["postId"] = postId;
  }

  try {
    return await findCommentList(filter, limit, skip, sortMap);
  } catch (error) {
    return error;
  }
};

// FindCommentList get all comments by filter
async function findCommentList(filter, limit, skip, sortMap) {
  try {
    const result = await Comment.find(filter)
      .sort(sortMap)
      .limit(limit)
      .skip(skip);

    let commentList = [];
    result.forEach((comment) => {
      commentList.push(comment);
    });

    return commentList;
  } catch (error) {
    return error;
  }
}

// FindById find by post id
exports.findById = async function (objectId) {
  let filter = {
    objectId: objectId,
  };
  try {
    return await Comment.findOne(filter);
  } catch (error) {
    return error;
  }
};
