const app = require("express")();
const db = require("./database");
const votesRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the Votes routes
app.use(votesRouter);

module.exports = app;
