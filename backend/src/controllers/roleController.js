import * as roleService from '../services/roleService.js';

export const listRoles = async (req, res, next) => {
  try {
    const roles = await roleService.listRoles();
    res.json({ data: roles });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    res.json({ data: role });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.user._id);
    res.status(201).json({ data: role });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body, req.user._id);
    res.json({ data: role });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteRole(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
