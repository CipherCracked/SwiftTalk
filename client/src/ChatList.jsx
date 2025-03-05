import Contact from "./Contact"
import { useContext, useEffect, useState } from "react";
export default function ChatList({onlinePeople, offlinePeople, selectedUserId, setSelectedUserId, onlineChats, offlineChats}){
    const [searchQuery, setSearchQuery]=useState('');
    const [onlineSearched, setOnlineSearched]=useState({});
    const [offlineSearched, setOfflineSearched]=useState({});
    
    function searchContact(ev){
        ev.preventDefault();
        const offlineSearch={};
        const onlineSearch={};
        Object.keys(onlineChats).forEach(p=>{
            if (searchQuery.toLowerCase()===onlineChats[p].username.toLowerCase()) onlineSearch[p]=onlineChats[p];
        })
        setOnlineSearched(onlineSearch);
        Object.keys(offlineChats).forEach(p=>{
            if (searchQuery.toLowerCase()===offlineChats[p].username.toLowerCase()) offlineSearch[p]=offlineChats[p];
        })
        setOfflineSearched(offlineSearch);
    }
    return(
        <div className="flex flex-col">
            <form className="flex gap-2 p-2" onSubmit={searchContact}>
                <input type="text"
                    value={searchQuery}
                    onChange={ev => setSearchQuery(ev.target.value)}
                    placeholder="Search Chat"
                    className="bg-white flex-grow border p-2 rounded-sm" />
                <button type="submit" className="bg-gradient-to-br from-purple-700 to-pink-700 p-2 text-white rounded-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                        <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
                    </svg>
                </button>
            </form>
            {
                searchQuery !== '' ? (
                    <>
                        {Object.keys(onlineSearched).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={onlinePeople[userId]}
                                online={true}
                            />
                        ))}
                        {Object.keys(offlineSearched).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={offlinePeople[userId].username}
                                online={false}
                            />
                        ))}
                        {(Object.keys(onlineSearched).length===0 && Object.keys(offlineSearched).length===0)?
                            <div className="items-center justify-center bold flex flex-grow h-full">No Chats Found</div>:<></>
                        }
                    </>
                ) : (
                    <>
                        {Object.keys(onlineChats).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={onlinePeople[userId]}
                                online={true}
                            />
                        ))}
                        {Object.keys(offlineChats).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={offlinePeople[userId].username}
                                online={false}
                            />
                        ))}
                        {(Object.keys(onlineChats).length===0 && Object.keys(offlineChats).length===0)?
                            <div className="items-center justify-center flex-grow h-full flex bold">
                                You Currently Have No Active Chats
                            </div>:<></>
                        }
                    </>
                )
            }
        </div>
    )
}