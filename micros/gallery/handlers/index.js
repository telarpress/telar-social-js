const mediaService = require("../services/gallery.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { default: axios } = require("axios");
const { appConfig } = require("../config");
const GateKeeper = require("../utils/hmac");

// const { validate: uuidValidate } = require("uuid");

// CreateMediaHandle handle create a new media
exports.createMediaHandle = async function (req, res) {
  const currentUser = res.locals.user;
  if (!currentUser || currentUser == null) {
    log.Error("[CreateMediaHandle] Can not get current user");
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "gallery.invalidCurrentUser",
          "Can not get current user"
        ).json()
      );
  }

  const model = req.body;
  if (!model) {
    log.Error("[CreateMediaHandle] model is required");
    return res
      .status(HttpStatusCode.BadRequest)
      .send(
        new utils.ErrorHandler(
          "gallery.parseCreateCircleHandleModel",
          "Parse CreateMediaHandle Model Error"
        ).json()
      );
  }

  let newMedia = {
    objectId: model.objectId,
    deletedDate: 0,
    createdDate: Math.floor(Date.now() / 1000),
    thumbnail: model.thumbnail,
    url: model.URL,
    fullPath: model.fullPath,
    caption: model.caption,
    fileName: model.fileName,
    directory: model.directory,
    ownerUserId: currentUser.userId,
    lastUpdated: 0,
    albumId: model.albumId,
    width: model.width,
    height: model.height,
    meta: model.meta,
    accessUserList: model.accessUserList,
    permission: model.permission,
    deleted: false,
  };

  try {
    await mediaService.saveMedia(newMedia);
    return res.status(HttpStatusCode.OK).send({ objectId: newMedia.objectId });
  } catch (error) {
    log.Error(`[CreateMediaHandle] - Save Media Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.internal/saveMedia",
          "Error happened while saving media!"
        ).json()
      );
  }
};

// CreateMediaListHandle handle create a new media
exports.createMediaListHandle = async function (req, res) {
  const currentUser = res.locals.user;
  if (!currentUser || currentUser == null) {
    log.Error("[CreateMediaListHandle] Can not get current user");
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "gallery.invalidCurrentUser",
          "Can not get current user"
        ).json()
      );
  }

  const model = req.body;
  if (!model) {
    log.Error("[CreateMediaListHandle] model is required");
    return res
      .status(HttpStatusCode.BadRequest)
      .send(
        new utils.ErrorHandler(
          "gallery.parseCreateCircleHandleModel",
          "Parse CreateMediaListHandle Model Error"
        ).json()
      );
  }

  let mediaList = [];

  model.forEach((media) => {
    let newMedia = {
      objectId: media.objectId,
      deletedDate: 0,
      createdDate: Math.floor(Date.now() / 1000),
      thumbnail: media.thumbnail,
      url: media.URL,
      fullPath: media.fullPath,
      caption: media.caption,
      fileName: media.fileName,
      directory: media.directory,
      ownerUserId: currentUser.userId,
      lastUpdated: 0,
      albumId: media.albumId,
      width: media.width,
      height: media.height,
      meta: media.meta,
      accessUserList: media.accessUserList,
      permission: media.permission,
      deleted: false,
    };

    mediaList.push(newMedia);
  });

  try {
    await mediaService.saveManyMedia(mediaList);
    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[CreateMediaListHandle] - Save Media Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.internal/SaveManyMedia",
          "Error happened while saving media!"
        ).json()
      );
  }
};

// UpdateMediaHandle handle create a new media
exports.UpdateMediaHandle = async function (req, res) {
  const currentUser = res.locals.user;
  if (!currentUser || currentUser == null) {
    log.Error("[UpdateMediaHandle] Can not get current user");
    return res
      .status(HttpStatusCode.Unauthorized)
      .send(
        new utils.ErrorHandler(
          "gallery.invalidCurrentUser",
          "Can not get current user"
        ).json()
      );
  }

  const model = req.body;
  if (!model) {
    log.Error("[UpdateMediaHandle] model is required");
    return res
      .status(HttpStatusCode.BadRequest)
      .send(
        new utils.ErrorHandler(
          "gallery.parseCreateCircleHandleModel",
          "Parse UpdateMediaHandle Model Error"
        ).json()
      );
  }

  let updatedMedia = {
    objectId: model.objectId,
    deletedDate: 0,
    createdDate: Math.floor(Date.now() / 1000),
    thumbnail: model.thumbnail,
    url: model.URL,
    fullPath: model.fullPath,
    caption: model.caption,
    fileName: model.fileName,
    directory: model.directory,
    ownerUserId: currentUser.userId,
    lastUpdated: 0,
    albumId: model.albumId,
    width: model.width,
    height: model.height,
    meta: model.meta,
    accessUserList: model.accessUserList,
    permission: model.permission,
    deleted: false,
  };
  try {
    await mediaService.updateMediaById(updatedMedia);
    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdateMediaHandle] - Update Media Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.internal/updateMedia",
          "Error happened while update media!"
        ).json()
      );
  }
};

// DeleteMediaHandle handle delete a media
exports.deleteMediaHandle = async function (req, res) {
  // params from /medias/id/:mediaId
  const mediaId = req.params.mediaId;
  if (!mediaId) {
    log.Error("media Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.mediaIdRequired",
          "media id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteMediaHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "gallery.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await mediaService.deleteMediaByOwner(currentUser.userId, mediaId);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteMediaHandle] - delete media Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comgalleryment.internal/deleteMedia",
          "Error happened while delete media!"
        ).json()
      );
  }
};

// DeleteDirectoryHandle handle delete a media
exports.deleteDirectoryHandle = async function (req, res) {
  // params from /medias/dir/:dir
  const dir = req.params.dir;
  if (!dir) {
    log.Error("Directory name is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.directoryNameIsRequired",
          "Directory name is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[DeleteDirectoryHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "gallery.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await mediaService.deleteMediaByDirectory(currentUser.userId, dir);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DeleteDirectoryHandle] - delete media Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comgalleryment.internal/deleteMedia",
          "Error happened while delete media!"
        ).json()
      );
  }
};

// GetMediaHandle handle get a media
exports.getMediaHandle = async function (req, res) {
  // params from /medias/id/:mediaId
  const mediaId = req.params.mediaId;
  if (!mediaId) {
    log.Error("Media Id is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.mediaIdRequired",
          "Media Id is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetMediaHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "gallery.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const foundMedia = await mediaService.findById(mediaId);

    let mediaModel = {
      objectId: foundMedia.objectId,
      deletedDate: foundMedia.deletedDate,
      createdDate: foundMedia.createdDate,
      thumbnail: foundMedia.thumbnail,
      url: foundMedia.url,
      fullPath: foundMedia.fullPath,
      caption: foundMedia.caption,
      fileName: foundMedia.fileName,
      directory: foundMedia.directory,
      ownerUserId: foundMedia.ownerUserId,
      lastUpdated: foundMedia.lastUpdated,
      albumId: foundMedia.albumId,
      width: foundMedia.width,
      height: foundMedia.height,
      meta: foundMedia.meta,
      accessUserList: foundMedia.accessUserList,
      permission: foundMedia.permission,
      deleted: foundMedia.deleted,
    };

    return res.status(HttpStatusCode.OK).send(mediaModel);
  } catch (error) {
    log.Error(`[GetMediaHandle] - query media Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.internal/queryMedia",
          "Error happened while query media!"
        ).json()
      );
  }
};

