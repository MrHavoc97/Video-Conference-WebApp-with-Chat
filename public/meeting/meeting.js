const socket = io('/') 
// connected to the server through socketio

const peer = new Peer()             // createed a new object of Peer

let localStream;
let screenStream;

let myUserId;   
let myUsername = 'Anonymous99';
let meetingname = 'Anonymous99';
var userLinks = {};         // userid and username
const members = {};         // userid and call
let screenShareMembers = {};    // userid and call of people in screen share call

let isScreenSharing = false ;           // to store if someone is sharing screen
let meScreenSharing = false ;           // to store if the user himself is sharing screen

let startx = false 
socket.on('previous-members', (oldUserLinks) => { //  when previous usrlinks are send , stroring them 
    userLinks = oldUserLinks
    if(startx){
        socket.emit('username-userid', myUsername, myUserId)
        return ;
    }
    startx = true ;
})

function setUsernameAndStart() {    //                                  storing the username and userid
    myUsername = document.getElementById('username-input').value;
    let n1 = myUsername.length, n2 = 0;
    for (let i = 0; i < n1; i++) { if (myUsername[i] == ' ') n2++ }
    if (n1 == n2) {
        alert("Enter valid Username !!")
        return;
    }
    document.getElementById('username-div').style.display = 'none';             // hiding username div
    document.getElementById('onMeeting-div').style.display = 'inline-block ';   // unhiding onMeeting div
    document.getElementById('meetingLink-display-input').value = window.location.href ;
    document.getElementById('meetingId-display-input').value =   meetingId;
    
    alert('Your audio is muted, and you video is stopped when you join, you can unmute and start video after joining !')   
    if(startx){
        socket.emit('username-userid', myUsername, myUserId)
        return ;
    }
    startx = true ;
}

function enterSend(e) {         // to send message on pressing enter key
    if (e.key == 'Enter') {
        sendMessage();
    }
}

function leaveMeeting() {        // to leave meeting
    window.location.replace("/");       // redirecting to home page
}

