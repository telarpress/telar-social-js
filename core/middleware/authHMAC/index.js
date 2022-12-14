const { appConfig } = require("../../config");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { validate } = require("./authHMAC");
exports.authHMAC = (req, res, next) => {
  try {
    // Check if the HMAC header contains content
    const headerName = appConfig.HMAC_NAME;
    const auth = req.get(headerName);
    if (!auth || auth.length < 1) {
      log.Error("Unauthorized! HMAC not presented!");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "authHMACMiddleware.HMACValidattionUnauthorized",
            "Unauthorized! HMAC not presented!"
          ).json()
        );
    }
    const validattion = validate(req.body, appConfig.HMAC_KEY, auth);
    if (!validattion) {
      log.Error("Can not validated HMAC");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "authHMACMiddleware.HMACValidattionTampered",
            "HMAC has been tampered"
          ).json()
        );
    }
    if (req.get("uid") === undefined) {
      log.Error(
        "[HMAC] User id is not provided. In this case user context will be set empty!"
      );
      res.locals.user = {};
      return next();
    }

    const userUUID = req.header["uid"];
    let createdDate = Math.floor(Date.now() / 1000);
    if (req.body.createdDate != "") {
      createdDate = parseInt(req.body.createdDate, 64);
    }

    res.locals.user = {
      userId: userUUID,
      username: req.header["email"],
      socialName: req.header["socialName"],
      displayName: req.header["displayName"],
      avatar: req.header["avatar"],
      banner: req.header["banner"],
      tagLine: req.header["tagLine"],
      createdDate: createdDate,
      systemRole: req.header["role"],
    };
    next();
  } catch (error) {
    log.Error(`HMAC validation ${error}`);
    // Authentication failed
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "authHMACMiddleware.AuthenticationFailed",
          "Authentication failed"
        ).json()
      );
  }
};
