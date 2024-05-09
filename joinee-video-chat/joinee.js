const url = window.location.href
const urlParams = new URLSearchParams(url);
const meeting_id = urlParams.toString().substring(56);
const username = "Ham-"+(Math.random()*100000);
const video_box = document.getElementById("main")
const join_meet_div = document.getElementById("joinee_btn_box");
const localVideoEl = document.getElementById("local-video");
const remoteVideoEl = document.getElementById("remote-video");
const disconnect_btn = document.getElementById("disconnect_btn");
const modal_container = document.getElementById("modal_container");
const modal_yes_btn = document.getElementById("yes_btn");
const modal_no_btn = document.getElementById("no_btn");

const socket = io.connect("https://localhost:8000",{
    auth:{
        meeting_id,
        username,
        type:"answerer",
    }
})

let localstream;
let remotestream;
let did_I_call = false;
let peerConnection;

//iceServers to capture iceCandidates
const peerConfiguration = {

    iceServers:[
        {
            urls:[
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}

const answerToOffer = async(offer)=>{
   
    join_meet_div.style.display = "none";
    video_box.style.display = "block";
    document.getElementById("meeting_id_tag").innerText = meeting_id;
    console.log(offer);
    
    await fectchUserMedia();
    await createPeerConnection(offer);
    //console.log("control here")

    //creating the RTCDescription of object type answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    offer.answer = answer;
    //emit the answer to the server so that it can send it to client
    socket.emitWithAck('newAnswer',offer).then((offererIceCandidates)=>{
        offererIceCandidates.forEach((ice)=>{
            peerConnection.addIceCandidate(ice);
        })
    })

    // console.log(offerIceCandidates)

   

}

const fectchUserMedia = ()=>{

    return new Promise(async (resolve,reject)=>{
           try {
              //getUserMedia returns a promise that resolves to a MediaStream object
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
              })
              localVideoEl.srcObject = stream;
              localstream = stream;
              resolve();
           } catch (error) {
              alert("error while capturing stream");
              return
           }
    })

}

const createPeerConnection = async(offerObj)=>{
    
    //console.log(offerObj);
    return(new Promise(async (resolve,reject)=>{

        peerConnection = await new RTCPeerConnection(peerConfiguration);
        localstream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track,localstream);
        });

    remotestream = new MediaStream();
    remoteVideoEl.srcObject = remotestream;

    peerConnection.addEventListener("icecandidate",(e)=>{
        if(e.candidate){
            socket.emit('sendIceCandidateToSignallingServer',{
                iceCandidate: e.candidate,
                meeting_id: meeting_id,
                did_I_call,
            })
        }
    })

    peerConnection.addEventListener("track",(e)=>{
        
        if(e.streams[0]){
            e.streams[0].getTracks().forEach((track)=>{
                remotestream.addTrack(track,remotestream)
            })
        }
    })

    if(offerObj){
        //setting the remotedescriptionw
        await peerConnection.setRemoteDescription(offerObj.offer);
        console.log(peerConnection.signalingState);
    }

    resolve();

    }))
    
}
const addNewIceCandidates = (iceCandidate)=>{
    peerConnection.addIceCandidate(iceCandidate);
}

const disconnectCall = ()=>{
    
    peerConnection.close();
    peerConnection.setRemoteDescription(null);
    peerConnection.setLocalDescription(null);
    socket.emitWithAck("disconnect_call").then((res)=>{
        closeModal();
        window.location.replace("https://localhost:8000");
        alert(res);
    })
    .catch((error)=>{
        alert("Their was an error!!");
        window.location.replace("https://localhost:8000");
    })
    
}

const closeModal = ()=>{
    modal_container.style.display = "none";
    modal_container.classList.remove("modal_active");
    document.body.classList.remove("bg-color");
}

const openModal = ()=>{
    
    modal_container.style.display = "flex";
    modal_container.classList.add("modal_active");
    document.body.classList.add("bg-color")
}

//for disconnecting from call;
disconnect_btn.addEventListener("click",openModal);
modal_no_btn.addEventListener("click",closeModal);

modal_yes_btn.addEventListener("click",disconnectCall);
