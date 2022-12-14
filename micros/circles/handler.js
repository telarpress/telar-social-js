const app = require("express")();
const db = require("./database");
const circlesRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the circles routes
app.use(circlesRouter);

module.exports = app;
