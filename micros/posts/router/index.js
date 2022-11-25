const express = require("express");
const postsRouter = express.Router();
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
postsRouter.post(
  "/posts/",
  hmacCookieHandlers(true),
  handlers.createPostHandle
);
postsRouter.post(
  "/posts/index",
  hmacCookieHandlers(false),
  handlers.initPostIndexHandle
);
postsRouter.put("/posts/", hmacCookieHandlers(true), handlers.updatePostHandle);
postsRouter.put(
  "/posts/profile",
  hmacCookieHandlers(true),
  handlers.updatePostProfileHandle
);
postsRouter.put(
  "/posts/score",
  hmacCookieHandlers(false),
  handlers.incrementScoreHandle
);
postsRouter.put(
  "/posts/comment/count",
  hmacCookieHandlers(false),
  handlers.incrementCommentHandle
);
postsRouter.put(
  "/posts/comment/disable",
  hmacCookieHandlers(true),
  handlers.disableCommentHandle
);
postsRouter.put(
  "/posts/share/disable",
  hmacCookieHandlers(true),
  handlers.disableSharingHandle
);
postsRouter.put(
  "/posts/urlkey/:postId",
  hmacCookieHandlers(true),
  handlers.generatePostURLKeyHandle
);
postsRouter.delete(
  "/posts/:postId",
  hmacCookieHandlers(true),
  handlers.deletePostHandle
);
postsRouter.get("/posts/", hmacCookieHandlers(true), handlers.queryPostHandle);
postsRouter.get(
  "/posts/:postId",
  hmacCookieHandlers(true),
  handlers.getPostHandle
);
postsRouter.get(
  "/posts/urlkey/:urlkey",
  hmacCookieHandlers(true),
  handlers.getPostByURLKeyHandle
);

module.exports = postsRouter;
