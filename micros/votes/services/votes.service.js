const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const Vote = require("../models/vote");
const { v4: uuidv4 } = require("uuid");
// const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// saveVote save the post
exports.saveVote = async function (vote) {
  if (!vote.objectId) {
    try {
      vote.objectId = uuidv4();
      if (vote.created_date == 0) {
        vote.created_date = Math.floor(Date.now() / 1000);
      }
      return await Vote(vote).save();
    } catch (uuidErr) {
      return uuidErr;
    }
  }
};

// UpdateVote update the Vote
exports.updateVoteById = async function (data) {
  let filter = {
    objectId: data.objectId,
    ownerUserId: data.ownerUserId,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    console.log(data);
    return await Vote.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }
};

// DeleteVoteByOwner delete vote by ownerUserId and voteId
exports.deleteVoteByOwner = async function (ownerUserId, voteId) {
  let filter = {
    objectId: voteId,
    ownerUserId: ownerUserId,
  };

  try {
    return await Vote.deleteOne(filter);
  } catch (error) {
    return error;
  }
};
// DeleteVotesByPostId delete votes by postId
exports.deleteVotesByPostId = async function (ownerUserId, postId) {
  let filter = {
    postId: postId,
    ownerUserId: ownerUserId,
  };
  try {
    return await Vote.deleteMany(filter);
  } catch (error) {
    return error;
  }
};

// GetVoteByPostId get all votes by postId
exports.getVoteByPostId = async function (postId, sortBy, page) {
  let sortMap = {};
  sortMap[sortBy] = -1;
  let skip = numberOfItems * (page - 1);
  let limit = numberOfItems;
  let filter = {};
  if (postId) {
    filter["postId"] = postId;
  }

  try {
    return await findVoteList(filter, limit, skip, sortMap);
  } catch (error) {
    return error;
  }
};

// FindVoteList get all votes by filter
async function findVoteList(filter, limit, skip, sortMap) {
  try {
    const result = await Vote.find(filter)
      .sort(sortMap)
      .limit(limit)
      .skip(skip);

    let voteList = [];
    result.forEach((vote) => {
      voteList.push(vote);
    });

    return voteList;
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
    return await Vote.findOne(filter);
  } catch (error) {
    return error;
  }
};
