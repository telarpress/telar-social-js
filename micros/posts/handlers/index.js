const postService = require("../services/post.service.js");
const utils = require("../../../core/utils/error-handler");
const { HttpStatusCode } = require("../../../core/utils/HttpStatusCode");
const log = require("../../../core/utils/errorLogger");
const { appConfig } = require("../config");
// const { validate: uuidValidate } = require("uuid");

const contentMaxLength = 20;

const charset =
  "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function stringRand(length) {
  let result = "";
  const charactersLength = charset.length;
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// CreatePostHandle handle create a new post
exports.createPostHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[CreatePostHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[CreatePostHandle] Parse CreatePostHandle Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parseCreatePostHandleModel",
            "Parse CreatePostHandle Model Error"
          ).json()
        );
    }
    let newAlbum;
    if (model?.album?.photos && model?.album?.photos?.length > 0) {
      newAlbum = {
        count: model.album.count,
        cover: model.album.cover,
        coverId: model.album.coverId,
        photos: model.album.photos,
        title: model.album.title,
      };
    }
    let newPost = {
      objectId: model.objectId,
      postTypeId: model.postTypeId,
      ownerUserId: currentUser.userId,
      score: model.score,
      votes: model.votes,
      viewCount: model.viewCount,
      body: model.body,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      urlKey: await generatPostURLKey(
        currentUser.socialName,
        model.body,
        model.objectId
      ),
      tags: model.tags,
      commentCounter: model.commentCounter,
      image: model.image,
      imageFullPath: model.imageFullPath,
      video: model.video,
      thumbnail: model.thumbnail,
      album: newAlbum,
      disableComments: model.disableComments,
      disableSharing: model.disableSharing,
      deleted: model.deleted,
      deletedDate: model.deletedDate,
      created_date: model.createdDate,
      last_updated: model.lastUpdated,
      accessUserList: model.accessUserList,
      permission: model.permission,
      version: model.version,
    };

    await postService.savePost(newPost);

    return res.status(HttpStatusCode.OK).send({ objectId: newPost.objectId });
  } catch (error) {
    log.Error(`[CreatePostHandle] - Save new post error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/savePost",
          "Error happened while save post!"
        ).json()
      );
  }
};

// generatPostURLKey
async function generatPostURLKey(socialName, body, postId) {
  let content = body.replaceAll(" ", "-");
  if (contentMaxLength <= content.length) {
    content = content[contentMaxLength];
  }

  return await `${socialName}_${content}-post-${
    postId.split("-")[0]
  }-${stringRand(5)}`.toLowerCase();
}

// InitPostIndexHandle handle create a new post
exports.initPostIndexHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[InitPostIndexHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const postIndexMap = [];
    postIndexMap["body"] = "text";
    postIndexMap["objectId"] = 1;
    await postService.createPostIndex(postIndexMap);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[InitPostIndexHandle] - Create post index Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.createPostIndex",
          "Error happened while creating post index!"
        ).json()
      );
  }
};

// UpdatePostHandle handle create a new post
exports.updatePostHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[UpdatePostHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const model = req.body;
    if (!model) {
      log.Error("[UpdatePostHandle] Parse UpdatePostHandle Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parseUpdatePostHandleModel",
            "Parse UpdatePostHandle Model Error"
          ).json()
        );
    }
    let updatedAlbum = {
      count: model.album.count,
      cover: model.album.cover,
      coverId: model.album.coverId,
      photos: model.album.photos,
      title: model.album.title,
    };

    updatedPost = {
      objectId: model.objectId,
      postTypeId: model.postTypeId,
      ownerUserId: currentUser.userId,
      score: model.score,
      votes: model.votes,
      viewCount: model.viewCount,
      body: model.body,
      ownerDisplayName: currentUser.displayName,
      ownerAvatar: currentUser.avatar,
      tags: model.tags,
      commentCounter: model.commentCounter,
      image: model.image,
      imageFullPath: model.imageFullPath,
      video: model.video,
      thumbnail: model.thumbnail,
      album: updatedAlbum,
      disableComments: model.disableComments,
      disableSharing: model.disableSharing,
      lastUpdated: Math.floor(Date.now() / 1000),
      accessUserList: model.accessUserList,
      permission: model.permission,
      version: model.version,
    };

    await postService.UpdatePostById(updatedPost);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdatePostHandle] - Save new post error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/updatePost",
          "Error happened while updating post!"
        ).json()
      );
  }
};

// Deprecated: UpdatePostProfileHandle
exports.updatePostProfileHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[StatusBadRequest] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    await postService.updatePostProfile(
      currentUser.userId,
      currentUser.displayName,
      currentUser.avatar
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[UpdatePostProfile] - Update Post Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/updatePostProfile",
          "Error happened while updating post!"
        ).json()
      );
  }
};

// IncrementScoreHandle handle create a new post
exports.incrementScoreHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[incrementScoreHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.body;
    if (!model) {
      log.Error("[incrementScoreHandle] Parse ScoreModel Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parseincrementScoreHandleModel",
            "Parse incrementScoreHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[incrementScoreHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }
    if (!model.count) {
      log.Error(`[incrementScoreHandle] - Count can not be zero!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/countIsZero",
            "Count can not be zero!"
          ).json()
        );
    }

    if (model.count > 0) {
      await postService.incrementScoreCount(
        model.postId,
        currentUser.userId,
        currentUser.avatar
      );
    } else if (model.count < 0) {
      await postService.decrementScoreCount(model.postId, currentUser.userId);
    }

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[incrementScoreHandle] - increment Score Post Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/incrementScoreHandle",
          "Error happened while increment Score post!"
        ).json()
      );
  }
};

