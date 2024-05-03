const express = require("express");
const app = express();



app.use(express.static("public"));
app.use("/new-chat/",express.static("video-chat"));
app.use(express.json());


module.exports = app;