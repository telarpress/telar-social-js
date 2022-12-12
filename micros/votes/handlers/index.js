const voteService = require("../services/votes.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { appConfig } = require("../config");
const GateKeeper = require("../utils/hmac");
const { default: axios } = require("axios");

// const { validate: uuidValidate } = require("uuid");

// CreateVoteHandle handle create a new vote
exports.createVoteHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[CreateVoteHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "vote.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[CreateVoteHandle] vote text is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.parseCreateVoteHandleModel",
            "Parse CreateVoteHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error("[CreateVoteHandle] vote postId is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.postIdIsRequired",
            "Parse CreateVoteHandle vote postId is required"
          ).json()
        );
    }

    if (!model.typeId) {
      log.Error("[CreateVoteHandle] vote typeId is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.typeIdIsRequired",
            "Parse CreateVoteHandle vote typeId is required"
          ).json()
        );
    }

    let newVote = {
      ownerUserId: currentUser.userId,
      postId: model.postId,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      typeId: model.typeId,
      created_date: Math.floor(Date.now() / 1000),
    };
    let userInfoReq = {
      userId: currentUser.userId,
      username: currentUser.email,
      avatar: currentUser.avatar,
      displayName: currentUser.displayName,
      systemRole: currentUser.role,
    };
    const saveVoteChannel = await voteService.saveVote(newVote);
    const postURL = "/posts/" + model.postId;
    const readPostChannel = {
      Result: await microCall(
        "get",
        postURL,
        await getHeadersFromUserInfoReq(userInfoReq)
      ),
    };

    const [savevoteResult, postResult] = await Promise.all([
      saveVoteChannel,
      readPostChannel,
    ]);

    if (!savevoteResult) {
      log.Error("[CreateVoteHandle] Save vote Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.internal/savevote",
            "Error happened while saving vote!"
          ).json()
        );
    }
    if (!postResult) {
      log.Error("[CreateVoteHandle] Save vote Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.internal/postResult",
            "Cannot get the post! error"
          ).json()
        );
    }

    // Create user headers for http request
    let userHeaders = {};
    userHeaders["uid"] = userInfoReq.userId;
    userHeaders["email"] = userInfoReq.username;
    userHeaders["avatar"] = userInfoReq.avatar;
    userHeaders["displayName"] = userInfoReq.displayName;
    userHeaders["role"] = userInfoReq.systemRole;
    // Create request to increase vote counter on post

    const postvoteURL = "/posts/score";
    const payload = {
      postId: model.PostId,
      count: 1,
    };

    const postvote = await microCall("put", payload, postvoteURL, userHeaders);

    if (!postvote) {
      log.Error("[CreateVoteHandle] Cannot save vote count on post!");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.internal/postvote",
            "Cannot save vote count on post!"
          ).json()
        );
    }

    // Create notification request
    if (postResult.Result.ownerUserId == currentUser.userId) {
      // Should not send notification if the owner of the vote is same as owner of post
      return res.status(HttpStatusCode.OK).send({ objectId: newVote.objectId });
    }
    const URL = "/posts/" + postResult.Result.urlKey;
    let notificationModel = {
      ownerUserId: currentUser.userId,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      title: currentUser.displayName,
      description: currentUser.displayName + " like your post.",
      URL: URL,
      notifyRecieverUserId: postResult.Result.ownerUserId,
      targetId: model.postId,
      isSeen: false,
      type: "like",
    };

    const notificationURL = "/notifications";
    const notificationIndex = await microCall(
      "post",
      notificationModel,
      notificationURL,
      userHeaders
    );
    if (!notificationIndex) {
      log.Error("\nCannot save notification on follow user!");
    }

    return res.status(HttpStatusCode.OK).send({ objectId: newVote.objectId });
  } catch (error) {
    log.Error(`[CreatevoteHandle] - Save new post error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/savePost",
          "Error happened while save post!"
        ).json()
      );
  }
};

// getHeadersFromUserInfoReq
async function getHeadersFromUserInfoReq(info) {
  let userHeaders = {};
  userHeaders["uid"] = info.userId;
  userHeaders["email"] = info.username;
  userHeaders["avatar"] = info.avatar;
  userHeaders["banner"] = info.banner;
  userHeaders["tagLine"] = info.tagLine;
  userHeaders["displayName"] = info.displayName;
  userHeaders["socialName"] = info.socialName;
  userHeaders["role"] = info.systemRole;
  return userHeaders;
}

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
const microCall = async (method, data, url, headers = {}) => {
  try {
    const digest = GateKeeper.sign(JSON.stringify(data), process.env.HMAC_KEY);
    headers["Content-type"] = "application/json";
    headers[appConfig.HMAC_NAME] = digest;

    console.log(`\ndigest: ${digest}, header: ${appConfig.HMAC_NAME} \n`);

    const result = await axios({
      method: method,
      data,
      url: appConfig.InternalGateway + url,
      headers,
    });

    return result.data;
  } catch (error) {
    // handle axios error and throw correct error
    // https://github.com/axios/axios#handling-errors
    console.log(
      `Error while sending vote check request!: callAPIWithHMAC ${error}`
    );
    return Error(
      "Error while sending vote check request!: actionRoom/callAPIWithHMAC"
    );
  }
};

// UpdateVoteHandle handle create a new vote
exports.updateVoteHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdateVoteHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "vote.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[UpdateVoteHandle] vote text is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "vote.parseUpdateVoteHandleModel",
            "Parse UpdateVoteHandle Model Error"
          ).json()
        );
    }
    console.log(model);
    let updatedComment = {
      objectId: model.objectId,
      postId: model.postId,
      ownerUserId: currentUser.userId,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      created_date: model.createdDate,
    };
    await voteService.updateVoteById(updatedComment);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateVoteHandle] - Update vote Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/updateComment",
          "Error happened while update vote!"
        ).json()
      );
  }
};

// DeleteVoteHandle handle delete a vote
exports.deleteVoteHandle = async function (req, res) {
  // params from /votes/id/:voteId
  const voteId = req.params.voteId;
  if (!voteId) {
    log.Error("vote Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.voteIdRequired",
          "vote id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteVoteHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "vote.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await voteService.deleteVoteByOwner(currentUser.userId, voteId);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteCommentHandle] - delete vote Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/deleteVote",
          "Error happened while delete vote!"
        ).json()
      );
  }
};

// DeleteVoteByPostIdHandle handle delete a vote but postId
exports.deleteVoteByPostIdHandle = async function (req, res) {
  // params from /votes/post/:postId
  const postId = req.params.postId;
  if (!postId) {
    log.Error("post Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.postIdRequired",
          "post id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteVoteByPostIdHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "vote.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await voteService.deleteVotesByPostId(currentUser.userId, postId);

    // Create user headers for http request
    let userHeaders = {};
    userHeaders["uid"] = currentUser.userId;
    userHeaders["email"] = currentUser.username;
    userHeaders["avatar"] = currentUser.avatar;
    userHeaders["displayName"] = currentUser.displayName;
    userHeaders["role"] = currentUser.systemRole;

    const postVoteURL = "/posts/score";
    const payload = {
      postId: postId,
      count: -1,
    };
    await microCall("put", payload, postVoteURL, userHeaders);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteVoteByPostIdHandle] - delete vote Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/deleteVoteByPostId",
          "Error happened while delete vote!"
        ).json()
      );
  }
};

// GetVotesByPostIdHandle handle query on vote
exports.getVotesByPostIdHandle = async function (req, res) {
  const postId = req.query.postId;
  if (!postId) {
    log.Error("Post id can not be empty.");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.postIdRequired",
          "post id is required!"
        ).json()
      );
  }

  try {
    voteList = await voteService.getVoteByPostId(
      postId,
      "created_date",
      req.query.page
    );

    return res.status(HttpStatusCode.OK).send(voteList).json();
  } catch (error) {
    log.Error(`[GetVotesByPostIdHandle.voteService.GetVoteByPostId] ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/queryVote",
          "Error happened while query vote!"
        ).json()
      );
  }
};

// GetVoteHandle handle get a vote
exports.getVoteHandle = async function (req, res) {
  const voteId = req.params.voteId;
  if (!voteId) {
    log.Error("vote Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.voteIdRequired",
          "vote id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetVoteHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "vote.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }
    const foundVote = await voteService.findById(voteId);

    // No vote found
    if (!foundVote) {
      return res.status(HttpStatusCode.OK).send();
    }
    let voteModel = {
      objectId: foundVote.objectId,
      ownerUserId: foundVote.ownerUserId,
      postId: foundVote.postId,
      ownerDisplayName: foundVote.ownerDisplayName,
      ownerAvatar: foundVote.ownerAvatar,
      typeId: foundVote.typeId,
      created_date: foundVote.created_date,
    };
    return res.status(HttpStatusCode.OK).send(voteModel).json();
  } catch (error) {
    log.Error(`[GetVoteHandle] - Get vote Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "vote.internal/getVoteHandle",
          "Error happened while find vote!"
        ).json()
      );
  }
};
