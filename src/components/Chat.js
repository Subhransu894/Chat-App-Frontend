import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";

const socket = io("https://chat-app-backend-omega-lovat.vercel.app");

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping,setIsTyping] = useState(false)
  const [showEmoji,setShowEmoji] = useState(false)

  //check only
  useEffect(()=>{
    console.log("Socket Connected",socket.id)
  },[])

  //Register first
  useEffect(()=>{
    if(socket && user?.username){
      socket.emit("register",user.username.toLowerCase())
    }
  },[user.username])
  // receive meassages
  useEffect(() => {
    // Fetch all users excluding the current user
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("https://chat-app-backend-omega-lovat.vercel.app/users", {
          params: { currentUser: user.username },
        });
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };

    fetchUsers();

    // Listen for incoming messages or define handler
    const handleMessage = async(data)=>{
      if((data.sender === user.username && data.receiver === currentChat) || (data.sender === currentChat && data.receiver === user.username)){
        setMessages((prev)=>[...prev,data])

        // mark as read if chat is open
        if( data.sender === currentChat ){
          try {
            await axios.put("https://chat-app-backend-omega-lovat.vercel.app/messages/read",{
              sender:currentChat,
              receiver: user.username
            })
          } catch (error) {
            console.error(error)
          }
        }
      }
    }
    
    //add new listener
    socket.on("receive_message",handleMessage)
    return ()=>{
      socket.off("receive_message",handleMessage)
    } 
  }, [currentChat,user.username]);

  //read messages
  useEffect(() => {
    const handleRead = ({ sender, receiver }) => {
      if (sender === user.username && receiver === currentChat) {
        setMessages((prev) =>
          prev.map((msg) =>
            // update only messages that this client sent to that receiver
            msg.sender === user.username && msg.receiver === receiver && msg.status !== "read"
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }
    };

    socket.on("messages_read", handleRead);
    return () => socket.off("messages_read", handleRead);
  }, [currentChat, user.username]);

  const fetchMessages = async (receiver) => {
    try {
      //fetch updated messages
      const { data } = await axios.get("https://chat-app-backend-omega-lovat.vercel.app/messages", {
        params: { sender: user.username, receiver },
      });

      setMessages(data);
      setCurrentChat(receiver);

      //mark as read
      await axios.put("https://chat-app-backend-omega-lovat.vercel.app/messages/read",{
          sender: receiver,
          receiver: user.username,
      })
      //fetch again
      const updated = await axios.get("https://chat-app-backend-omega-lovat.vercel.app/messages",{
         params:{ sender: user.username, receiver}
      })
      setMessages(updated.data)
      
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const sendMessage = () => {
    const messageData = {
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
    };
    socket.emit("send_message", messageData);
    setCurrentMessage("");
  };

  //listen for typing
  useEffect(()=>{
    socket.on("typing",(data)=>{
      if(data.sender === currentChat){
        setIsTyping(true)
        setTimeout(()=>{
            setIsTyping(false)
        },2000)
      }
    })
    return ()=>{
      socket.off("typing")
    }
  })

  //emoji picker
  const handleEmoji =(emojiData)=>{
    setCurrentMessage(prev=> prev + emojiData.emoji)
  }

  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>
      <div className="chat-list">
        <h3>Chats</h3>
        {users.map((u) => (
          <div
            key={u._id}
            className={`chat-user ${
              currentChat === u.username ? "active" : ""
            }`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
          </div>
        ))}
      </div>
      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>
          <MessageList messages={messages} user={user} />
          {isTyping && <p>{currentChat} is Typing...</p>}
          <div className="message-field">
            {/* emoji picker */}
            <button onClick={()=>setShowEmoji(prev => ! prev)}>
              😁
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              style={{ minWidth: "400px" }}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                socket.emit("typing",{sender: user.username,receiver:currentChat})}
              }
            />
            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
            {/* emoji picker */}
            {showEmoji && (
              <div style={{position:"absolute",bottom:"50px",left:"0"}}>
                <EmojiPicker onEmojiClick={handleEmoji}/>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
