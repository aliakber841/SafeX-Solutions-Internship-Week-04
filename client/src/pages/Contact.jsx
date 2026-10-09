import React, { useState } from "react";
import { postJson, readError } from "../api.js";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsError(false);
    setStatus("Sending...");

    try {
      const result = await postJson("/api/contact", { name: name, email: email, message: message });

      if (result.ok) {
        setStatus(result.data.message);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setIsError(true);
        setStatus(readError(result.data));
      }
    } catch (err) {
      setIsError(true);
      setStatus("Could not reach the server");
    }
  }

  return (
    <div>
      <h2>Contact Us</h2>
      <p>Tell us about your project and we will reply within two working days.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Message
          <textarea rows="5" value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} />
        </label>

        <button type="submit" className="button">
          Send message
        </button>
      </form>

      {status && <p className={isError ? "error" : "status"}>{status}</p>}
    </div>
  );
}

export default Contact;
