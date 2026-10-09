import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJson, readError } from "../api.js";

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const result = await postJson("/api/auth/login", { email: email, password: password });

      if (result.ok) {
        props.onLogin(result.data.email);
        navigate("/admin");
      } else {
        setError(readError(result.data));
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  return (
    <div>
      <h2>Admin Login</h2>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" value={password} maxLength={128} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button type="submit" className="button">
          Log in
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;
