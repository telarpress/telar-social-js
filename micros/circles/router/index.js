const express = require("express");
const circleRouter = express.Router();
const { appConfig } = require("../config");
const {
  authCookie,
} = require("../../../core/middleware/authcookie/authcookie");

const { authHMAC } = require("../../../core/middleware/authHMAC/");
const hmacCookieHandlers = (hmacWithCookie) => (req, res, next) => {
  if (req.get(appConfig.HMAC_NAME) !== undefined || !hmacWithCookie) {
    return authHMAC(req, res, next);
  }
  return authCookie(req, res, next);
};

const handlers = require("../handlers");

// Router
circleRouter.post(
  "/circles/following/:userId",
  hmacCookieHandlers(false),
  handlers.createFollowingHandle
);
circleRouter.post(
  "/circles/",
  hmacCookieHandlers(true),
  handlers.createCircleHandle
);
circleRouter.put(
  "/circles/",
  hmacCookieHandlers(true),
  handlers.updateCircleHandle
);
circleRouter.delete(
  "/circles/:circleId",
  hmacCookieHandlers(true),
  handlers.deleteCircleHandle
);

circleRouter.get(
  "/circles/my/",
  hmacCookieHandlers(true),
  handlers.getMyCircleHandle
);

circleRouter.get(
  "/circles/id/:circleId",
  hmacCookieHandlers(true),
  handlers.getCircleHandle
);

module.exports = circleRouter;
