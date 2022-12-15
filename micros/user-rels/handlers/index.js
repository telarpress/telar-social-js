const userRelService = require("../services/userRels.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { appConfig } = require("../config");
const GateKeeper = require("../utils/hmac");
const { default: axios } = require("axios");

// const { validate: uuidValidate } = require("uuid");

//FollowHandle handle create a new userRel
exports.followHandle = async function (req, res) {
  const currentUser = res.locals.user;
  if (!currentUser || currentUser == null) {
    log.Error("[FollowHandle] Can not get current user");
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "userRels.invalidCurrentUser",
          "Can not get current user"
        ).json()
      );
  }

  const model = req.body;
  if (!model) {
    log.Error("[FollowHandle] model is required");
    return res
      .status(HttpStatusCode.BadRequest)
      .send(
        new utils.ErrorHandler(
          "userRels.parseCreateCircleHandleModel",
          "Parse FollowHandle Model Error"
        ).json()
      );
  }

  try {
    // Left User Meta
    let leftUserMeta = {
      userId: currentUser.userId,
      fullName: currentUser.displayName,
      avatar: currentUser.avatar,
    };
    // Right User Meta
    let rightUserMeta = {
      userId: model.rightUser.userId,
      fullName: model.rightUser.fullName,
      avatar: model.rightUser.avatar,
    };

    let tags = { status: "follow" };
    try {
      // Store the relation
      await userRelService.followUser(
        leftUserMeta,
        rightUserMeta,
        model.circleIds,
        tags
      );
      // Create notification

      await sendFollowNotification(model, getUserInfoReq(currentUser));
    } catch (error) {
      log.Error(`[FollowHandle] - Follow Handle error  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "userRoles.internal/followHandle",
            "Error happened while Follow Handle!"
          ).json()
        );
    }
    // Increase user follow count
    await increaseUserFollowCount(
      currentUser.userId,
      1,
      getUserInfoReq(currentUser)
    );
    // Increase user follower count
    await increaseUserFollowerCount(
      model.rightUser.userId,
      1,
      getUserInfoReq(currentUser)
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[FollowHandle] - Follow Handle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/followHandle",
          "Error happened while Follow Handle!"
        ).json()
      );
  }
};

// getUserInfoReq
async function getUserInfoReq(currentUser) {
  let userInfoInReq = {
    userId: currentUser.userId,
    username: currentUser.username,
    avatar: currentUser.avatar,
    displayName: currentUser.displayName,
    systemRole: currentUser.systemRole,
  };
  return userInfoInReq;
}

async function sendFollowNotification(model, userInfoInReq) {
  // Create user headers for http request
  const userHeaders = await getHeadersFromUserInfoReq(userInfoInReq);

  const URL = "/@/" + userInfoInReq.SocialName;
  let notificationModel = {
    ownerUserId: userInfoInReq.userId,
    ownerDisplayName: userInfoInReq.displayName,
    ownerAvatar: userInfoInReq.avatar,
    title: userInfoInReq.displayName,
    description: userInfoInReq.DisplayName + " is following you.",
    URL: URL,
    notifyRecieverUserId: model.rightUser.userId,
    targetId: model.rightUser.userId,
    isSeen: false,
    type: "follow",
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
}
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

// increaseUserFollowCount Increase user follow count
async function increaseUserFollowCount(userId, inc, userInfoInReq) {
  const actionURL = `/profile/follow/inc/${inc}/${userId}`;

  // Create user headers for http request
  const userHeaders = await getHeadersFromUserInfoReq(userInfoInReq);

  const action = await microCall("put", actionURL, actionURL, userHeaders);
  if (!action) {
    log.Error(`Function call error: ${actionURL} - ${action}`);
  }
}

// increaseUserFollowerCount Increase user follower count
async function increaseUserFollowerCount(userId, inc, userInfoInReq) {
  const actionURL = `/profile/follower/inc/${inc}/${userId}`;

  // Create user headers for http request
  const userHeaders = await getHeadersFromUserInfoReq(userInfoInReq);

  const action = await microCall("put", actionURL, actionURL, userHeaders);

  if (!action) {
    log.Error(`Function call error: ${actionURL} - ${action}`);
  }
}

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
      url: appConfig.INTERNAL_GATEWAY + url,
      headers,
    });

    return result.data;
  } catch (error) {
    // handle axios error and throw correct error
    // https://github.com/axios/axios#handling-errors
    console.log(
      `Error while sending userRels check request!: callAPIWithHMAC ${error}`
    );
    return Error(
      "Error while sending userRels check request!: " + url + "/callAPIWithHMAC"
    );
  }
};

// UnfollowHandle handle delete a userRel
exports.unfollowHandle = async function (req, res) {
  // params from /user-rels/unfollow/:userId
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UnfollowHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "userRels.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const userFollowingUUID = req.params.userId;
    if (!userFollowingUUID) {
      log.Error("user Id is required!");
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "userRels.circleIdRequired",
            "user id is required!"
          ).json()
        );
    }

    await userRelService.unfollowUser(currentUser.userId, userFollowingUUID);

    // Decrease user follow count
    await increaseUserFollowCount(
      currentUser.userId,
      -1,
      getUserInfoReq(currentUser)
    );
    // Decrease user follower count
    await increaseUserFollowerCount(
      userFollowingUUID,
      -1,
      getUserInfoReq(currentUser)
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UnfollowHandle] - Update userRels Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/updateComment",
          "Error happened while update userRels!"
        ).json()
      );
  }
};

// DeleteCircle handle delete a userRel
exports.deleteCircle = async function (req, res) {
  // params from /user-rels/circle/:circleId
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteCircle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "userRels.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const circleId = req.params.circleId;
    if (!circleId) {
      log.Error("circle Id is required!");
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "userRels.circleIdRequired",
            "circle id is required!"
          ).json()
        );
    }

    await userRelService.deleteCircle(circleId);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteCircle] - Delete circle from user-rel Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/deleteCircle",
          "Error happened while removing circle!"
        ).json()
      );
  }
};

// UpdateRelCirclesHandle handle create a new userRel
exports.UpdateRelCirclesHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdateRelCirclesHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "userRels.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[UpdateRelCirclesHandle] model is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "userRels.parseCreateCircleHandleModel",
            "Parse UpdateRelCirclesHandle Model Error"
          ).json()
        );
    }

    await userRelService.updateRelCircles(
      currentUser.userId,
      model.rightId,
      model.circleIds
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateRelCirclesHandle] - Update UserRel Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/updateRelCircles",
          "Error happened while updating UserRel!"
        ).json()
      );
  }
};

// GetFollowersHandle handle get auth user followers
exports.getFollowersHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetFollowersHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "userRels.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const followers = userRelService.getFollowers(currentUser.userId);

    return res.status(HttpStatusCode.OK).send({ followers });
  } catch (error) {
    log.Error(`[GetFollowersHandle.userRelService.GetFollowers] ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/getFollowers",
          "Error happened while reading followers!"
        ).json()
      );
  }
};

// GetFollowingHandle handle get auth user following
exports.getFollowingHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetFollowingHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "userRels.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const followers = userRelService.getFollowing(currentUser.userId);

    return res.status(HttpStatusCode.OK).send({ followers });
  } catch (error) {
    log.Error(`[GetFollowingHandle.userRelService.GetFollowers] ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "userRels.internal/getFollowers",
          "Error happened while reading followers!"
        ).json()
      );
  }
};