// QueryAlbumHandle handle query on media
exports.queryAlbumHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[QueryAlbumHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "gallery.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const query = req.query;
    if (!query) {
      log.Error("[QueryAlbumHandle] Error happened while parsing query!");
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "gallery.queryParser",
            "Error happened while parsing query!"
          ).json()
        );
    }

    mediaList = await mediaService.queryAlbum(
      currentUser.userId,
      query.album,
      query.page,
      query.limit,
      "created_date"
    );

    return res.status(HttpStatusCode.OK).send(mediaList).json();
  } catch (error) {
    log.Error(`[QueryAlbumHandle.mediaService.QueryAlbum] ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.internal/queryMedia",
          "Error happened while query media!"
        ).json()
      );
  }
};

// GetMediaByDirectoryHandle handle get media list by directory
exports.getMediaByDirectoryHandle = async function (req, res) {
  // params from /medias/dir/:dir
  const dirName = req.params.dir;
  if (!dirName) {
    log.Error("Directory name is required!");
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "gallery.directoryNameIsRequired",
          "Directory name is required!"
        ).json()
      );
  }

  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[GetMediaByDirectoryHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "gallery.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const foundMediaList = await mediaService.findByDirectory(
      currentUser.userId,
      dirName,
      0,
      0
    );

    return res.status(HttpStatusCode.OK).send(foundMediaList);
  } catch (error) {
    log.Error(`[GetMediaByDirectoryHandle] - delete media Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "comgalleryment.internal/deleteMedia",
          "Error happened while delete media!"
        ).json()
      );
  }
};
