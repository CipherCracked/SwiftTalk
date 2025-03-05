import Contact from "./Contact"
import { useState } from "react";
export default function UserList({ourId, onlinePeopleExcludingOurUser, onlinePeople, offlinePeople, selectedUserId, setSelectedUserId, contacts, setContacts}){
    const [searchQuery, setSearchQuery]=useState('');
    const [onlineSearched, setOnlineSearched]=useState({});
    const [offlineSearched, setOfflineSearched]=useState({});
    function searchContact(ev){
        ev.preventDefault();
        const offlineSearch={};
        const onlineSearch={};
        Object.keys(onlinePeopleExcludingOurUser).forEach(p=>{
            if (searchQuery.toLowerCase()===onlinePeopleExcludingOurUser[p].username.toLowerCase()) onlineSearch[p]=onlinePeopleExcludingOurUser[p];
        })
        setOnlineSearched(onlineSearch);
        Object.keys(offlinePeople).forEach(p=>{
            if (searchQuery.toLowerCase()===offlinePeople[p].username.toLowerCase()) offlineSearch[p]=offlinePeople[p];
        })
        setOfflineSearched(offlineSearch);
    }
    return(
        <div>
            <form className="flex flex-grow gap-2 p-4" onSubmit={searchContact}>
                <input type="text"
                    value={searchQuery}
                    onChange={ev => setSearchQuery(ev.target.value)}
                    placeholder="Search User"
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
                                ourId={ourId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={onlinePeople[userId]}
                                online={true}
                                btn='addContact'
                                contacts={contacts}
                                setContacts={setContacts}
                            />
                        ))}
                        {Object.keys(offlineSearched).map(userId => (
                            <Contact
                                key={userId}
                                ourId={ourId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={offlinePeople[userId].username}
                                online={false}
                                btn='addContact'
                                contacts={contacts}
                                setContacts={setContacts}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        {Object.keys(onlinePeopleExcludingOurUser).map(userId => (
                            <Contact
                                key={userId}
                                ourId={ourId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={onlinePeople[userId]}
                                online={true}
                                btn='addContact'
                                contacts={contacts}
                                setContacts={setContacts}
                            />
                        ))}
                        {Object.keys(offlinePeople).map(userId => (
                            <Contact
                                key={userId}
                                ourId={ourId}
                                id={userId}
                                selected={userId === selectedUserId}
                                onClick={() => setSelectedUserId(userId)}
                                username={offlinePeople[userId].username}
                                online={false}
                                btn='addContact'
                                contacts={contacts}
                                setContacts={setContacts}
                            />
                        ))}
                    </>
                )
            }
        </div>
    )
}