import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Gallery from "./pages/Gallery.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import { postJson } from "./api.js";

function App() {
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  // On page load, ask the server if we are already logged in.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data) {
          setAdminEmail(data.email);
        }
      });
  }, []);

  async function handleLogout() {
    await postJson("/api/auth/logout", {});
    setAdminEmail("");
    navigate("/");
  }

  return (
    <div>
      <header className="header">
        <h1 className="logo">Ansari &amp; Sons Architects</h1>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/contact">Contact</Link>
          {adminEmail ? (
            <>
              <Link to="/admin">Messages</Link>
              <button className="link-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Admin login</Link>
          )}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login onLogin={setAdminEmail} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>Family-owned architecture studio. Three generations of building homes, schools and workplaces.</p>
      </footer>
    </div>
  );
}

export default App;
