const express = require("express");
const Project = require("../models/Project");

const router = express.Router();

// GET /api/projects  -> list of all projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id  -> one project
router.get("/:id", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
