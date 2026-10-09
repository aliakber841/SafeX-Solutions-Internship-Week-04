import React, { useEffect, useState } from "react";

function Gallery() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Server returned an error");
        }
        return res.json();
      })
      .then((data) => setProjects(data))
      .catch(() => setError("Could not load projects"));
  }, []);

  return (
    <div>
      <h2>Our Projects</h2>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {projects.map((project) => (
          <div className="project" key={project._id}>
            <div className="project-picture">{project.category}</div>
            <h3>{project.title}</h3>
            <p className="small">
              {project.location} · {project.year}
            </p>
            <p>{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gallery;
