socket.on('availableOffer',(offer)=>{
    console.log(offer);
    createOffer(offer);
})


socket.on("receivedIceCandidatesFromServer",(iceCandidates)=>{

    console.log("here are your iceCandidates from caller");
    addNewIceCandidates(iceCandidates);
})

socket.on("offerer_disconnected",()=>{
    callerEndedCall();
})

const createOffer = (offer)=>{

    const join_meet_div = document.getElementById("joinee_btn_box");
    const btn = document.createElement("button");
    btn.innerText = "JOIN MEETING"
    btn.setAttribute("id","joinee_btn");
    btn.addEventListener("click",()=>answerToOffer(offer));
    join_meet_div.appendChild(btn);
}

