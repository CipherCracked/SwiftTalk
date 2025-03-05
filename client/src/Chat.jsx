import { useEffect, useState, useContext, useRef } from "react"
import Logo from "./Logo";
import {UserContext} from './UserContext'
import {isNull, keys, result, uniqBy} from "lodash"
import axios from "axios";
import ChatList from "./ChatList";
import ContactList from "./ContactList";
import UserList from './UserList'
import Avatar from "./Avatar";

export default function Chat(){
    const [ws, setWs]=useState(null);
    const [onlinePeople, setOnlinePeople]=useState({});
    const [selectedUserId, setSelectedUserId]=useState(null);
    const {username, id, setId, setUsername}=useContext(UserContext);

    const [contacts, setContacts]=useState([]);
    const [chats, setChats]=useState([]);
    useEffect(() => {
        Promise.all([
            axios.post('/contacts', {id}),
            axios.post('/chats', {id})
        ]).then(([contactsResponse, chatsResponse]) => {
            setContacts(contactsResponse.data);
            const chatObj = chatsResponse.data;
            const chatsArray = Object.values(chatObj);
            setChats(chatsArray);
        }).catch(error => {
            console.error('Error fetching data:', error);
        });
    }, []);

    const [newMessageText, setNewMessageText]=useState('');
    const [messages, setMessages]=useState([]);
    const divUnderMessages=useRef();
    const [offlinePeople, setOfflinePeople]=useState({});
    
    const [svgStroke, setSvgStroke]=useState('white');
    const [svgId, setSvgId]=useState('');
    const [mode, setMode]=useState('chats');

    const [onlineChats, setOnlineChats]=useState({});
    const [offlineChats, setOfflineChats]=useState({});
    function getChats() {
        try {
            const online = {};
            const offline = {};
            chats.forEach(chat => {
                if (onlinePeopleExcludingOurUser[chat] !== undefined) {
                    online[chat] = onlinePeopleExcludingOurUser[chat];
                } else if (offlinePeople[chat] !== undefined) {
                    offline[chat] = offlinePeople[chat];
                }
            });
            setOnlineChats(online);
            setOfflineChats(offline);
        } catch (error) {
            console.error(error);
        }
    }
    
    useEffect(()=>{
        getChats();
        getContacts();
    },[onlinePeople]);

    const [offlineContacts, setOfflineContacts]=useState({});
    const [onlineContacts, setOnlineContacts]=useState({});
    function getContacts() {
        try {
            const online={};
            const offline={};
            Object.keys(onlinePeopleExcludingOurUser).forEach(p=>{
                if (contacts.indexOf(onlinePeopleExcludingOurUser[p].username)!==-1) online[p]=onlinePeopleExcludingOurUser[p];
            })
            Object.keys(offlinePeople).forEach(p=>{
                if (contacts.indexOf(offlinePeople[p].username)!==-1) offline[p]=offlinePeople[p];
            })
            setOnlineContacts(online);
            setOfflineContacts(offline);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(()=>{
        connectToWs();
    }, []);
    function connectToWs(){
        const ws=new WebSocket('ws://localhost:5000');
        setWs(ws);
        ws.addEventListener('message', handleMessage)
        ws.addEventListener('close', (id)=>{
            if (id){
                setTimeout(() => {
                    console.log('Disconnected. Trying to reconnect.');
                    connectToWs();
                },1000);   
            }
        });
    }

    function showOnlinePeople(peopleArray){
        const people={};
        peopleArray.forEach(({userId,username}) => {
            people[userId]=username;
        });
        setOnlinePeople(people);
    }

    function handleMessage(ev){
        const messageData=JSON.parse(ev.data);
        if ('online' in messageData){
            showOnlinePeople(messageData.online);
        }
        else if ('text' in messageData){
            const sender=messageData.sender;
            if (chats.indexOf(sender)===-1){
                setChats(prev=>([...prev,sender]))
            }
            setMessages(prev=>([...prev, {...messageData}]));
        }
    }

    function logout(){
        axios.post('/logout').then(()=>{
            setId(null);
            setUsername(null);
            setWs(null);
            setOnlinePeople({});
        });
    }

    function sendMessage(ev){
        ev.preventDefault();
        ws.send(JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
        }));
        if (chats.indexOf(selectedUserId)===-1){
            setChats(prev => {
                const updatedChats = [...prev, selectedUserId];
                return updatedChats;
            });
        }
        setMessages(prev=>([...prev,{
            text:newMessageText,
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
        setNewMessageText('');
    }
    useEffect(()=>{
        console.log(chats);
        getChats();
    }, [chats]);

    useEffect(()=>{
        console.log(contacts);
        getContacts();
    }, [contacts]);

    useEffect(() => {
        const div=divUnderMessages.current;
        if (div){
            div.scrollIntoView({behavior:'smooth', block:'end'});
        }
    }, [messages])

    useEffect(() => {
        axios.get('/people').then(res=>{
            const offlinePeopleArr=res.data
            
            .filter(p=>p._id!==id)
            .filter(p=>!Object.keys(onlinePeople).includes(p._id));
            const offlinePeople={};
            offlinePeopleArr.forEach(p=>{
                offlinePeople[p._id]=p;
            })
            setOfflinePeople(offlinePeople);
        });
    }, [onlinePeople])

    useEffect(() => {
        if (selectedUserId){
            axios.get('/messages/'+selectedUserId).then(res=>{
                setMessages(res.data);

            })
        }
    }, [selectedUserId])
    
    const onlinePeopleExcludingOurUser={...onlinePeople};
    delete onlinePeopleExcludingOurUser[id];
    const messagesWithoutDupes =uniqBy(messages, '_id');
    return(
        <div className="flex h-screen">
            <div className="w-1/3 flex">
                <div className="bg-black w-2/12 flex flex-col items-center">
                    <div className="py-12">
                        <button className="px-4 py-4 rounded-md hover:bg-white" onMouseOut={()=>setSvgStroke('white')} onMouseOver={()=>{setSvgStroke('black');setSvgId('contacts')}} onClick={()=>setMode('contacts')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke={svgId==='contacts'?svgStroke:"white"} class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                        </button>
                    </div>
                    <div className="py-12">
                        <button className="px-4 py-4 rounded-md hover:bg-white" onMouseOut={()=>setSvgStroke('white')} onMouseOver={()=>{setSvgStroke('black');setSvgId('chats')}} onClick={()=>setMode('chats')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke={svgId==='chats'?svgStroke:"white"} class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        </button>
                    </div>
                    <div className="py-12">
                        <button className="px-4 py-4 rounded-md hover:bg-white" onMouseOut={()=>setSvgStroke('white')} onMouseOver={()=>{setSvgStroke('black');setSvgId('search')}} onClick={()=>setMode('search')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke={svgId==='search'?svgStroke:'white'} class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </button>
                    </div>
                    <div className="py-12">
                        <button className="px-4 py-4 rounded-md hover:bg-white" onMouseOut={()=>{setSvgStroke('white');}} onMouseOver={()=>{setSvgStroke('black');setSvgId('logout')}} onClick={logout}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke={svgId==='logout'?svgStroke:'white'} class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 w-10/12 flex flex-col">
                    <div className="flex-grow">
                        <Logo />
                        {mode=='chats' && 
                            <ChatList
                            onlinePeopleExcludingOurUser={onlinePeopleExcludingOurUser}
                            onlinePeople={onlinePeople}
                            offlinePeople={offlinePeople}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            id={id}
                            chats={chats}
                            setChats={setChats}
                            onlineChats={onlineChats}
                            offlineChats={offlineChats}
                            />                        
                        }
                        {mode=='contacts' && 
                            <ContactList
                            ourId={id}
                            onlinePeopleExcludingOurUser={onlinePeopleExcludingOurUser}
                            onlinePeople={onlinePeople}
                            offlinePeople={offlinePeople}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            id={id}
                            contacts={contacts}
                            setContacts={setContacts}
                            onlineContacts={onlineContacts}
                            offlineContacts={offlineContacts}/>
                        }
                        {mode =='search' &&
                            <UserList
                            ourId={id}
                            onlinePeopleExcludingOurUser={onlinePeopleExcludingOurUser}
                            onlinePeople={onlinePeople}
                            offlinePeople={offlinePeople}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            contacts={contacts}
                            setContacts={setContacts}/>
                        }

                    </div>
                    <div className="p-2 text-center flex items-center justify-center">
                        <span className="mr-2 text-sm text-black bold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                                <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                            </svg>

                            {username}
                        </span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-300 w-2/3 flex flex-col">
                {!!selectedUserId && 
                    <div className="bg-black bold items-center cursor-pointer p-2 rounded-sm flex gap-2">
                        {Object.keys(offlinePeople).includes(selectedUserId) &&<Avatar online={false} userId={selectedUserId} username={offlinePeople[selectedUserId].username}/>}
                        {Object.keys(onlinePeople).includes(selectedUserId) && <Avatar online={true} userId={selectedUserId} username={onlinePeople[selectedUserId]}/>}
                        <div className="text-white">{Object.keys(offlinePeople).includes(selectedUserId)?offlinePeople[selectedUserId].username:onlinePeople[selectedUserId]}</div>
                    </div>
                }
                <div className="flex-grow p-2">
                    {!selectedUserId && (
                        <div className="flex h-full items-center justify-center">
                            <div className="bold">&larr; Select a person from the sidebar</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender) === id ? 'text-right' : 'text-left'}>
                                        <div className={"text-left inline-block p-2 m-2 rounded-md text-sm " + (message.sender === id ? 'bg-gradient-to-br from-purple-700 to-pink-700 text-white' : 'bg-white text-gray-500')}>
                                            {/* sender: {message.sender} <br />
            my id: {id} <br /> */}
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2 p-2" onSubmit={sendMessage}>
                        <input type="text"
                            value={newMessageText}
                            onChange={ev => setNewMessageText(ev.target.value)}
                            placeholder="Type your message here"
                            className="bg-white flex-grow border p-2 rounded-sm" />
                        <button type="submit" className="bg-gradient-to-br from-purple-700 to-pink-700 p-2 text-white rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}