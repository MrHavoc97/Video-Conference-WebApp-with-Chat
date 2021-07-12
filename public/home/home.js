const socket = io('/') 

//  connecting to the server with socketio 

let meetingId ='' ;
let x1 = 0
function askId (){      //  asking the id from the user through prompt, to join that meeting
    x1=0
    meetingId = prompt('Enter Meeting Id ','') 
    socket.emit('ask-meeting',meetingId) ;      // asking the server if meeting exists or not
}
function toChatroom (){//  asking the id from the user through prompt, to join that meeting's chatroom
    x1=1;
    meetingId = prompt('Enter Meeting Id ','') 
    socket.emit('ask-meeting',meetingId) ;      // asking the server if meeting exists or not
}


socket.on('meeting-exists',()=>{                                // if meeting server replies exists 
    if(x1){
        window.location.replace( '/chatroom/' + meetingId)      // redirecting to chatroom if x1 is 1
    }
    else{
        window.location.replace( '/meet/' + meetingId)          // redirecting to chatroom if x1 is 0
    }
})
socket.on('no-meeting',()=>{                                    //  other wise
    alert('Wront Meeting Id : NO such meeting')                 //  showing an alert 
})