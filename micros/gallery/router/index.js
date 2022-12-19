const express = require("express");
const galleryRouter = express.Router();
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
galleryRouter.post(
  "/gallery/",
  hmacCookieHandlers(true),
  handlers.createMediaHandle
);

galleryRouter.post(
  "/gallery/list",
  hmacCookieHandlers(true),
  handlers.createMediaListHandle
);

galleryRouter.put(
  "/gallery/unfollow/:userId",
  hmacCookieHandlers(true),
  handlers.UpdateMediaHandle
);

galleryRouter.delete(
  "/gallery/id/:mediaId",
  hmacCookieHandlers(true),
  handlers.deleteMediaHandle
);
galleryRouter.delete(
  "/gallery/dir/:dir",
  hmacCookieHandlers(true),
  handlers.deleteDirectoryHandle
);

galleryRouter.get(
  "/gallery/",
  hmacCookieHandlers(true),
  handlers.queryAlbumHandle
);

galleryRouter.get(
  "/gallery/id/:mediaId",
  hmacCookieHandlers(true),
  handlers.getMediaHandle
);

galleryRouter.get(
  "/gallery/dir/:dir",
  hmacCookieHandlers(true),
  handlers.getMediaByDirectoryHandle
);

module.exports = galleryRouter;
