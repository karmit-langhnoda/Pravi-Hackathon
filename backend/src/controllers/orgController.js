import * as orgService from '../services/orgService.js';

// ==================== DEPARTMENTS ====================

export const listDepartments = async (req, res, next) => {
  try {
    const departments = await orgService.listDepartments();
    res.json({ data: departments });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentTree = async (req, res, next) => {
  try {
    const tree = await orgService.getDepartmentTree();
    res.json({ data: tree });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const dept = await orgService.getDepartmentById(req.params.id);
    res.json({ data: dept });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const dept = await orgService.createDepartment(req.body, req.user._id);
    res.status(201).json({ data: dept });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await orgService.updateDepartment(req.params.id, req.body, req.user._id);
    res.json({ data: dept });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const result = await orgService.deleteDepartment(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== LOCATIONS ====================

export const listLocations = async (req, res, next) => {
  try {
    const locations = await orgService.listLocations();
    res.json({ data: locations });
  } catch (error) {
    next(error);
  }
};

export const getLocationTree = async (req, res, next) => {
  try {
    const tree = await orgService.getLocationTree();
    res.json({ data: tree });
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const location = await orgService.getLocationById(req.params.id);
    res.json({ data: location });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const location = await orgService.createLocation(req.body, req.user._id);
    res.status(201).json({ data: location });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const location = await orgService.updateLocation(req.params.id, req.body, req.user._id);
    res.json({ data: location });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const result = await orgService.deleteLocation(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
