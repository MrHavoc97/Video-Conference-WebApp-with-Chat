const express = require('express') ;
const app  = express() ;
const http  = require('http') ;
const server = http.createServer(app)       
const io = require('socket.io')(server)
const {v4 : uuidv4} = require('uuid')
const mongoose = require('mongoose')
const date = new Date() ;
const dotenv = require('dotenv')
dotenv.config()

const DB_USERNAME = process.env.DB_USERNAME.toString()   ; 
const DB_PASSWORD = process.env.DB_PASSWORD.toString()   ; 

// mongoose.connect('mongodb://localhost:27017/chatDB',{useNewUrlParser:true, useUnifiedTopology: true,})
mongoose.connect('mongodb+srv://'+DB_USERNAME+':'+DB_PASSWORD+'@cluster0.rvjbd.mongodb.net/chatDB',{useNewUrlParser:true, useUnifiedTopology: true,})


//      function for encryption and decryption.
function enc(str,n){
    let A = process.env.ENC_A.toString() ; let a = process.env.ENC_AA.toString() ;    let a1 =process.env.ENC_A1.toString() ;
    let fstr =''
    for(let i =0 ;i <str.length;i++){
        if(A.lastIndexOf(str[i])!=-1){
            fstr += A [ (A.lastIndexOf(str[i])+27+n)%27 ]; 
        }
        else if(a.lastIndexOf(str[i])!=-1){
            fstr += a [ (a.lastIndexOf(str[i])+27+n)%27 ]; 
        }
        else if(a1.lastIndexOf(str[i])!=-1){
            fstr += a1 [ (a1.lastIndexOf(str[i])+12+n)%12 ]; 
        }
        else{
            fstr += str[i]
        }
    }

    return fstr
}
//      schema for chat model
const chatSchema = mongoose.Schema({
    meeting_id: String ,
    chat : [String],
    date:Number
})

//      creating chat model with mongoose
const Chat = mongoose.model('chat',chatSchema)

var newMeeting = uuidv4() ;     //  generating a unique id for new meeting
var userLinks ={} ;             //  to store links of userid and username

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get('/',function(req ,res){
    newMeeting = uuidv4()                               //  generating a new id everytime someone goes to the home page
    res.render("home.ejs" ,{newMeeting:newMeeting} ) ;  //  passing the newly generated mmetingid to the homepage    

})

app.get('/manual',function(req ,res){
    newMeeting = uuidv4()                               //  generating a new id everytime someone goes to the home page
    res.render("manual.ejs",{newMeeting:newMeeting} ) ;  //  passing the newly generated mmetingid to the homepage    

})
app.post('/',function(req ,res){
    res.render("home.ejs" ,{newMeeting:newMeeting} ) ;
})
app.get('/meet/:meeting',function(req ,res){        //  getting the meeting id from the link and giving it to the page
        res.render('meeting.ejs',{meetingId:req.params.meeting})
})
app.get('/chatroom/:meeting',function(req ,res){    //  getting the meeting id from the link and giving it to the page
    res.render('chatroom.ejs',{meetingId:req.params.meeting})
})

//  whenever someone is connected to the server through socket io
io.on('connection',socket=>{
    socket.on('join-meeting',(meetingId,userId,username)=>{
        
        socket.join(meetingId)                                  // joined the current socket to the room with id : meetingId
        if(userId!='xxxxx-chatroom-xxxx')                       //  if userId is 'xxxxx-chatroom-xxxx' it means the user is from a chatroom, so no need to send the details required for video call
            socket.emit('previous-members',userLinks)
        
        Chat.findOne({meeting_id:meetingId},(er,val)=>{         // checking if the meeting exists or not
            if(er){
                console.log(er) ;
                return ;
            }
            else{
                if(!val){                                       //  if it does not exists then creating a new document for it in the db
                    chat = new Chat({ 
                        meeting_id:meetingId,
                        chat: [],
                        date: date.getDate()
                    })
                    chat.save()
                }
                else{                                           // if it exists then decrypting the stored chat 
                    let dchat=[];
                    val.chat.forEach(element => {
                        dchat.push(enc(element,-(val.date%7 + 1)%11))
                    });
                    socket.emit('previous-chat',dchat)          // and sending it to the new user through socket connection
                }
            }
        })

        socket.on('disconnect',()=>{                            // if user disconnected
        socket.to(meetingId).emit('user-disconnected',userId)   //  sending the userid of the disconnected user to everyone else in the meeting 
            if(socket.adapter.sids.size == 0) {                 // checking the number of participants connected to the server
                userLinks ={} ;                                 // if 0 then resetting the userlinks
            }
        })

        socket.on('send-message',msg=>{                         //  if new message is recieved

            Chat.findOne({meeting_id:meetingId},(er,curChat)=>{     // finding the meeting's document
                if(er){
                    console.log(er) ;
                    return ;
                }
                else{
                    curChat.chat.push(enc(msg,(curChat.date%7 + 1)%11) )    // appending the message after encrypting it
                    curChat.save()
                }
            })

            io.in(meetingId).emit('display-message',msg) ;          // sending the message to all other meeting members
        })

        socket.on('username-userid',(username,userId)=>{        // sending the userID along with Username to all other meeting members after recieving them
            socket.to(meetingId).emit('user-connected',userId,username) ;
            userLinks[userId] = username ;  
        })

        socket.on('screenshare-started',(userId,meetingId)=>{   // informing everyone in the meeting that someone is sharing screen, if someone started sharing screen
            io.in(meetingId).emit('screenshare-started') ;
        })
    
        socket.on('screenshare-stopped',(userId,meetingId)=>{   // informing everyone in the meeting that someone stopped sharing screen, if someone stopped sharing screen
            io.in(meetingId).emit('screenshare-stopped',userId) ;   
        })
    
    })

    socket.on('ask-meeting',(meetingId)=>{                  // if asked a meeting exists or not
        Chat.findOne({meeting_id:meetingId},(er,val)=>{     // searching for the meeting in db
            if(er){
                console.log(er) ;
                return ;
            }
            else{
                if(!val){                                   // if it does not exist telling the user it does not exist
                    socket.emit('no-meeting') ;
                }
                else{
                    socket.emit('meeting-exists') ;         // otherwise telling the user it exists
                }
            }
        })
    })

})


server.listen( process.env.PORT || 3000 ,()=>{          // listening on the port assigned by server , if not then on port 3000
    if(!process.env.PORT || process.env.PORT =='')
    console.log("server running at port 3000 " )
    else
    console.log("server running at port " + process.env.PORT )
})
