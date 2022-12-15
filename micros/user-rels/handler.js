const app = require("express")();
const db = require("./database");
const relsRouter = require("./router");

// Connect to the database
db.connect();

// Use the router for the rels routes
app.use(relsRouter);

module.exports = app;
