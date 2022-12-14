const circleService = require("../services/circles.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { appConfig } = require("../config");
const GateKeeper = require("../utils/hmac");
const { default: axios } = require("axios");

// const { validate: uuidValidate } = require("uuid");
const followingCircleName = "Following";

// CreateFollowingHandle handle create a new circle
exports.createFollowingHandle = async function (req, res) {
  // params from /circles/id/:userId
  const userId = req.params.userId;
  if (!userId) {
    log.Error("user Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.circleIdRequired",
          "circle id is required!"
        ).json()
      );
  }

  try {
    // Create a new circle
    let newCircle = {
      ownerUserId: userId,
      name: followingCircleName,
      isSystem: true,
    };

    await circleService.saveCircle(newCircle);

    return res.status(HttpStatusCode.OK).send({ objectId: newCircle.objectId });
  } catch (error) {
    log.Error(`[NewCircleService] - new circle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/newCircle",
          "Error happened while new circle!"
        ).json()
      );
  }
};

// CreateCircleHandle handle create a new circle
exports.createCircleHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[CreateCircleHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "circle.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[CreateCircleHandle] circle text is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "circle.parseCreateCircleHandleModel",
            "Parse CreateCircleHandle Model Error"
          ).json()
        );
    }

    if (model.name == followingCircleName) {
      log.Error("Can not use 'Following' as a circle name");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "circle.followingCircleNameIsReserved",
            "Can not use 'Following' as a circle name"
          ).json()
        );
    }

    let newCircle = {
      ownerUserId: currentUser.userId,
      name: model.name,
      isSystem: false,
    };

    await circleService.saveCircle(newCircle);

    return res.status(HttpStatusCode.OK).send({ objectId: newCircle.objectId });
  } catch (error) {
    log.Error(`[CreatecircleHandle] - Save Circle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/saveCircle",
          "Error happened while save circle!"
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
      `Error while sending circle check request!: callAPIWithHMAC ${error}`
    );
    return Error(
      "Error while sending circle check request!: actionRoom/callAPIWithHMAC"
    );
  }
};

// UpdateCircleHandle handle create a new circle
exports.updateCircleHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdateCircleHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "circle.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (model == "") {
      log.Error("[UpdateCircleHandle] circle name is required");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "circle.parseUpdateCircleHandleModel",
            "Parse UpdateCircleHandle Model Error"
          ).json()
        );
    }
    let updatedComment = {
      objectId: model.objectId,
      ownerUserId: currentUser.userId,
      name: model.name,
    };
    await circleService.updateCircleById(updatedComment);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateCircleHandle] - Update circle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/updateComment",
          "Error happened while update circle!"
        ).json()
      );
  }
};

// DeleteCircleHandle handle delete a circle
exports.deleteCircleHandle = async function (req, res) {
  // params from /circles/:circleId
  const circleId = req.params.circleId;
  if (!circleId) {
    log.Error("circle Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.circleIdRequired",
          "circle id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteCircleHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "circle.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await circleService.deleteCircleByOwner(currentUser.userId, circleId);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteCommentHandle] - delete circle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/deleteCircle",
          "Error happened while delete circle!"
        ).json()
      );
  }
};

// GetMyCircleHandle handle get authed user circle
exports.getMyCircleHandle = async function (req, res) {
  const currentUser = res.locals.user;
  if (!currentUser || currentUser == null) {
    log.Error("[getMyCircleHandle] Can not get current user");
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "circle.invalidCurrentUser",
          "Can not get current user"
        ).json()
      );
  }

  try {
    circleList = await circleService.findByOwnerUserId(currentUser.userId);

    return res.status(HttpStatusCode.OK).send(circleList).json();
  } catch (error) {
    log.Error(`[getMyCircleHandle] ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/queryCircle",
          "Error happened while query circle!"
        ).json()
      );
  }
};

// GetCircleHandle handle get a circle
exports.getCircleHandle = async function (req, res) {
  const circleId = req.params.circleId;
  if (!circleId) {
    log.Error("circle Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.circleIdRequired",
          "circle id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetCircleHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "circle.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }
    const foundCircle = await circleService.findById(circleId);

    // No circle found
    if (foundCircle == "") {
      return res.status(HttpStatusCode.OK).send();
    }
    let circleModel = {
      objectId: foundCircle.objectId,
      ownerUserId: foundCircle.ownerUserId,
      name: foundCircle.name,
      isSystem: foundCircle.isSystem,
      created_date: foundCircle.created_date,
    };
    return res.status(HttpStatusCode.OK).send(circleModel).json();
  } catch (error) {
    log.Error(`[GetCircleHandle] - Get circle Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "circle.internal/getCircleHandle",
          "Error happened while find circle!"
        ).json()
      );
  }
};
