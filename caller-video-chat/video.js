const currentUrl = window.location.href;
const urlParams = new URLSearchParams(currentUrl);
const meeting_id = urlParams.toString().substring(55);
//console.log(meeting_id);
const meeting_id_header = document.getElementById("meeting_id_tag");
let localVideoEl = document.getElementById("local-video");
let remoteVideoEl = document.getElementById("remote-video");
const username = "Ham-"+Math.floor(Math.random()* 1000000);
const disconnect_btn = document.getElementById("disconnect_btn");
const modal_container = document.getElementById("modal_container");
const modal_yes_btn = document.getElementById("yes_btn");
const modal_no_btn = document.getElementById("no_btn");



//console.log(meeting_id);
meeting_id_header.innerText = meeting_id
const socket = io.connect("https://localhost:8000",{
    auth:{
        meeting_id,
        username,
        type: "offerer"
    }
})

let localstream;
let remotestream;
let did_I_call = false;
let peerConnection;


/*iceServers to get public ip address and port number so that clients can find a way to connect to them*/
let peerConfiguration = {
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}


const call = async()=>{
 
    await fetchUserMedia().catch((err)=>{
        alert(err);
    })

    await createPeerConnection();
    //console.log("creating offer now");
    try {
        const offer = await peerConnection.createOffer();
        //console.log(offer);
        peerConnection.setLocalDescription(offer);
        did_I_call = true;
        socket.emit('new-offer',offer)
    } catch (error) {
        alert(error);
        return
    }
}

const fetchUserMedia = ()=>{

    return new Promise(async (resolve,reject)=>{
         
        try {
             
            //produces Mediastream with tracks of requested media type
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })
            
            localVideoEl.srcObject = stream;
            localstream = stream;
            resolve(); 
        } catch (error) {
            reject("Permission denied to access audio and video...Please allow it in site settings");
        }
    })
}

const createPeerConnection = async(offerObj)=>{
 
    return new Promise(async (resolve,reject)=>{

        //peerConnection object is responsible to create the connection,monitor and disconnect
        //when we pass the config object to peerConnection obj it will fetch us the ICE Candidates

        peerConnection = await new RTCPeerConnection(peerConfiguration);
        //console.log(peerConnection);
        remotestream = new MediaStream();
        remoteVideoEl.srcObject = remotestream;
        //console.log(peerConnection.signalingState);

        //add tracks that can be sent once the connection is established;
        localstream.getTracks().forEach((track)=> {
            //console.log(track);
            peerConnection.addTrack(track,localstream);
        })

        peerConnection.addEventListener("signalingstatechange",(e)=>{
            console.log(peerConnection.signalingState)
        })
        
        // peerConnection.onsignalingstatechange((e)=>{
        //     console.log("event change trigger")
        // })
        

        // peerConnection.addEventListener("icecandidateerror",(e)=>{
        //     console.log("errorrrrr")
        // })

        //on receiving ice candidates sending it to the server
        peerConnection.addEventListener('icecandidate',(e)=>{
            //console.log(e.candidate);
            if(e.candidate){
                socket.emit('sendIceCandidateToSignallingServer',{
                    iceCandidate: e.candidate,
                    meeting_id: meeting_id,
                    did_I_call,
                })
            }
        })


        //adding an event listener to add tracks to remote stream when received from other side
        peerConnection.addEventListener('track',(e)=>{
            e.streams[0].getTracks().forEach((track)=>{
                remotestream.addTrack(track,remotestream)
            })
        })

        // peerConnection.onClose = ()=>{
        //     console.log("connection terminated")
        // } 

        resolve();
    })
}

call();

const addNewIceCandidates = (iceCandidate)=>{
    peerConnection.addIceCandidate(iceCandidate);
    console.log("ice candidates from caller");
}

const addRemoteDescription = async (offerObj)=>{
    console.log(peerConnection.signalingState);
    await peerConnection.setRemoteDescription(offerObj.answer);
    console.log("set remoteDescription successfully")
}

const removeRemoteDescription = async()=>{
   // console.log(peerConnection.signalingState);
    remotestream = new MediaStream();
    remoteVideoEl.srcObject = remotestream;
    console.log("control came to remove remote description")
    await call();
    //await peerConnection.setRemoteDescription(new RTCSessionDescription({sdp:'',type:"answer"}));
    //console.log(peerConnection.currentRemoteDescription);
    //await peerConnection.setRemoteDescription(new RTCSessionDescription({type:'answer',sdp:''}));
}

const disconnectCall = ()=>{

    socket.emitWithAck("disconnect_call").then(async (res)=>{
        closeModal();
        window.location.replace("https://localhost:8000");
        alert("YOU HAVE ENDED THE CALL");
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
