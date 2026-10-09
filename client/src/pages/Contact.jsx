import React, { useState } from "react";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Sending...");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, message: message }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus(data.message);
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setStatus("Something went wrong: " + data.error);
    }
  }

  return (
    <div>
      <h2>Contact Us</h2>
      <p>Tell us about your project and we will reply within two working days.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Message
          <textarea rows="5" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>

        <button type="submit" className="button">
          Send message
        </button>
      </form>

      {status && <p className="status">{status}</p>}
    </div>
  );
}

export default Contact;
