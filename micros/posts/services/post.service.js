const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const Post = require("../models/post");
const { v4: uuidv4 } = require("uuid");
const { default: axios } = require("axios");
const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// SavePost save the post
exports.savePost = async function (post) {
  if (!post.objectId) {
    try {
      post.objectId = uuidv4();
    } catch (uuidErr) {
      return uuidErr;
    }
  }

  if (post.created_date == 0) {
    post.created_date = Math.floor(Date.now() / 1000);
  }
  return await Post(post).save();
};

// CreatePostIndex create index for post search.
exports.createPostIndex = async function (indexes) {
  return await Post.createIndexes(indexes);
};

// UpdatePost update the post
exports.UpdatePostById = async function (data) {
  let filter = {
    objectId: data.objectId,
    ownerUserId: data.ownerUserId,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    await Post.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }

  return true;
};

// UpdatePostProfile update the post
exports.updatePostProfile = async function (
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
    await Post.updateMany(filter, updateOperator);
  } catch (error) {
    return error;
  }

  return true;
};

// IncrementScoreCount increment score of post
exports.incrementScoreCount = async function (objectId, ownerUserId, avatar) {
  const filter = {
    objectId: objectId,
  };

  let data = {};
  const targetField = `votes.${ownerUserId}`;
  console.log(`IncrementScoreCount ${targetField} - ${objectId} - ${avatar} `);
  data[targetField] = avatar;
  let updateOperator = {
    $set: data,
  };
  try {
    await Post.updateOne(filter, updateOperator, { upsert: true });
  } catch (error) {
    return error;
  }
  return true;
};

// DecrementScoreCount increment score of post
exports.decrementScoreCount = async function (objectId, ownerUserId) {
  const filter = {
    objectId: objectId,
  };

  let data = {};
  const targetField = `votes.${ownerUserId}`;
  console.log(`decrementScoreCount ${targetField} - ${objectId}} `);
  data[targetField] = "";
  let updateOperator = {
    $set: data,
  };
  try {
    return await Post.updateOne(filter, updateOperator, { upsert: true });
  } catch (error) {
    return error;
  }
};

// Increment increment a post field
async function increment(objectId, field, value) {
  const filter = {
    objectId: objectId,
  };

  let data = {};
  data[field] = value;
  let incOperator = {
    $inc: data,
  };
  try {
    return await Post.updateOne(filter, incOperator);
  } catch (error) {
    return error;
  }
}

// IncerementCommentCount increment comment count of post
exports.incrementCommentCount = async function (objectId) {
  return await increment(objectId, "commentCounter", 1);
};

// DeceremntCommentCount decerement comment count of post
exports.decerementCommentCount = async function (objectId) {
  return await increment(objectId, "commentCounter", -1);
};

// DisableCommnet
exports.disableCommnet = async function (ownerUserId, objectId, value) {
  const filter = {
    objectId: objectId,
    ownerUserId: ownerUserId,
  };

  let data = {};
  data["disableComments"] = value;
  let disableOperator = {
    $set: data,
  };
  try {
    return await Post.updateOne(filter, disableOperator);
  } catch (error) {
    return error;
  }
};

// DisableSharing
exports.disableSharing = async function (ownerUserId, objectId, value) {
  const filter = {
    objectId: objectId,
    ownerUserId: ownerUserId,
  };

  let data = {};
  data["disableSharing"] = value;
  let disableOperator = {
    $set: data,
  };
  try {
    return await Post.updateOne(filter, disableOperator);
  } catch (error) {
    return error;
  }
};

// FindById find by post id
exports.findById = async function (objectId) {
  let filter = {
    objectId: objectId,
  };
  try {
    return await Post.findOne(filter);
  } catch (error) {
    return error;
  }
};

// UpdatePostURLKey update the post URL key
exports.updatePostURLKey = async function (postId, urlKey) {
  let filter = {
    objectId: postId,
  };
  let data = { urlKey: urlKey };
  let updateOperator = {
    $set: data,
  };
  try {
    return await Post.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }
};

// getUserProfileByID Get user profile by user ID
exports.getUserProfileByID = async function (userId) {
  try {
    const profileURL = `"/profile/dto/id/${userId.String()}`;

    const foundProfileData = await microCall("get", [], profileURL, "");
    if (!foundProfileData) {
      log.Error(`functionCall (${profileURL}) - foundProfileData `);
    }

    return await foundProfileData;
  } catch (error) {
    return error;
  }
};

// microCall send request to another function/microservice using cookie validation
/**
 *
 * @param {'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH'
  | 'purge' | 'PURGE'
  | 'link' | 'LINK'
  | 'unlink' | 'UNLINK'} method
 * @param {*} data
 * @param {string} url
 * @param {*} headers
 */
exports.microCall = async (method, data, url, headers = {}) => {
  try {
    const digest = GateKeeper.sign(JSON.stringify(data), process.env.HMAC_KEY);
    headers["Content-type"] = "application/json;charset=UTF-8";
    headers[appConfig.HMAC_NAME] = digest;

    console.log(`\ndigest: ${digest}, header: ${appConfig.HMAC_NAME} \n`);

    if (!headers) {
      for (let k = 0; k < headers.length; k++) {
        for (let v = 0; v < headers.length; v++) {
          axiosConfig.headers[headers[k]] = headers[v];
        }
      }
    }
    //  url: appConfig.InternalGateway + url,
    const result = await axios({
      method: method,
      data,
      url: "http://localhost" + url,
      headers,
    });
    return result.data;
  } catch (error) {
    // handle axios error and throw correct error
    // https://github.com/axios/axios#handling-errors
    console.log(
      `Error while sending admin check request!: callAPIWithHMAC ${url}`
    );
    return Error(
      "Error while sending admin check request!: admin/callAPIWithHMAC"
    );
  }
};

// DeletePost delete post by ownerUserId and postId
exports.deletePostByOwner = async function (ownerUserId, postId) {
  let filter = {
    objectId: postId,
    ownerUserId: ownerUserId,
  };

  try {
    return await Post.deleteOne(filter);
  } catch (error) {
    return error;
  }
};

// QueryPostIncludeUser get all posts by query including user entity
exports.queryPostIncludeUser = async function (
  search,
  ownerUserIds,
  postTypeId,
  sortBy,
  page
) {
  try {
    let sortMap = {};
    sortMap[sortBy] = -1;
    let skip = numberOfItems * (page - 1);
    let limit = numberOfItems;
    let filter = {};
    if (search != "") {
      filter["$text"] = { search: search };
    }
    if (ownerUserIds && (ownerUserIds || []).length > 0) {
      let inFilter = {};
      inFilter["$in"] = ownerUserIds;
      filter["ownerUserId"] = inFilter;
    }
    if (postTypeId > 0) {
      filter["postTypeId"] = postTypeId;
    }
    return await findPostsIncludeProfile(filter, limit, skip, sortMap);
  } catch (error) {
    return error;
  }
};

// FindPostsIncludeProfile get all posts by filter
async function findPostsIncludeProfile(filter, limit, skip, sortMap) {
  try {
    return await Post.find(filter).sort(sortMap).limit(limit).skip(skip);
  } catch (error) {
    return error;
  }
}

// FindByURLKey find by URL key
exports.findByURLKey = async function (urlKey) {
  let filter = {
    urlKey: urlKey,
  };

  try {
    return await Post.findOne(filter);
  } catch (error) {
    return error;
  }
};
