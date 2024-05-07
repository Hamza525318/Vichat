socket.on("receivedIceCandidatesFromServer",(iceCandidates)=>{

    console.log("here are your ice candidates");
    addNewIceCandidates(iceCandidates);
})

socket.on("answerResponse",(offerObj)=>{
     
    addRemoteDescription(offerObj);
})