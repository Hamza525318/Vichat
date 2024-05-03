const fs = require("fs");
const https = require("https");
const express = require("express")
const app = require("./app");
const uuid = require("uuid");
const map = new Map();
const socket_io = require("socket.io")
const users = new Map();

const key = fs.readFileSync("cert.key");
const cert = fs.readFileSync("cert.crt");


const httpsServer = https.createServer({key,cert},app);

httpsServer.listen(8000,()=>{
    console.log("server running on port"+ 8000)
})


const io = socket_io(httpsServer,{
    cors:{
        origin: [
            "https://localhost"
        ],
        methods:["GET","POST"]
    }
})

app.post("/get-message-id",(req,res)=>{
    
    const pass = req.body.password;
    const messageId = uuid.v4();
    map.set(messageId,pass);

    res.status(200).json({
        messageId: messageId,
    })

})


//socket logic here
io.on("connection",(socket)=>{
    
    const meeting_id = socket.handshake.auth.meeting_id;
    console.log(map.get(meeting_id));
    users.set(meeting_id,{id: meeting_id,pass: map.get(meeting_id)})
})
