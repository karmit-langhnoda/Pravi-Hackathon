import { Project } from '../models/Project.js';
import { Asset } from '../models/Asset.js';

export const listProjects = async (query = {}) => {
  const projects = await Project.find(query).populate('manager', 'name email').sort('-createdAt').lean();
  const projectIds = projects.map(p => p._id);
  const counts = await Asset.aggregate([
    { $match: { project: { $in: projectIds }, isArchived: { $ne: true } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map(c => [String(c._id), c.count]));
  return projects.map(p => ({
    ...p,
    assetCount: countMap[String(p._id)] || 0,
  }));
};

export const createProject = async (data, user) => {
  const project = new Project({
    ...data,
    createdBy: user._id,
  });
  return project.save();
};

export const getProjectById = async (id) => {
  const project = await Project.findById(id).populate('manager', 'name email');
  if (!project) throw { status: 404, message: 'Project not found' };
  
  // get assets for this project
  const assets = await Asset.find({ project: id, isArchived: { $ne: true } })
    .populate('assetType', 'name code icon states')
    .populate('location', 'name')
    .populate('department', 'name')
    .select('name assetTag status assetType location department warranty purchase createdAt');

  return { ...project.toObject(), assets };
};

export const updateProject = async (id, data) => {
  const project = await Project.findByIdAndUpdate(id, data, { new: true });
  if (!project) throw { status: 404, message: 'Project not found' };
  return project;
};

export const deleteProject = async (id) => {
  const assets = await Asset.countDocuments({ project: id });
  if (assets > 0) throw { status: 400, message: 'Cannot delete project with assigned assets' };
  
  const project = await Project.findByIdAndDelete(id);
  if (!project) throw { status: 404, message: 'Project not found' };
  return { success: true };
};
