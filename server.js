const fs = require("fs");
const https = require("https");
const express = require("express")
const app = require("./app");
const uuid = require("uuid");
const map = new Map();
const socket_io = require("socket.io")
const users = new Map();

const offers = [
    //offererUsername -> meeting_id
    //offer
    //offererIceCandidates6
    //answer
    //answerIceCandidates
]

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
    console.log(map);
    res.status(200).json({
        messageId: messageId,
    })

})

app.post("/verify-join-meeting",(req,res)=>{
    const meeting_id = req.body.meeting_id;
    const password = req.body.password;
    // console.log(map);
    if(!map.has(meeting_id)){
        res.status(404).json({
            message: "Meeting not found"
        })
    }

    else if(password != map.get(meeting_id)){
        res.status(404).json({
            message: "Wrong password entered"
        })
    }
})



//socket logic here
io.on("connection",(socket)=>{
    
    const meeting_id = socket.handshake.auth.meeting_id;
    const username = socket.handshake.auth.username;

    users.set(socket.id,{id: meeting_id,pass: map.get(meeting_id)},username);

    socket.on("new-offer",(offer)=>{
        offers.push({
            offererMeetingID: meeting_id,
            offer: offer,
            offererIceCandidates:[],
            answerer: null,
            answererIceCandidates: []
        })
    })

    socket.on("sendIceCandidateToSignallingServer",(obj)=>{
        const {iceCandidate,meeting_id,did_I_call} = obj;

        if(did_I_call){

            const offerToUpdate = offers.find((offer) => meeting_id === offer.offererMeetingID);
            if(offerToUpdate){
               // console.log(offerToUpdate);
                offerToUpdate.offererIceCandidates.push(iceCandidate);
            }

        }
    })
})
