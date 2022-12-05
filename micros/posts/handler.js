const app = require("express")();
const db = require("./database");
const postsRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the Posts routes
app.use(postsRouter);

module.exports = app;
