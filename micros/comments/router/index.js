const express = require("express");
const commentRouter = express.Router();
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

commentRouter.post(
  "/comments/",
  hmacCookieHandlers(true),
  handlers.createCommentHandle
);
commentRouter.put(
  "/comments/",
  hmacCookieHandlers(true),
  handlers.updateCommentHandle
);
commentRouter.put(
  "/comments/profile",
  hmacCookieHandlers(true),
  handlers.updateCommentProfileHandle
);
commentRouter.delete(
  "/comments/id/:commentId/post/:postId",
  hmacCookieHandlers(true),
  handlers.deleteCommentHandle
);
commentRouter.delete(
  "/comments/post/:postId",
  hmacCookieHandlers(true),
  handlers.deleteCommentByPostIdHandle
);
commentRouter.get(
  "/comments/",
  hmacCookieHandlers(true),
  handlers.getCommentsByPostIdHandle
);
commentRouter.get(
  "/comments/:commentId",
  hmacCookieHandlers(true),
  handlers.getCommentHandle
);

module.exports = commentRouter;
