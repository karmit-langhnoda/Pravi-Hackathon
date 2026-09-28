import * as projectService from '../services/projectService.js';

export const listProjects = async (req, res, next) => {
  try { res.json({ data: await projectService.listProjects(req.query) }); }
  catch (e) { next(e); }
};

export const createProject = async (req, res, next) => {
  try { res.status(201).json({ data: await projectService.createProject(req.body, req.user) }); }
  catch (e) { next(e); }
};

export const getProjectById = async (req, res, next) => {
  try { res.json({ data: await projectService.getProjectById(req.params.id) }); }
  catch (e) { next(e); }
};

export const updateProject = async (req, res, next) => {
  try { res.json({ data: await projectService.updateProject(req.params.id, req.body) }); }
  catch (e) { next(e); }
};

export const deleteProject = async (req, res, next) => {
  try { res.json(await projectService.deleteProject(req.params.id)); }
  catch (e) { next(e); }
};
