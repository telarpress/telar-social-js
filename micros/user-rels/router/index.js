const express = require("express");
const relsRouter = express.Router();
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
relsRouter.post(
  "/user-rels/follow",
  hmacCookieHandlers(true),
  handlers.followHandle
);
relsRouter.delete(
  "/user-rels/unfollow/:userId",
  hmacCookieHandlers(true),
  handlers.unfollowHandle
);

relsRouter.delete(
  "/user-rels/circle/:circleId",
  hmacCookieHandlers(true),
  handlers.deleteCircle
);
relsRouter.put(
  "/user-rels/circles",
  hmacCookieHandlers(true),
  handlers.UpdateRelCirclesHandle
);

relsRouter.get(
  "/user-rels/followers/",
  hmacCookieHandlers(true),
  handlers.getFollowersHandle
);

relsRouter.get(
  "/user-rels/following",
  hmacCookieHandlers(true),
  handlers.getFollowingHandle
);

module.exports = relsRouter;
