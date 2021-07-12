const socket = io('/') 

// connected to the server with socket io

function setUsernameAndStart() {        // to sending username and id to server
    myUsername = document.getElementById('username-input').value;       // geting username from page
    let n1 = myUsername.length, n2 = 0;
    for (let i = 0; i < n1; i++) { if (myUsername[i] == ' ') n2++ }
    if (n1 == n2) {
        alert("Enter valid Username !!")
        return;
    }
    document.getElementById('username-div').style.display = 'none';             // hiding the username div
    document.getElementById('onMeeting-div').style.display = 'inline-block ';   // unhiding the onMeeting div
    let slink= window.location.href ; let cnt = 0 ;
    for(let i= slink.length-1 ; i>-1 ; i--){
        if(slink[i] == '/' ) cnt ++ ;
        if(cnt==2){
            slink = slink .substring(0,i) + '/meet/' ;
            break ;
        }
    } 
    document.getElementById('meetingLink-display-input').value = slink + meetingId;
    document.getElementById('meetingId-display-input').value =   meetingId;

    socket.emit('join-meeting',meetingId,'xxxxx-chatroom-xxxx',myUsername)
}

function enterSend(e) {             // to send message on pressing enter key
    if (e.key == 'Enter') {
        sendMessage();
    }
}

function sendMessage() {                                        // to send message to the server
    let msg = document.getElementById('next-message').value;
    document.getElementById('next-message').value = "";
    let si = 0, sj = msg.length;
    for (si = 0; si < msg.length; si++) { if (msg[si] != ' ') { break; } }      // removing all spaces from the front and the last
    for (; sj > -1; sj--) { if (msg[sj] != ' ') { sj++; break; } }
    if (si == msg.length) return;
    msg = msg.substring(si, sj);
    msg = ' <strong>' + myUsername + ': </strong> ' + msg;
    socket.emit('send-message', msg);                                           // sending message to server    
}

socket.on('display-message', msg => {   // on recieving a new message
    let par = document.createElement('p');
    par.innerHTML = msg;
    document.getElementById('chat-content-div').appendChild(par);   //adding chat to the content content div
    document.getElementById('chat-content-div').scrollTop = document.getElementById('chat-content-div').scrollHeight;   // scroling so that the user does not have to scroll every time a new message is recieved

})

socket.on('previous-chat',(prchat)=>{           //  receiving old chats of this meeting
    prchat.forEach(msg => {
        let par = document.createElement('p');
        par.innerHTML = msg;
        document.getElementById('chat-content-div').appendChild(par);       //adding chat to the content content div
        document.getElementById('chat-content-div').scrollTop = document.getElementById('chat-content-div').scrollHeight;   
    });
})

function copyToClipboardMeetingLink(element) {                          // to copy meeting Link to clipboard
    let copyText = document.getElementById("meetingLink-display-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    element.innerText ='Copied'                                         // changing the inner text of button from copy to copied
    setTimeout(function () {                                            // for 1 second then changing it back to copy
        element.innerText ='Copy'
    }, 1000);
}
function copyToClipboardMeetingId(element) {                            // to copy meeting id to clipboard
    let copyText = document.getElementById("meetingId-display-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    element.innerText ='Copied'                                         // changing the inner text of button from copy to copied
    setTimeout(function () {                                            // for 1 second then changing it back to copy    
        element.innerText ='Copy'
    }, 1000);
}
function leaveMeeting() {                               // to leave meeting
    window.location.replace("/");                       // redirecting to home page
}
function joinMeeting() {                                // to join the meeting
    window.location.replace("/meet/"+meetingId);        // redirecting to meeting 
}

