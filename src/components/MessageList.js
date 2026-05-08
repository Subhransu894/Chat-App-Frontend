import React from "react";

const MessageList = ({ messages, user }) => {
  console.log(messages);
   //chat date or day like whatsapp
  const getDateLabel = (date)=>{
    const msgDate = new Date(date)
    const today = new Date()
    const yesterday = new Date()

    yesterday.setDate(today.getDate() - 1);

    //remove time for accurate compare
    const isToday = msgDate.toDateString() === today.toDateString()
    const isYesterday = msgDate.toDateString() === yesterday.toDateString()

    if (isToday) return "Today"
    if (isYesterday) return "Yesterday"

    return msgDate.toLocaleDateString("en-IN",{
      day:"numeric",
      month:"long",
      year:"numeric"
    })
  }
  let lastDate = ""
  return (
    <div className="message-list">
      {messages.map((msg, index) => {
        const label = getDateLabel(msg.createdAt)
        const showDate = label !== lastDate
        lastDate = label

        return (
          <div key={index}>
            {/* DATE LABEL */}
            {showDate && (
              <div style={{textAlign:"center", margin:"10px 0"}}>
                <span>{label}</span>
              </div>
            )}
              <div
              className={`message ${
                msg.sender === user.username ? "sent" : "received"
              }`}
            >
              
              <strong>{msg.sender}: </strong>
              {msg.message}

              {/* read receipt here */}
              {msg.sender === user.username && (
                <span style={{marginLeft:"5px"}}>
                  {msg.status === "read" ?"✓✓": "✓"}
                </span>
              )}
              {/* time stamp */}
              <small style={{marginLeft:"10px",color:"gray"}}>
                {new Date(msg.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:true})}
              </small>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default MessageList;
