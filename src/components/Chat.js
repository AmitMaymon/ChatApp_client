import React, { useEffect, useRef, useState } from 'react';
import './Chat.css'


/**
 * Represents the Chat component.
 * @param {Object} props - The props object.
 * @returns {JSX.Element} The JSX element representing the Chat component.
 */
function Chat(props) {
    const [rooms, setRooms] = useState([])
    const [users, setUsers] = useState([])
    const [createRoomName, setCreateRoomName] = useState('')
    const [currentChannel, setCurrentChannel] = useState(null)
    const [autoScroll, setAutoScroll] = useState(true)
    const [newMessageCounts, setNewMessageCounts] = useState({})
    const [channelMessages, setChannelMessages] = useState([])
    const [message, setMessage] = useState('')
    const currentChatRef = useRef(null)
    const usersToDm = useRef({})
    const isDm = useRef(false);



    const messagesEndRef = useRef(null)


    useEffect(() => {
        props.socket.emit('GET_ROOMS', (rooms) => { setRooms(rooms) });
        props.socket.emit('GET_USERS', (users) => { setUsers(users) });
        props.socket.emit('GET_MESSAGES', { room_id: currentChannel }, (messages) => { setChannelMessages(messages) });
        setCurrentChannel('fbe0edd3-ce62-49e0-b942-0c451dd5d0cd')
        currentChatRef.current = 'fbe0edd3-ce62-49e0-b942-0c451dd5d0cd';
        handleSwitchChannel({ room_id: currentChannel })

    }, []);

    useEffect(() => {
        props.socket.on('NEW_USER', (usrs) => {
            props.socket.emit('GET_USERS', (users) => { setUsers(users) });


        });


    }, []);


    useEffect(() => {
        props.socket.on('DISCONNECT', (user_id) => {
            if (usersToDm.current[user_id] == currentChatRef.current) {
                setCurrentChannel('fbe0edd3-ce62-49e0-b942-0c451dd5d0cd')
                currentChatRef.current = 'fbe0edd3-ce62-49e0-b942-0c451dd5d0cd';
                props.socket.emit('GET_MESSAGES', { room_id: 'fbe0edd3-ce62-49e0-b942-0c451dd5d0cd' }, (messages) => { setChannelMessages(messages) });
            }
        });




    }, []);

    useEffect(() => {
        props.socket.on('NEW_MESSAGE', (data) => {
            if (data.room_id === currentChannel) {
                setChannelMessages([...channelMessages, data])
            }
        });
        if (autoScroll) {

            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [channelMessages]);

    useEffect(() => {
        props.socket.on('NEW_ROOM', (room) => {
            setRooms([...rooms, room])
        });
    }, [rooms]);

    useEffect(() => {
        props.socket.on('NOTIFICATION', (data) => {
            console.log('Notification', data);
            if (data.user_id !== props.user.user_id && (data.room_id !== currentChannel || data.isDm)) {
                setNewMessageCounts(prevCounts => ({
                    ...prevCounts,
                    [data.room_id]: (prevCounts[data.room_id] || 0) + 1,
                }));
            }
        });

        return () => {
            props.socket.off('NOTIFICATION');
        }
    }, [currentChannel, props.user.user_id]);


    useEffect(() => {
        props.socket.on('CREATE_DM', (data) => {
            console.log('DM Created', data);
            usersToDm.current[data.users.find(u => u !== props.user.user_id)] = data.dm_id;
            setNewMessageCounts(prevCounts => ({
                ...prevCounts,
                [data.dm_id]: (prevCounts[data.dm_id] || 0),
            }));
        });

    }, [])

    /**
     * Handles the creation of a new chat room.
     */
    const handleCreateRoom = () => {
        props.socket.emit('CREATE_ROOM', { room_name: createRoomName });
        props.socket.emit('GET_ROOMS', (rooms) => { setRooms(rooms) });

    }

    /**
     * Handles the send event when the user presses the Enter key.
     * Emits a 'SEND_MESSAGE' event to the socket with the message, room ID, username, user ID, and isDM flag.
     * Clears the message input field and emits a 'NOTIFICATION' event to the socket.
     *
     * @param {Event} e - The keydown event object.
     */
    const handleSend = (e) => {
        if (e.key === 'Enter') {
            props.socket.emit('SEND_MESSAGE', {
                message: message,
                room_id: currentChannel,
                username: props.user.username,
                user_id: props.user.user_id,
                isDm: isDm.current
            });
            setMessage('')
            e.target.value = ''
            props.socket.emit('NOTIFICATION', { room_id: currentChannel, user_id: props.user.user_id, isDm: isDm.current })
        }
    }

    const getCurrentRoomStyle = (room_id) => {
        if (room_id === currentChannel) {
            return { backgroundColor: 'lightblue', cursor: 'pointer' }
        } else {
            return { cursor: 'pointer' }
        }
    }

    /**
     * Handles the switching of channels in the chat.
     * 
     * @param {Object} room - The room object representing the channel to switch to.
     */
    const handleSwitchChannel = (room) => {
        setCurrentChannel(room.room_id)
        currentChatRef.current = room.room_id;
        isDm.current = false;
        setNewMessageCounts(prevCounts => ({
            ...prevCounts,
            [room.room_id]: 0,
        }));
        props.socket.emit('SWITCH_ROOM', { room_id: room.room_id })
        props.socket.emit('GET_MESSAGES', { room_id: room.room_id, isDm: isDm.current }, (messages) => { setChannelMessages(messages) });

    }

    /**
     * Callback function for handling direct message (DM) events.
     * @param {Object} data - The data received from the DM event.
     */

    const dmCallback = (data) => {
        setCurrentChannel(data.dm_id)
        currentChatRef.current = data.dm_id;
        props.socket.emit('SWITCH_ROOM', { room_id: data.dm_id })
        props.socket.emit('GET_MESSAGES', { room_id: data.dm_id, isDm: isDm.current }, (messages) => { setChannelMessages(messages) });

        //adds the new DM to the mapping
        data.users.forEach(user_id => {
            usersToDm.current[user_id] = data.dm_id;
        });
    }

    /**
     * Handles the action of creating a direct message (DM) with a user.
     * 
     * @param {Object} user - The user object representing the user to create a DM with.
     */
    
    const handleDms = (user) => {

        if (props.user.user_id === user.user_id) return;

        isDm.current = true;
        props.socket.emit('CREATE_DM', { users: [props.user.user_id, user.user_id] }, dmCallback)
        setNewMessageCounts(prevCounts => ({
            ...prevCounts,
            [usersToDm.current[user.user_id]]: 0,
        }));
    }

    const getDmStyle = (user) => {
        if (props.user.user_id === user.user_id) {
            return { cursor: 'default' }
        }
        if (usersToDm.current[user.user_id] === currentChannel && user.user_id !== props.user.user_id) {
            return { backgroundColor: 'lightblue', cursor: 'pointer' }
        } else {
            return { cursor: 'pointer' }
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        props.setLoggedOut(true)
        props.setLoggedIn(false);
        props.socket.disconnect();
    }





    return (
        <div>
            <div className="side-panel">
                <h2>Rooms</h2>
                {rooms.map((room, index) => {
                    return <div key={index} onClick={() => { handleSwitchChannel(room) }} style={getCurrentRoomStyle(room.room_id)}>{room.room_name} {newMessageCounts[room.room_id] > 0 ? `(${newMessageCounts[room.room_id]} new)` : ""}</div>
                })}
                <br />
                <input type="text" onChange={(e) => { setCreateRoomName(e.target.value) }} />
                <button onClick={handleCreateRoom}>Create Room</button>
                <br /><br />
                <h2>Users</h2>
                {users.map((user, index) => {
                    return <div onClick={(e) => { handleDms(user) }} style={getDmStyle(user)} key={index}>{user.username} {user.user_id == props.user.user_id ? "(Me)" : ""} {user.user_id !== props.user.user_id && newMessageCounts[usersToDm.current[user.user_id]] > 0 ? `(${newMessageCounts[usersToDm.current[user.user_id]]} new)` : ""}</div>
                })}
                <br /> <br /><br />
                <h2>Settings</h2>
                <div>
                    <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                    <label>Auto-scroll on new messages</label>
                    <button onClick={handleLogout}>Logout</button>
                </div>

            </div>
            <div className="chat-area">

                <div className="chat-window" style={{ border: 'black solid 1px' }}>

                    {channelMessages.map((message, index) => {
                        return <div key={index} style={{ clear: 'both' }}>
                            <div style={message.user_id == props.user.user_id ? { float: 'right', color: 'blue' } : {}} >{message.username}:{message.message}</div>
                        </div>
                    })}
                    <div ref={messagesEndRef} />
                </div>


                <input className='message-input' type="text" onKeyDown={handleSend} onChange={(e) => { setMessage(e.target.value) }} />

            </div>




        </div>
    );
}

export default Chat;