// IncrementCommentHandle handle create a new post
exports.incrementCommentHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[incrementCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.body;
    if (!model) {
      log.Error("[incrementCommentHandle] Parse increment Comment Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parseincrementCommentHandleModel",
            "Parse incrementCommentHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[incrementCommentHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }
    if (!model.count) {
      log.Error(`[incrementCommentHandle] - Count can not be zero!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/countIsZero",
            "Count can not be zero!"
          ).json()
        );
    }
    if (model.count > 0) {
      await postService.incrementCommentCount(model.postId);
    } else if (model.count < 0) {
      await postService.decerementCommentCount(model.postId);
    }

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(
      `[incrementCommentHandle] - increment Comment Post Error  ${error}`
    );
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/incrementCommentHandle",
          "Error happened while increment Comment post!"
        ).json()
      );
  }
};

// DisableCommentHandle disble post's commnet
exports.disableCommentHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[disableCommentHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.body;
    if (!model) {
      log.Error("[disableCommentHandle] Parse disable Comment Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsedisableCommentHandleModel",
            "Parse disableCommentHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[disableCommentHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }

    if (!model.status) {
      log.Error(`[disableCommentHandle] - Status is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/StatusRequired",
            "Status is required!"
          ).json()
        );
    }

    await postService.disableCommnet(
      currentUser.userId,
      model.postId,
      model.status
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DisableCommnet] - disable Comment Post Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/disableCommentHandle",
          "Error happened while disable Comment post!"
        ).json()
      );
  }
};

// DisableSharingHandle disble post's sharing
exports.disableSharingHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[disableSharingHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.body;
    if (!model) {
      log.Error("[disableSharingHandle] Parse disable sharing Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsedisableSharingHandleModel",
            "Parse disableSharingHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[disableSharingHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }

    await postService.disableSharing(
      currentUser.userId,
      model.postId,
      model.status
    );

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[DisableSharing] - disable sharing Post Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/disableSharingHandle",
          "Error happened while disable sharing post!"
        ).json()
      );
  }
};

