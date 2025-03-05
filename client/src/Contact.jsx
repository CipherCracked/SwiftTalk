import Avatar from "./Avatar"
import axios from "axios";
export default function Contact({id,ourId,selected, onClick, username, online, btn=null, contacts, setContacts}){
    function addContact(username) {
        if (contacts.includes(username)) {
            window.alert('Already a Contact');
        } else {
            axios.post('/addContact', { userId: ourId, username: username })
                .then(() => {
                    setContacts(prevContacts => [...prevContacts, username]);
                    window.alert('Successfully added Contact');
                })
                .catch(error => {
                    if (error.response && error.response.data) {
                        console.error('Error adding contact:', error.response.data);
                    } else {
                        console.error('Error adding contact: An unexpected error occurred.');
                    }
                });
        }
    }
    function deleteContact(username){
        const Index=contacts.indexOf(username)
        axios.post('/deleteContact', {userId: ourId, username: username})
        .then(()=>{
            setContacts(prevContacts=>{
                const newContacts = [...prevContacts];
                newContacts.splice(Index,1);
                return newContacts;
            });
            window.alert('Successfully deleted Contact');
        })
        .catch(error=>{
            if (error.response && error.response.data){
                console.error('Error deleting contact:', error.response.data);
            } 
            else {
                console.error('Error deleting contact: An unexpected error occurred.');
            }    
        })
    }
           
    return(
        <div key={id}
                    className={"flex gap-2 items-center cursor-pointer "+(selected?'bg-white':'')}>
                        {selected && (
                            <div className="w-1 bg-gradient-to-br from-purple-500 to-pink-500 h-12 rounded-r-md bold"></div>
                        )}
                        <div className="flex flex-grow gap-2 py-2 pl-4 items-center">
                            <div className="flex flex-grow gap-2" onClick={()=>onClick(id)}>
                                <Avatar online={online} username={username} userId={id}/>
                                <div className="bold flex-grow">{username}</div>
                            </div>
                            {btn === 'addContact' &&
                            <button className="mr-2 p-1 rounded-md bg-gradient-to-br from-purple-700 to-pink-700" onClick={()=>addContact(username)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-6 h-6">
                                    <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
                                </svg>                              
                            </button>}
                            {btn === 'deleteContact' &&
                            <button className="mr-2 p-1 rounded-md bg-gradient-to-br from-purple-700 to-pink-700" onClick={()=>deleteContact(username)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="w-6 h-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>  
                            </button>}
                        </div>
                    </div>
    )
}