import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <section className="hero">
        <h2>We design buildings that families can grow into.</h2>
        <p>
          For three generations our family has designed homes, schools, clinics and workplaces.
          We listen first, then draw.
        </p>
        <Link to="/contact" className="button">
          Start a conversation
        </Link>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Residential</h3>
          <p>Family homes that fit how you live, with good light and fresh air.</p>
        </div>
        <div className="card">
          <h3>Commercial</h3>
          <p>Shops, cafes and offices that are comfortable and cost less to run.</p>
        </div>
        <div className="card">
          <h3>Community</h3>
          <p>Schools and clinics built simply, strongly and on budget.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