// GeneratePostURLKeyHandle handle get post URL key
exports.generatePostURLKeyHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[generatePostURLKeyHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.params;
    if (!model) {
      log.Error(
        "[generatePostURLKeyHandle] Parse generate Post URLKey Model Error"
      );
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsegeneratePostURLKeyHandleModel",
            "Parse generatePostURLKeyHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[generatePostURLKeyHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }
    // TODO: Implementation uuid.FromString
    // const postUUID = uuid.FromString(postId);
    const postUUID = model.postId;
    if (!postUUID) {
      log.Error(`[generatePostURLKeyHandle] - UUID Error ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdIsNotValid",
            "Post id is not valid!"
          ).json()
        );
    }

    const foundPost = await postService.findById(postUUID);
    if (!foundPost) {
      log.Error(`[generatePostURLKeyHandle.postService.FindById] ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/queryPost",
            "Error happened while query post!"
          ).json()
        );
    }
    if (foundPost.urlKey == "") {
      const postOwnerProfile = postService.getUserProfileByID(
        foundPost.ownerUserId
      );

      if (!postOwnerProfile) {
        log.Error(
          `[generatePostURLKeyHandle.postService.getUserProfileByID] ${error}`
        );
        return res
          .status(HttpStatusCode.InternalServerError)
          .send(
            new utils.ErrorHandler(
              "post.internal/queryOwnerProfilePost",
              "Error happened while query owner profile post!"
            ).json()
          );
      }

      const urlKey = generatPostURLKey(
        postOwnerProfile.socialName,
        foundPost.body,
        foundPost.objectId.String()
      );
      const updatePostURLKey = await postService.updatePostURLKey(
        foundPost.objectId,
        urlKey
      );
      if (!updatePostURLKey) {
        log.Error(
          `[generatePostURLKeyHandle.postService.UpdatePostURLKey] ${error}`
        );
        return res
          .status(HttpStatusCode.InternalServerError)
          .send(
            new utils.ErrorHandler(
              "post.internal/updatePost",
              "Error happened while updating post!"
            ).json()
          );
      }
      return res.status(HttpStatusCode.OK).send({ urlKey: urlKey }).json();
    }

    return res
      .status(HttpStatusCode.OK)
      .send({ urlKey: foundPost.urlKey })
      .json();
  } catch (error) {
    log.Error(
      `[generatePostURLKeyHandle] - generate Post URLKey Post Error  ${error}`
    );
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/generatePostURLKeyHandle",
          "Error happened while generate Post URLKey post!"
        ).json()
      );
  }
};

// DeletePostHandle handle delete a post
exports.deletePostHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[deletePostHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.params;
    if (!model) {
      log.Error("[deletePostHandle] Parse disable sharing Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsedeletePostHandleModel",
            "Parse deletePostHandle Model Error"
          ).json()
        );
    }

    // params from /posts/:postId
    if (!model.postId) {
      log.Error(`[deletePostHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }

    // TODO: Implementation uuid.FromString
    // const postUUID = uuid.FromString(postId);
    const postUUID = model.postId;
    if (!postUUID) {
      log.Error(`[deletePostHandle] - UUID Error ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdIsNotValid",
            "Post id is not valid!"
          ).json()
        );
    }

    await postService.deletePostByOwner(currentUser.userId, postUUID);

    return res.status(HttpStatusCode.OK).send();
  } catch (error) {
    log.Error(`[deletePostHandle] - delete Post Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/deletePostHandle",
          "Error happened while deleting post!"
        ).json()
      );
  }
};

// QueryPostHandle handle query on post
exports.queryPostHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[queryPostHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    const query = req.query;
    const postList = await postService.queryPostIncludeUser(
      query.search,
      query.owner,
      query.type,
      "created_date",
      query.page
    );

    return res.status(HttpStatusCode.OK).send(postList).json();
  } catch (error) {
    log.Error(`[queryPostHandle] - query post Error ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/queryPostHandle",
          "Error happened while query post!"
        ).json()
      );
  }
};

// GetPostHandle handle get a post
exports.getPostHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[getPostHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.params;
    if (!model) {
      log.Error("[getPostHandle] Parse Get Post Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsegetPostHandleModel",
            "Parse getPostHandle Model Error"
          ).json()
        );
    }

    if (!model.postId) {
      log.Error(`[getPostHandle] - Post Id is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "Post Id is required!"
          ).json()
        );
    }
    // TODO: Implementation uuid.FromString
    // const postUUID = uuid.FromString(postId);
    const postUUID = model.postId;
    if (!postUUID) {
      log.Error(`[getPostHandle] - UUID Error ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdIsNotValid",
            "Post id is not valid!"
          ).json()
        );
    }

    const foundPost = await postService.findById(postUUID);

    if (!foundPost) {
      log.Error(`[getPostHandle.postService.FindById] ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/getPostHandle",
            "Error happened while Get post!"
          ).json()
        );
    }

    const postModel = {
      objectId: foundPost.objectId,
      postTypeId: foundPost.postTypeId,
      ownerUserId: foundPost.ownerUserId,
      score: foundPost.score,
      votes: foundPost.votes,
      viewCount: foundPost.viewCount,
      body: foundPost.body,
      ownerDisplayName: foundPost.ownerDisplayName,
      ownerAvatar: foundPost.ownerAvatar,
      urlKey: foundPost.urkKey,
      album: { Photos: [] },
      tags: foundPost.tags,
      commentCounter: foundPost.commentCounter,
      image: foundPost.image,
      imageFullPath: foundPost.imageFullPath,
      video: foundPost.video,
      thumbnail: foundPost.thumbnail,
      disableComments: foundPost.disableComments,
      disableSharing: foundPost.disableSharing,
      deleted: foundPost.deleted,
      deletedDate: foundPost.deletedDate,
      createdDate: foundPost.createdDate,
      lastUpdated: foundPost.lastUpdated,
      accessUserList: foundPost.accessUserList,
      permission: foundPost.permission,
      version: foundPost.version,
    };

    if (foundPost.album && (foundPost?.album?.photos || []).length > 0) {
      postModel.album = {
        count: foundPost.album.count,
        cover: foundPost.album.cover,
        coverId: foundPost.album.coverId,
        photos: foundPost.album.photos,
        title: foundPost.album.title,
      };
    }

    return res.status(HttpStatusCode.OK).send({ postModel }).json();
  } catch (error) {
    log.Error(`[GetPostHandle] - Get Post Post Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/getPostHandle",
          "Error happened while Get Post post!"
        ).json()
      );
  }
};

