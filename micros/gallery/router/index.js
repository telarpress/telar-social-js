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
  "/media/",
  hmacCookieHandlers(true),
  handlers.createMediaHandle
);

galleryRouter.post(
  "/media/list",
  hmacCookieHandlers(true),
  handlers.createMediaListHandle
);

galleryRouter.put(
  "/media/",
  hmacCookieHandlers(true),
  handlers.UpdateMediaHandle
);

galleryRouter.delete(
  "/media/id/:mediaId",
  hmacCookieHandlers(true),
  handlers.deleteMediaHandle
);
galleryRouter.delete(
  "/media/dir/:dir",
  hmacCookieHandlers(true),
  handlers.deleteDirectoryHandle
);

galleryRouter.get(
  "/media/",
  hmacCookieHandlers(true),
  handlers.queryAlbumHandle
);

galleryRouter.get(
  "/media/id/:mediaId",
  hmacCookieHandlers(true),
  handlers.getMediaHandle
);

galleryRouter.get(
  "/media/dir/:dir",
  hmacCookieHandlers(true),
  handlers.getMediaByDirectoryHandle
);

module.exports = galleryRouter;
