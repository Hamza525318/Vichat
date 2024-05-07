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

//console.log(map.size);
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

    res.status(200).json({
        message: "successfulll"
    })
})

const findSocketId = (users,type,meeting_id)=>{
      
    let socketId = null;
    users.forEach((value,key)=>{
        if(meeting_id === value.id && value.type == type){
            socketId = key;
            console.log(key);
        } 

        if(socketId){
            return;
        }
    })

    return socketId;
}

//socket logic here
io.on("connection",(socket)=>{
    
    const meeting_id = socket.handshake.auth.meeting_id;
    const username = socket.handshake.auth.username;
    const type = socket.handshake.auth.type;
    //console.log(meeting_id);
    users.set(socket.id,{id: meeting_id,pass: map.get(meeting_id),username,type});

    if(type === "answerer"){
        console.log("answerer is here")
        const offerToAnswer = offers.find((offer)=>offer.offererMeetingID === meeting_id && offer.answerer == null);
        if(offerToAnswer){
            socket.emit('availableOffer',offerToAnswer)
        }
    }

    socket.on("new-offer",(offer)=>{
        offers.push({
            offererMeetingID: meeting_id,
            offer: offer,
            offererIceCandidates:[],
            answerer: null,
            answererIceCandidates: []
        })
    })


    socket.on('newAnswer',(offerObj,ackFunc)=>{

        //we need to emit the answer obj to client1
        const offererSocketID = findSocketId(users,"offerer",offerObj.offererMeetingID);

        if(!offererSocketID){
            console.log("no offerer socket id");
            return;
        }

        const offerToUpdate = offers.find((offer)=> offerObj.offererMeetingID == offer.offererMeetingID);
        if(!offerToUpdate){
            console.log("no matching offer");
            return;
        }
        ackFunc(offerToUpdate.offererIceCandidates);
        offerToUpdate.answer = offerObj.answer;

        socket.to(offererSocketID).emit('answerResponse',offerToUpdate);
        console.log("emitted answer successfully");

    })
    socket.on("sendIceCandidateToSignallingServer",(obj)=>{
        const {iceCandidate,meeting_id,did_I_call} = obj;

        if(did_I_call){
            //updating ice candidates of offerer
            const offerToUpdate = offers.find((offer) => meeting_id === offer.offererMeetingID);
            if(offerToUpdate){
               // console.log(offerToUpdate);
                offerToUpdate.offererIceCandidates.push(iceCandidate);
                if(offerToUpdate.answerer){
                   let answererSocketId = findSocketId(users,meeting_id,"answerer");

                   if(answererSocketId){
                    socket.to(answererSocketId).emit('receivedIceCandidatesFromServer',iceCandidate);
                   }
                }
            }

        }
        else{
             
            //updating ice candidates of receiver
            console.log("answerer sent ice candidates")
            const offerToUpdate = offers.find((offer)=>meeting_id===offer.offererMeetingID);
            //console.log(offerToUpdate);
            offerToUpdate.answererIceCandidates.push(iceCandidate);

            //finding the socket of the offerer and emitting the answerer iceCandidates
            let offererSocketID = findSocketId(users,"offerer",meeting_id);
            if(offererSocketID){
                socket.to(offererSocketID).emit('receivedIceCandidatesFromServer',iceCandidate);
            }
        }
    })
})
