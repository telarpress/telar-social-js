const express = require("express");
const voteRouter = express.Router();
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

voteRouter.post("/votes/", hmacCookieHandlers(true), handlers.createVoteHandle);
voteRouter.put("/votes/", hmacCookieHandlers(true), handlers.updateVoteHandle);
voteRouter.delete(
  "/votes/id/:voteId",
  hmacCookieHandlers(true),
  handlers.deleteVoteHandle
);
voteRouter.delete(
  "/votes/post/:postId",
  hmacCookieHandlers(true),
  handlers.deleteVoteByPostIdHandle
);
voteRouter.get(
  "/votes/",
  hmacCookieHandlers(true),
  handlers.getVotesByPostIdHandle
);
voteRouter.get(
  "/votes/:voteId",
  hmacCookieHandlers(true),
  handlers.getVoteHandle
);

module.exports = voteRouter;
