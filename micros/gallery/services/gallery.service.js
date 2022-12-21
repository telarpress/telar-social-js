const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const Gallery = require("../models/media.js");
const { v4: uuidv4 } = require("uuid");
// const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// SaveMedia save the media
exports.saveMedia = async function (media) {
  try {
    if (!media.objectId) media.objectId = uuidv4();
    if (media.created_date == 0) {
      media.created_date = Math.floor(Date.now() / 1000);
    }
    return await Gallery(media).save();
  } catch (uuidErr) {
    throw uuidErr;
  }
};

// SaveManyMedia save the media
exports.saveManyMedia = async function (media) {
  try {
    const interfaceSlices = [];
    for (let i = 0; i < media.length; i++) {
      const d = media[i];
      if (!d.objectId) {
        d.objectId = uuidv4(); // from uuid package
      }

      if (d.createdDate === 0) {
        d.createdDate = new Date().getTime();
      }
      interfaceSlices.push(d);
    }

    await Gallery.insertMany(interfaceSlices);
  } catch (uuidErr) {
    throw uuidErr;
  }
};

// UpdateMedia update the media
exports.updateMediaById = async function (data) {
  let filter = {
    objectId: data.objectId,
    ownerUserId: data.ownerUserId,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    return await Gallery.updateOne(filter, updateOperator);
  } catch (error) {
    throw error;
  }
};

// DeleteMedia delete media by ownerUserId and mediaId
exports.deleteMediaByOwner = async function (ownerUserId, mediaId) {
  let filter = {
    objectId: mediaId,
    ownerUserId: ownerUserId,
  };
  try {
    return await Gallery.deleteMany(filter);
  } catch (error) {
    throw error;
  }
};

// DeleteMediaByDirectory delete media by ownerUserId and mediaId
exports.deleteMediaByDirectory = async function (ownerUserId, directory) {
  let filter = {
    directory: directory,
    ownerUserId: ownerUserId,
  };
  try {
    return await Gallery.deleteMany(filter);
  } catch (error) {
    throw error;
  }
};

// QueryAlbum query media by albumId
exports.queryAlbum = async function (
  ownerUserId,
  albumId,
  page,
  limit,
  sortBy
) {
  let sortMap = {};
  sortMap[sortBy] = -1;
  let skip = numberOfItems * (page - 1);
  let filter = {};
  filter["ownerUserId"] = ownerUserId;
  if (albumId) {
    filter["albumId"] = albumId;
  }
  try {
    return findMediaList(filter, limit, skip, sortMap);
  } catch (error) {
    throw error;
  }
};

// FindMediaList get all medias by filter
async function findMediaList(filter, limit, skip, sortMap) {
  try {
    const result = await Gallery.find(filter)
      .limit(limit)
      .skip(skip)
      .sort(sortMap);
    let mediaList = [];
    result.forEach((media) => {
      mediaList.push(media);
    });
    return mediaList;
  } catch (error) {
    throw error;
  }
}

// FindByDirectory find by directory
exports.findByDirectory = async function (ownerUserId, directory, limit, skip) {
  let sortMap = {};
  sortMap["created_date"] = -1;
  let filter = {
    ownerUserId: ownerUserId,
    directory: directory,
  };

  try {
    return await findMediaList(filter, limit, skip, sortMap);
  } catch (error) {
    throw error;
  }
};

// FindById find by media id
exports.findById = async function (objectId) {
  let filter = {
    objectId: objectId,
  };
  try {
    return await Gallery.findOne(filter);
  } catch (error) {
    throw error;
  }
};
