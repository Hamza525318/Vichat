const express = require("express");
const app = express();



app.use(express.static("public"));
app.use("/new-chat",express.static("video-chat",{
    setHeaders: (res,path,stat)=>{
        if(path.endsWith(".js")){
            res.setHeader('Content-Type','application/javascript')
        }
    }
}));
app.use("/join-chat",express.static("joinee-video-chat",{
    setHeaders: (res,path,stat)=>{
        if(path.endsWith(".js")){
            res.setHeader('Content-Type','application/javascript')
        }
    }
}));
app.use(express.json());


module.exports = app;