const express= require('express');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const jwt=require('jsonwebtoken');
const User=require('./models/User');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const bcrypt=require('bcryptjs');
const ws=require('ws');
const Message=require('./models/Message');
const bcryptSalt=bcrypt.genSaltSync(10);
const fs=require('fs');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtSecret=process.env.JWT_SECRET;

const app=express();
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req){
    return new Promise((resolve,reject)=>{
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) reject(err);
                else resolve(userData);
            });
        }
        else{
            reject('no token');
        }
    });
}

app.get('/test', (req,res)=>{
    res.json('test okay');
})

app.get('/messages/:userId', async(req,res)=>{
    const {userId}=req.params;
    // console.log(userId);
    const userData=await getUserDataFromRequest(req);
    const ourUserId=userData.userId;
    const messages= await Message.find({
        sender: {$in:[userId, ourUserId]},
        recipient: {$in: [userId, ourUserId]},
    }).sort({createdAt:1}).exec();
    res.json(messages);
});

app.get('/people', async(req,res)=>{
    const users=await User.find({},{'_id':1, username:1});
    res.json(users);
})

app.get('/profile', (req,res)=>{
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            // console.log(userData);
            res.json(userData);
        });
    }
    else{
        res.status(401).json('No token');
    }
})

app.post('/login', async(req,res)=>{
    const {username, password}=req.body;
    try {
        const foundUser = await User.findOne({ username });
        if (foundUser) {
            const id = foundUser._id;
            const passOk = bcrypt.compareSync(password, foundUser.password);
            if (passOk) {
                jwt.sign({ userId: id, username:username}, jwtSecret, {}, (err, token) => {
                    res.cookie('token', token).json({
                        id: foundUser._id,
                    })
                })
            }
            else {
                return res.status(401).json('Incorrect Username or Password');
            }
        }
        else {
            return res.status(401).json('No Such Username Exists');
        }
    } catch (error) {
        console.error('Error during Login');
        res.status(500).json('Internal Server Error');
    }
})

app.post('/register', async(req,res)=>{
    const {username,password}=req.body;
    try {
        // Check if the username already exists in the database
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json('Username already exists');
        }

        // Username doesn't exist, proceed with user creation
        const hashedPassword= bcrypt.hashSync(password, bcryptSalt);
        const createdUser= await User.create({
            username:username,
            password:hashedPassword,
            contacts: [],
        });
        const token=await new Promise((resolve, reject)=>{
            jwt.sign({userId:createdUser._id, username:username}, jwtSecret,{}, (err,token)=>{
                if (err) reject(err);
                resolve(token);
            }); //can use await as well
        });
        res.cookie('token', token).status(201).json({
            id: createdUser._id,
            contacts: createdUser.contacts,
        });
    } catch(err) {
        console.error("Error during user registration:", err);
        res.status(500).json('Internal Server Error');
    }
});

app.post('/contacts', async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const contacts = user.contacts || [];
        res.json(contacts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/chats', async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const sentMessages = await Message.find({
            sender: id 
        }).sort({ createdAt: 1 }).distinct('recipient');
        const recievedMessages = await Message.find({
            recipient: id
        }).sort({createdAt:1}).distinct('sender');
        const users=[...new Set([...sentMessages, ...recievedMessages])];
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/logout', (req,res)=>{
    // res.cookie('token','', {sameSite:'none', secure:true}).json('ok');
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) {
                console.error('JWT verification failed:', err);
                res.status(500).json('Internal Server Error');
            } else {
                const userId = userData.userId;
                [...wss.clients].forEach(client => {
                    if (client.userId === userId) {
                        client.terminate(); // Terminate WebSocket connection for the logged out user
                        clearInterval(client.timer); // Clear the heartbeat timer
                    }
                });
                notifyAboutOnlinePeople(); // Notify other clients about the user's logout
                res.cookie('token', '', { sameSite: 'none', secure: true }).json('Logged out successfully');
            }
        });
    } else {
        res.status(400).json('Token not found');
    }
})

app.post('/addContact', async(req,res)=>{
    try{
        const ourId=req.body.userId
        const username=req.body.username;
        const user = await User.findById(ourId);
        if (!user) {
            return res.status(404).json("User not found")
        }
        user.contacts.push(username);
        // Save the updated user object
        await user.save();
        res.status(200).json("Contact added successfully");
    }
    catch(error){
        console.error(error);
        res.status(500).json("Internal Server Error");
    }
})

app.post('/deleteContact', async(req,res)=>{
    try{
        const ourId=req.body.userId
        const username=req.body.username;
        const user = await User.findById(ourId);
        if (!user) {
            return res.status(404).json("User not found");
        }
        const Index=user.contacts.indexOf(username);
        if (Index===-1){
            return res.status(404).json("Contact Not Found");
        }
        user.contacts.splice(Index,1);
        await user.save();
        res.status(200).json("Contact Deleted Successfully");
    }
    catch(error){
        console.error(error);
        res.status(500).json("Internal Server Error")
    }
})

const server=app.listen(5000)

const wss=new ws.WebSocketServer({server});
function notifyAboutOnlinePeople(){
    [...wss.clients].forEach(client=>{
        client.send(JSON.stringify({
            online:[...wss.clients].map(c=>({userId:c.userId, username:c.username})).filter(user=>user.userId)
        }));
    });
}
wss.on('connection', (connection,req)=>{

    connection.isAlive=true;
    connection.timer=setInterval(()=>{
        connection.ping();
        connection.deathTimer=setTimeout(()=>{
            connection.isAlive=false;
            connection.terminate();
            clearInterval(connection.timer);
            notifyAboutOnlinePeople();
            // console.log('dead');
        }, 1000)
    }, 5000);
    connection.on('pong',()=>{
        clearTimeout(connection.deathTimer);
    });
    const cookies=req.headers?.cookie;
    if (cookies){
        const tokenCookieString=cookies.split(';').find(str=>str.startsWith('token='));
        if (tokenCookieString){
            const token=tokenCookieString.split('=')[1];
            if (token){
                jwt.verify(token, jwtSecret, {}, (err,userData)=>{
                    if (err) throw err;
                    const {userId, username}=userData
                    // console.log(userData);
                    connection.userId=userId;
                    connection.username=username;
                })
            }
        }
    }

    connection.on('message', async(message)=>{
        // console.log(message.toString());
        const messageData= JSON.parse(message.toString());
        // console.log(messageData);
        const {recipient, text}=messageData;
        if (recipient && text){
            const messageDoc= await Message.create({
                sender: connection.userId,
                recipient,
                text,
            });
            [...wss.clients]
            .filter(c=> c.userId===recipient)
            .forEach(c=>c.send(JSON.stringify({
                text,
                sender:connection.userId,
                recipient,
                _id:messageDoc._id,
            })));
        }
    });

    // console.log([...wss.clients].map(c=>c.username));
    notifyAboutOnlinePeople();
    // connection.on('disconnect', async(message)=>{
    //     notifyAboutOnlinePeople();
    // })
    connection.on('close', (data)=>{
        // connection.terminate();
        notifyAboutOnlinePeople();
    })
});



