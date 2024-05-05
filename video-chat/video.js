const currentUrl = window.location.href;
const urlParams = new URLSearchParams(currentUrl);
const meeting_id = urlParams.toString().substring(55);
const meeting_id_header = document.getElementById("meeting_id_tag");
let localVideoEl = document.getElementById("local-video");
let remoteVideoEl = document.getElementById("remote-video");
const username = "Ham-"+Math.floor(Math.random()* 1000000);

//console.log(meeting_id);
meeting_id_header.innerText = meeting_id
const socket = io.connect("https://localhost:8000",{
    auth:{
        meeting_id,
        username,
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

        //add tracks that can be sent once the connection is established;
        localstream.getTracks().forEach((track)=> {
            console.log(track);
            peerConnection.addTrack(track);
        })

        peerConnection.addEventListener("signalingstatechange",(e)=>{
            console.log(peerConnection.signalingState)
        })

        peerConnection.addEventListener("icecandidateerror",(e)=>{
            console.log("errorrrrr")
        })

        //on receiving ice candidates sending it to the server
        peerConnection.addEventListener('icecandidate',(e)=>{
            console.log(e.candidate);
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

        resolve();
    })
}

call();

