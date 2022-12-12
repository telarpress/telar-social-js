const commentService = require("../services/comments.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { appConfig } = require("../config");
const GateKeeper = require("../utils/hmac");
const { default: axios } = require("axios");

// const { validate: uuidValidate } = require("uuid");

// CreateCommentHandle handle create a new comment
exports.createCommentHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[CreateCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[CreateCommentHandle] Comment text is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.parseCreateCommentHandleModel",
            "Parse CreateCommentHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error("[CreateCommentHandle] Comment postId is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.postIdIsRequired",
            "Parse CreateCommentHandle Comment postId is required"
          ).json()
        );
    }

    let newComment = {
      ownerUserId: currentUser.userId,
      postId: model.postId,
      score: 0,
      text: model.text,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      deleted: false,
      deletedDate: 0,
      createdDate: Math.floor(Date.now() / 1000),
      lastUpdated: 0,
    };
    let userInfoReq = {
      userId: currentUser.userId,
      username: currentUser.email,
      avatar: currentUser.avatar,
      displayName: currentUser.displayName,
      systemRole: currentUser.role,
    };
    const saveCommentChannel = await commentService.saveComment(newComment);
    const postURL = "/posts/" + model.postId;
    const readPostChannel = {
      Result: await microCall(
        "get",
        postURL,
        await getHeadersFromUserInfoReq(userInfoReq)
      ),
    };

    const [saveCommentResult, postResult] = await Promise.all([
      saveCommentChannel,
      readPostChannel,
    ]);

    if (!saveCommentResult) {
      log.Error("[CreateCommentHandle] Save Comment Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.internal/saveComment",
            "Error happened while saving comment!"
          ).json()
        );
    }
    if (!postResult) {
      log.Error("[CreateCommentHandle] Save Comment Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.internal/postResult",
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
    // Create request to increase comment counter on post

    const postCommentURL = "/posts/comment/count";
    const payload = {
      postId: model.PostId,
      count: 1,
    };

    const postComment = await microCall(
      "get",
      payload,
      postCommentURL,
      userHeaders
    );

    if (!postComment) {
      log.Error("[CreateCommentHandle] Cannot save comment count on post!");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.internal/postComment",
            "Cannot save comment count on post!"
          ).json()
        );
    }

    // Create notification request
    if (postResult.Result.ownerUserId == currentUser.userId) {
      // Should not send notification if the owner of the comment is same as owner of post
      return res
        .status(HttpStatusCode.OK)
        .send({ objectId: newComment.objectId });
    }
    const URL = "/posts/" + postResult.Result.urlKey;
    let notificationModel = {
      ownerUserId: currentUser.UserId,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      title: currentUser.displayName,
      description: "commented on your post.",
      URL: URL,
      notifyRecieverUserId: postResult.Result.ownerUserId,
      targetId: model.postId,
      isSeen: false,
      type: "comment",
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

    return res
      .status(HttpStatusCode.OK)
      .send({ objectId: newComment.objectId });
  } catch (error) {
    log.Error(`[CreateCommentHandle] - Save new post error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/savePost",
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
      `Error while sending comment check request!: callAPIWithHMAC ${error}`
    );
    return Error(
      "Error while sending comment check request!: actionRoom/callAPIWithHMAC"
    );
  }
};

// UpdateCommentHandle handle create a new comment
exports.updateCommentHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdateCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[UpdateCommentHandle] Comment text is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "comment.parseUpdateCommentHandleModel",
            "Parse UpdateCommentHandle Model Error"
          ).json()
        );
    }

    let updatedComment = {
      objectId: model.objectId,
      ownerUserId: currentUser.UserId,
      postId: model.postId,
      score: model.score,
      text: model.text,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      deleted: model.deleted,
      deletedDate: model.deletedDate,
      createdDate: model.createdDate,
      lastUpdated: model.lastUpdated,
    };
    await commentService.updateCommentById(updatedComment);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateCommentHandle] - Update Comment Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/updateComment",
          "Error happened while update comment!"
        ).json()
      );
  }
};

// UpdateCommentProfileHandle handle create a new post
exports.updateCommentProfileHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdateCommentProfileHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await commentService.updateCommentProfile(
      currentUser.UserId,
      currentUser.displayName,
      currentUser.avatar
    );
    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateCommentHandle] - Update Comment profile Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/updateCommentProfileHandle",
          "Error happened while update comment!"
        ).json()
      );
  }
};

// DeleteCommentHandle handle delete a Comment
exports.deleteCommentHandle = async function (req, res) {
  // params from /comments/id/:commentId/post/:postId
  const commentId = req.params.commentId;
  if (!commentId) {
    log.Error("Comment Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "Comment.commentIdRequired",
          "Comment id is required!"
        ).json()
      );
  }

  const postId = req.params.postId;
  if (!postId) {
    log.Error("post Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "Comment.postIdRequired",
          "post id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await commentService.deleteCommentByOwner(currentUser.UserId, commentId);

    // Create user headers for http request
    let userHeaders = {};
    userHeaders["uid"] = currentUser.userId;
    userHeaders["email"] = currentUser.username;
    userHeaders["avatar"] = currentUser.avatar;
    userHeaders["displayName"] = currentUser.displayName;
    userHeaders["role"] = currentUser.systemRole;

    const postCommentURL = "/posts/comment/count";
    const payload = {
      postId: postId,
      count: -1,
    };
    await microCall("put", payload, postCommentURL, userHeaders);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteCommentHandle] - delete Comment Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/deleteComment",
          "Error happened while delete comment!"
        ).json()
      );
  }
};

// DeleteCommentByPostIdHandle handle delete a Comment but postId
exports.deleteCommentByPostIdHandle = async function (req, res) {
  // params from /Comments/post/:postId
  const postId = req.params.postId;
  if (!postId) {
    log.Error("post Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "Comment.postIdRequired",
          "post id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteCommentByPostIdHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await commentService.deleteCommentsByPostId(currentUser.userId, postId);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteCommentByPostIdHandle] - delete Comment Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/deleteCommentByPostId",
          "Error happened while delete comment!"
        ).json()
      );
  }
};

// GetCommentsByPostIdHandle handle query on comment
exports.getCommentsByPostIdHandle = async function (req, res) {
  const postId = req.query.postId;
  if (!postId) {
    log.Error("Post id can not be empty.");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "Comment.postIdRequired",
          "post id is required!"
        ).json()
      );
  }

  try {
    commentList = await commentService.getCommentByPostId(
      postId,
      "created_date",
      req.query.page
    );

    return res.status(HttpStatusCode.OK).send(commentList).json();
  } catch (error) {
    log.Error(
      `[GetCommentsByPostIdHandle.commentService.GetCommentByPostId] ${error}`
    );
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/queryComment",
          "Error happened while query comment!"
        ).json()
      );
  }
};

// GetCommentHandle handle get a comment
exports.getCommentHandle = async function (req, res) {
  const commentId = req.params.commentId;
  if (!commentId) {
    log.Error("comment Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "Comment.commentIdRequired",
          "comment id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "comment.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }
    const foundComment = await commentService.findById(commentId);

    // No comment found
    if (!foundComment) {
      return res.status(HttpStatusCode.OK).send();
    }
    let commentModel = {
      objectId: foundComment.objectId,
      ownerUserId: foundComment.ownerUserId,
      postId: foundComment.postId,
      score: foundComment.score,
      text: foundComment.text,
      ownerDisplayName: foundComment.ownerDisplayName,
      ownerAvatar: foundComment.ownerAvatar,
      deleted: foundComment.deleted,
      deletedDate: foundComment.deletedDate,
      createdDate: foundComment.createdDate,
      lastUpdated: foundComment.lastUpdated,
    };
    return res.status(HttpStatusCode.OK).send(commentModel).json();
  } catch (error) {
    log.Error(`[GetCommentHandle] - Get Comment Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comment.internal/getCommentHandle",
          "Error happened while find comment!"
        ).json()
      );
  }
};
