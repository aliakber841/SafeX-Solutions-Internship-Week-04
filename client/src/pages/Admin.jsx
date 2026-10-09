import React, { useEffect, useState } from "react";

function Admin() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Please log in to see messages");
        }
        return res.json();
      })
      .then((data) => setMessages(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h2>Messages from visitors</h2>
      {error && <p className="error">{error}</p>}

      {messages.length === 0 && !error && <p>No messages yet.</p>}

      {messages.map((m) => (
        <div className="message" key={m._id}>
          <strong>{m.name}</strong> <span className="small">({m.email})</span>
          <p>{m.message}</p>
          <p className="small">{new Date(m.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default Admin;
