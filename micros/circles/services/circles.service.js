const { appConfig } = require("../config");
const jwt = require("jsonwebtoken");
const Circle = require("../models/circle");
const { v4: uuidv4 } = require("uuid");
// const GateKeeper = require("../utils/hmac");
// const MUUID = require("uuid-mongodb");
const hmac = require("../../../core/middleware/authHMAC/authHMAC");
const numberOfItems = 10;

// saveCircle save the circle
exports.saveCircle = async function (circle) {
  if (!circle.objectId) {
    try {
      circle.objectId = uuidv4();
      if (!circle.created_date) {
        circle.created_date = Math.floor(Date.now() / 1000);
      }
      return await Circle(circle).save();
    } catch (uuidErr) {
      return uuidErr;
    }
  }
};

// UpdateCircle update the Circle
exports.updateCircleById = async function (data) {
  let filter = {
    objectId: data.objectId,
    ownerUserId: data.ownerUserId,
  };

  let updateOperator = {
    $set: data,
  };
  try {
    return await Circle.updateOne(filter, updateOperator);
  } catch (error) {
    return error;
  }
};

// DeleteCircleByOwner delete circle by ownerUserId and circleId
exports.deleteCircleByOwner = async function (ownerUserId, circleId) {
  let filter = {
    objectId: circleId,
    ownerUserId: ownerUserId,
  };

  try {
    return await Circle.deleteOne(filter);
  } catch (error) {
    return error;
  }
};

// FindByOwnerUserId find by owner user id
exports.findByOwnerUserId = async function (ownerUserId) {
  let sortMap = {};
  sortMap["created_date"] = -1;
  let filter = { ownerUserId: ownerUserId };
  try {
    return await findCircleList(filter, 0, 0, sortMap);
  } catch (error) {
    return error;
  }
};

// FindCircleList get all circles by filter
async function findCircleList(filter, limit, skip, sortMap) {
  try {
    const result = await Circle.find(filter)
      .sort(sortMap)
      .limit(limit)
      .skip(skip);

    let circleList = [];
    result.forEach((circle) => {
      circleList.push(circle);
    });
    return circleList;
  } catch (error) {
    return error;
  }
}

// FindById find by post id
exports.findById = async function (objectId) {
  let filter = {
    objectId: objectId,
  };
  try {
    return await Circle.findOne(filter);
  } catch (error) {
    return error;
  }
};