// GetPostByURLKeyHandle handle get a post
exports.getPostByURLKeyHandle = async function (req, res) {
  try {
    const currentUser = res.locals.user;
    if (!currentUser || currentUser == null) {
      log.Error("[getPostByURLKeyHandle] Can not get current user");
      return res
        .status(HttpStatusCode.Unauthorized)
        .send(
          new utils.ErrorHandler(
            "post.invalidCurrentUser",
            "Can not get current user"
          ).json()
        );
    }

    // Create the model object
    const model = req.params;
    if (!model) {
      log.Error("[getPostByURLKeyHandle] Parse Get Post Model Error");
      return res
        .status(HttpStatusCode.BadRequest)
        .send(
          new utils.ErrorHandler(
            "post.parsegetPostByURLKeyHandleModel",
            "Parse getPostByURLKeyHandle Model Error"
          ).json()
        );
    }

    if (!model.urlkey) {
      log.Error(`[getPostByURLKeyHandle] -URL Key is required!  ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdRequired",
            "URL Key is required!"
          ).json()
        );
    }
    // TODO: Implementation uuid.FromString
    // const postUUID = uuid.FromString(postId);
    const urlkey = model.urlkey;
    if (!urlkey) {
      log.Error(`[getPostByURLKeyHandle] - UUID Error ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/postIdIsNotValid",
            "Post id is not valid!"
          ).json()
        );
    }

    const foundPost = await postService.findByURLKey(urlkey);

    if (!foundPost) {
      log.Error(`[getPostByURLKeyHandle.postService.FindByURLKey] ${error}`);
      return res
        .status(HttpStatusCode.InternalServerError)
        .send(
          new utils.ErrorHandler(
            "post.internal/getPostByURLKeyHandle",
            "Error happened while Get Post By URL post!"
          ).json()
        );
    }

    const postModel = {
      objectId: foundPost.objectId,
      postTypeId: foundPost.postTypeId,
      ownerUserId: foundPost.ownerUserId,
      score: foundPost.score,
      votes: foundPost.votes,
      viewCount: foundPost.viewCount,
      body: foundPost.body,
      ownerDisplayName: foundPost.ownerDisplayName,
      ownerAvatar: foundPost.ownerAvatar,
      urlKey: foundPost.urkKey,
      album: { Photos: [] },
      tags: foundPost.tags,
      commentCounter: foundPost.commentCounter,
      image: foundPost.image,
      imageFullPath: foundPost.imageFullPath,
      video: foundPost.video,
      thumbnail: foundPost.thumbnail,
      disableComments: foundPost.disableComments,
      disableSharing: foundPost.disableSharing,
      deleted: foundPost.deleted,
      deletedDate: foundPost.deletedDate,
      createdDate: foundPost.createdDate,
      lastUpdated: foundPost.lastUpdated,
      accessUserList: foundPost.accessUserList,
      permission: foundPost.permission,
      version: foundPost.version,
    };
    log.Error(`postModel ${postModel}`);
    if (foundPost.album && (foundPost?.album?.photos || []).length > 0) {
      postModel.album = {
        count: foundPost.album.count,
        cover: foundPost.album.cover,
        coverId: foundPost.album.coverId,
        photos: foundPost.album.photos,
        title: foundPost.album.title,
      };
    }

    return res.status(HttpStatusCode.OK).send({ postModel }).json();
  } catch (error) {
    log.Error(`[GetPostByURLKeyHandle] - Get Post By URL Key Error  ${error}`);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send(
        new utils.ErrorHandler(
          "post.internal/getPostByURLKeyHandle",
          "Error happened while Get Post By URL Key!"
        ).json()
      );
  }
};
