const currentUrl = window.location.href;
const urlParams = new URLSearchParams(currentUrl);
const meeting_id = urlParams.toString().substring(55);

//console.log(meeting_id);

const socket = io.connect("https://localhost:8000",{
    auth:{
        meeting_id,
    }
})

let localstream;
let remotestream;
let did_I_call = false;
let peerConnection;