function copyToClipboardMeetingLink(element) {                              // to copy meeting Link to clipboard
    let copyText = document.getElementById("meetingLink-display-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    element.innerText ='Copied'                                             // changing the inner text of button from copy to copied
    setTimeout(function () {                                                // for 1 second then changing it back to copy
        element.innerText ='Copy'
    }, 1000);
}
function copyToClipboardMeetingId(element) {                                // to copy meeting id to clipboard
    let copyText = document.getElementById("meetingId-display-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    element.innerText ='Copied'                                             // changing the inner text of button from copy to copied
    setTimeout(function () {                                                // for 1 second then changing it back to copy
        element.innerText ='Copy'
    }, 1000);
}
const curOutDivClass = ' col col-6 col-sm-4 '                               // class of the div wrapping the cards containg video elemnts

navigator.mediaDevices.getUserMedia({                                       // to get acces to the camera
    video: {
        frameRate: 24,
        aspectRatio: 1.3333
    },
    audio: true
}).then(stream => {
    localStream = stream;
    {                                                       // creating an outer div containing a bootstrap card containing a video
        let curOutDiv = document.createElement('div');
        curOutDiv.className = curOutDivClass
        let curDiv = document.createElement('div');
        curDiv.className = 'card '
        curDiv.innerHTML = '<div class="card-body"> <h5 class="card-title"> Me </h5> </div>';
        let curVid = document.createElement('video');
        curVid.className = 'card-img-top'
        curVid.muted = true;
        curVid.setAttribute('onclick', 'changeVideoDimensions(this)')
        curDiv.prepend(curVid);
        curOutDiv.appendChild(curDiv);
        addRemoteVideo(curOutDiv, curVid, stream);        // adding local video
    }

    mutAudio();                                             // muting audia and video of ocal video
    mutVideo();

    peer.on('call', call_incoming => {                      // when there is an incoming call
        if (myUsername == 'Anonymous99') return;            // if user have not entered username yet , return to prevent creation of mutiple instances

        if(members[call_incoming.peer]==null){              // if no such member then add peerid with call 
            members[call_incoming.peer] = [call_incoming];
        }else{                                              //  otherwise push the call in members[peerid]
            members[call_incoming.peer].push(call_incoming);
        }
        call_incoming.answer(localStream);                  // answer the call with the local stream of user

                                                            // creating an outer div containing a bootstrap card containing a video        
        let curOutDiv = document.createElement('div');
        curOutDiv.className = curOutDivClass
        let curDiv = document.createElement('div');
        curDiv.className = 'card '
        curDiv.innerHTML = '<div class="card-body"> <h5 class="card-title"> ' + userLinks[call_incoming.peer] + ' </h5> </div>';
        let curVid = document.createElement('video');
        curVid.className = 'card-img-top'
        curVid.setAttribute('onclick', 'changeVideoDimensions(this)')
        curDiv.prepend(curVid);
        curOutDiv.appendChild(curDiv);

        call_incoming.on('stream', (remoteStream) => {      // when stream is recieved via tha call
            addRemoteVideo(curOutDiv, curVid, remoteStream);
        })
        call_incoming.on('close', () => {               // when the call closes
            members[call_incoming.peer] =null;  
            curOutDiv.remove();                         //  remove the div containing bootstrap card containigg remote video 
        })
    })

    socket.on('user-connected', (newUserId, newUsername) => {       // when new user is connected
        connectNewUser(newUserId, newUsername)              
        userLinks[newUserId] = newUsername;                 //  update userlinks
    })

})

function connectNewUser(nui, nun) {                     // to call the new member of the meeting
    if (myUsername == 'Anonymous99') return;            // if user have not entered username yet , return to prevent creation of mutiple instances    

    const call_outgoing = peer.call(nui, localStream);      // calling the new member

                                                            // creating an outer div containing a bootstrap card containing a video 
    let curOutDiv = document.createElement('div');
    curOutDiv.className = curOutDivClass
    let curDiv = document.createElement('div');
    curDiv.className = 'card '
    curDiv.innerHTML = '<div class="card-body"> <h5 class="card-title"> ' + nun + ' </h5> </div>';
    let curVid = document.createElement('video');
    curVid.className = 'card-img-top'
    curVid.setAttribute('onclick', 'changeVideoDimensions(this)')
    curDiv.prepend(curVid);
    curOutDiv.appendChild(curDiv);

    call_outgoing.on('stream', (remoteStream) => {               // when stream is recieved via tha call
        addRemoteVideo(curOutDiv, curVid, remoteStream);
    })
    if(members[nui]==null)                                          // if no such member then add peerid with call 
        members[nui] = [call_outgoing];
    else
        members[nui].push (call_outgoing ) ;                //  otherwise push the call in members[peerid]
        
    call_outgoing.on('close', () => {                   // when the call is closed
        members[nui] =null;
        curOutDiv.remove();                              //  remove the div containing bootstrap card containigg remote video 
    })
    
    if(meScreenSharing==false) return                   // if user is not sharing screen then return

    const call_outgoing_screen = peer.call(nui, screenStream);      // otherwise the user needs to make another call containing the screen stream 
    screenShareMembers[nui] = call_outgoing_screen;             // updating screensharemembers

    
}

socket.on('user-disconnected', userId => {      // when server tells someone disconnected
    if (members[userId] != null) {              
        members[userId].forEach(element => {        //  close all the calls to that user
            element.close();
        }); 
        members[userId] = null ;
    }
})

function addRemoteVideo(curDiv, curVid, stream) {      // adds stream to curVid which is inside curDiv

    curVid.addEventListener('loadedmetadata', () => {       // when loading metadata is complete then start playing the video
        curVid.play();
    })
    curVid.srcObject = stream;
    document.getElementById('video-call-div').appendChild(curDiv)
}

function sendMessage() {
    let msg = document.getElementById('next-message').value;
    document.getElementById('next-message').value = "";
    let si = 0, sj = msg.length;
    for (si = 0; si < msg.length; si++) { if (msg[si] != ' ') { break; } }
    for (; sj > -1; sj--) { if (msg[sj] != ' ') { sj++; break; } }
    if (si == msg.length) return;
    msg = msg.substring(si, sj);
    msg = ' <strong>' + myUsername + ': </strong> ' + msg;
    socket.emit('send-message', msg);
}

socket.on('display-message', msg => {                        // on recieving a new message
    let par = document.createElement('p');
    par.innerHTML = msg;
    document.getElementById('chat-content-div').appendChild(par);                //adding chat to the content content div
    document.getElementById('chat-content-div').scrollTop = document.getElementById('chat-content-div').scrollHeight; // scroling so that the user does not have to scroll every time a new message is recieved

})
socket.on('previous-chat',(prchat)=>{                            //  receiving old chats of this meeting
    prchat.forEach(msg => {
        let par = document.createElement('p');
        par.innerHTML = msg;
        document.getElementById('chat-content-div').appendChild(par);                           //adding chat to the content content div
        document.getElementById('chat-content-div').scrollTop = document.getElementById('chat-content-div').scrollHeight;
    });
})
peer.on('open', id => {         //          when peer connection is open        , store the peer id  
    socket.emit('join-meeting', meetingId, id, myUsername)
    myUserId = id;
})
function changeVideoDimensions(curVid) {            // changes video dimension on cliking
    if (curVid.style.objectFit != 'contain') {
        curVid.style.objectFit = 'contain ';
        curVid.parentElement.parentElement.className = 'col-12';
    }
    else {
        curVid.style.objectFit = 'cover';
        curVid.parentElement.parentElement.className = curOutDivClass;
    }
}


socket.on('screenshare-started',()=>{       // when server sends - screenshare-started
    isScreenSharing = true                  // making isScreenSharing true 
})
socket.on('screenshare-stopped',(userId)=>{     // when server sends - screenshare-stiopped
    if(members[userId]==null) return
    let temp1 = members[userId][0]
    members[userId][1].close() ;                // every member must have a single call except the one sharing screen, because hi is sharing both his screen and camera video
    members[userId] = [temp1]                     //    closing the second call of the person sharing screen  
    isScreenSharing = false                     // making isScreenSharing false 
})


function startScreenShare() {           // to start and end sharing screen
    if (document.getElementById('screenShare-button').innerText == 'Share Screen') {    //  start sharing screen if the inner text is share screen
        if(isScreenSharing == true){                            // if isScreenSharing == true then give an alert 
            alert('Someone is already sharing screen !!')
            return
        }
        navigator.mediaDevices.getDisplayMedia({                // getting display media
            video: true,
            audio: true
        }).then(stream => {
            screenStream = stream;
            for (let [key, value] of Object.entries(members)) {     // calling all octive members and sharing the display media
                if(value == null) continue 
                if (value[0].open == true) {
                    const call_outgoing = peer.call(key, stream);
                    screenShareMembers[key] = call_outgoing;  
                }
            }
            socket.emit('screenshare-started', myUserId,meetingId )     // telling server screen share started
            meScreenSharing = true ;
            stream.getVideoTracks()[0].onended = function () {          // when stram ends call startScreenShare again 
                startScreenShare()
            };
            document.getElementById('screenShare-button').innerText = 'Stop Sharing Screen';
        }).catch((err)=>{
            console.log(err)
        })
    }
    else {                                                              // to end screensharing
            screenStream.getTracks().forEach(track => track.stop())     // stopping the displaymedia track
        for (let [key, value] of Object.entries(screenShareMembers)) {  //  ending all calls of screenshare 
                value.close();
        }
        socket.emit('screenshare-stopped', myUserId,meetingId )         // telling server screen share stopped
        meScreenSharing = false ;                                       // making meScreenSharing false as the user stoppedsharing stream
        document.getElementById('screenShare-button').innerText = 'Share Screen';
    }
}

isAudio = true;
isVideo = true;
function mutAudio() {                       // to mute/unmute audio
    isAudio = !isAudio;
    localStream.getAudioTracks()[0].enabled = isAudio;
    if (isAudio == false)
        document.getElementById('muteAudio-button').innerHTML = 'Unmute '
    else
        document.getElementById('muteAudio-button').innerHTML = 'Mute '
}
function mutVideo() {                       // to stop/start video
    isVideo = !isVideo;
    localStream.getVideoTracks()[0].enabled = isVideo;
    if (isVideo == false)
        document.getElementById('muteVideo-button').innerHTML = 'Start Video'
    else
        document.getElementById('muteVideo-button').innerHTML = 'Stop Video'
}