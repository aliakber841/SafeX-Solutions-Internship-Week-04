import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await res.json();

    if (res.ok) {
      props.onLogin(data.email);
      navigate("/admin");
    } else {
      setError(data.error);
    }
  }

  return (
    <div>
      <h2>Admin Login</h2>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
