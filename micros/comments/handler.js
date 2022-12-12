const app = require("express")();
const db = require("./database");
const commentsRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the Posts routes
app.use(commentsRouter);

module.exports = app;
