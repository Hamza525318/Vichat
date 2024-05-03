//the below two buttons refer to the home page buttons
const btn1 = document.getElementById("start_meet_btn");
const btn2 = document.getElementById("join_meet_btn");
const start_meeting_box = document.getElementById("start_meeting_box");
const join_meeting_box = document.getElementById("join_meeting_box");
const close_start_meeting_btn = document.getElementById("close_start_meeting_btn")
const close_join_meeting_btn  = document.getElementById("close_join_meeting_btn")


//the below two buttons refer to the input buttons when you enter password to start or join meeting
const start_meet_btn = document.getElementById("start_meeting");
const join_meet_btn = document.getElementById("join_meeting");

//password and confirm password to start a new meeting
const start_meet_pass = document.getElementById("start_password");
const confirm_start_meet_pass = document.getElementById("confirm_start_password");

console.log(start_meet_pass);

btn1.addEventListener("click",()=>{
    if(join_meeting_box.style.display == "flex"){
        join_meeting_box.style.display = "none"
    }
    start_meeting_box.style.display = "flex"
})

btn2.addEventListener("click",()=>{
    if(start_meeting_box.style.display == "flex"){
        start_meeting_box.style.display = "none"
    }

    join_meeting_box.style.display = "flex"
})

close_start_meeting_btn.addEventListener("click",()=>{
    start_meeting_box.style.display = "none";
})

close_join_meeting_btn.addEventListener("click",()=>{
    join_meeting_box.style.display = "none";
})

start_meet_btn.addEventListener("click",async()=>{

    if(!start_meet_pass.value && !confirm_start_meet_pass.value){
        alert("please enter both password and confirm password");
        return;
    }
    else if(start_meet_pass.value.length < 8){
        alert("password should be atleast 8 characters")
    }
    else if(confirm_start_meet_pass.value !== start_meet_pass.value){
       alert("password and confirm password does not match");
       return;
    }

    const meeting_id = await fetchMessageID();

    //sets the entire url of the web page which adds a new entry in the browser history
    window.location.href = `/new-chat?meet-id=${meeting_id}`

})

const fetchMessageID = async()=>{
    
    let messageId = "";
    const data = {
        password: start_meet_pass.value,
    }
    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }
    
    await fetch("/get-message-id",options).
    then((res)=>res.json())
    .then((data)=>{
        messageId = data.messageId;
    })

    return messageId;
}