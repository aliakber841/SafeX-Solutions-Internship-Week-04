import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";

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
    const idIsValid = mongoose.isValidObjectId(req.params.id);

    if (!idIsValid) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
});

export default router;
