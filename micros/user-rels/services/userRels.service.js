const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const UserRel = require("../models/userRel");
const { v4: uuidv4 } = require("uuid");
// const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// followUser save the userRels
exports.followUser = async function (leftUser, rightUser, circleIds, tags) {
  try {
    let newUserRel = {
      left: leftUser,
      leftId: leftUser.userId,
      right: rightUser,
      rightId: rightUser.userId,
      rel: [leftUser.userId, rightUser.userId],
      circleIds: circleIds,
      tags: tags,
    };
    return await SaveUserRel(newUserRel);
  } catch (uuidErr) {
    return uuidErr;
  }
};

// SaveUserRel save the userRel
async function SaveUserRel(userRel) {
  if (!userRel.objectId) {
    try {
      userRel.objectId = uuidv4();
      if (!userRel.created_date) {
        userRel.created_date = Math.floor(Date.now() / 1000);
      }
      return await UserRel(userRel).save();
    } catch (uuidErr) {
      return uuidErr;
    }
  }
}

// UnfollowUser delete relation between two users by left and right userId
exports.unfollowUser = async function (leftId, rightId) {
  let filter = {
    leftId: leftId,
    rightId: rightId,
  };

  try {
    return await UserRel.deleteMany(filter);
  } catch (error) {
    return error;
  }
};

// DeleteCircle delete the circle from user-rel
exports.deleteCircle = async function (circleId) {
  console.log(circleId);
  let filter = {};
  let pullOperator = {};
  let inOperator = {};
  inOperator["$in"] = [circleId];
  let circleIds = {};
  circleIds["circleIds"] = inOperator;
  pullOperator["$pull"] = circleIds;

  try {
    return await UserRel.deleteMany(filter, pullOperator);
  } catch (error) {
    return error;
  }
};

// UpdateRelCircles update the user relation circle ids
exports.updateRelCircles = async function (leftId, rightId, circleIds) {
  let filter = {
    leftId: leftId,
    rightId: rightId,
  };

  let updateOperator = {
    $set: { circleIds: circleIds },
  };
  try {
    return await UserRel.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }
};

// GetFollowers Get user followers by userId
exports.getFollowers = async function (userId) {
  let sortMap = {};
  sortMap["created_date"] = -1;
  let filter = { rightId: userId };
  try {
    return await findRelsIncludeProfile(filter, 0, 0, sortMap);
  } catch (error) {
    return error;
  }
};

// FindRelsIncludeProfile get all user relations by filter including user profile entity
async function findRelsIncludeProfile(filter, limit, skip, sort) {
  let pipeline = [];

  let matchOperator = {};
  matchOperator["$match"] = filter;

  let sortOperator = {};
  sortOperator["$sort"] = sort;

  pipeline.push(matchOperator, sortOperator);

  if (skip > 0) {
    let skipOperator = {};
    skipOperator["$skip"] = skip;
    pipeline.push(skipOperator);
  }

  if (limit > 0) {
    let limitOperator = {};
    limitOperator["$limit"] = limit;
    pipeline.push(limitOperator);
  }

  // Add left user pipeline
  let lookupLeftUser = {};
  lookupLeftUser["$lookup"] = {
    localField: "leftId",
    from: "userProfile",
    foreignField: "objectId",
    as: "leftUser",
  };

  let unwindLeftUser = {};
  unwindLeftUser["$unwind"] = "$leftUser";
  pipeline.push(lookupLeftUser, unwindLeftUser);

  // Add right user pipeline
  let lookupRightUser = {};
  lookupRightUser["$lookup"] = {
    localField: "rightId",
    from: "userProfile",
    foreignField: "objectId",
    as: "rightUser",
  };

  let unwindRightUser = {};
  unwindRightUser["$unwind"] = "$rightUser";
  pipeline.push(lookupRightUser, unwindRightUser);

  console.log(".: pipeline :.");
  console.log(pipeline);

  let projectOperator = {};
  let project = {};

  // Add project operator
  project["objectId"] = 1;
  project["created_date"] = 1;
  project["leftId"] = 1;
  project["rightId"] = 1;
  project["rel"] = 1;
  project["tags"] = 1;
  project["circleIds"] = 1;
  // left user
  project["left.userId"] = "$leftId";
  project["left.fullName"] = "$leftUser.fullName";
  project["left.instagramId"] = "$leftUser.instagramId";
  project["left.twitterId"] = "$leftUser.twitterId";
  project["left.linkedInId"] = "$leftUser.linkedInId";
  project["left.facebookId"] = "$leftUser.facebookId";
  project["left.socialName"] = "$leftUser.socialName";
  project["left.created_date"] = "$leftUser.created_date";
  project["left.banner"] = "$leftUser.banner";
  project["left.avatar"] = "$leftUser.avatar";
  // Right user
  project["right.userId"] = "$rightId";
  project["right.fullName"] = "$rightUser.fullName";
  project["right.instagramId"] = "$rightUser.instagramId";
  project["right.twitterId"] = "$rightUser.twitterId";
  project["right.linkedInId"] = "$rightUser.linkedInId";
  project["right.facebookId"] = "$rightUser.facebookId";
  project["right.socialName"] = "$rightUser.socialName";
  project["right.created_date"] = "$rightUser.created_date";
  project["right.banner"] = "$rightUser.banner";
  project["right.avatar"] = "$rightUser.avatar";

  projectOperator["$project"] = project;
  pipeline.push(projectOperator);

  const result = await UserRel.aggregate(pipeline);

  let postList = [];
  result.forEach((post) => {
    postList.push(post);
  });

  return postList;
}

// GetFollowing Get user's following by userId
exports.getFollowing = async function (userId) {
  let sortMap = {};
  sortMap["created_date"] = -1;
  let filter = { leftId: userId };
  try {
    return await findRelsIncludeProfile(filter, 0, 0, sortMap);
  } catch (error) {
    return error;
  }
};
