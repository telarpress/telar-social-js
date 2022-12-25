//telar:api path=/media
const app = require("express")();
const db = require("./database");
const galleryRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the gallery routes
app.use(galleryRouter);

module.exports = app;
