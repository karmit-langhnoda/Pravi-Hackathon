import * as assetTypeService from '../services/assetTypeService.js';

export const listAssetTypes = async (req, res, next) => {
  try {
    const types = await assetTypeService.listAssetTypes(req.query);
    res.json({ data: types });
  } catch (error) {
    next(error);
  }
};

export const getAssetTypeById = async (req, res, next) => {
  try {
    const type = await assetTypeService.getAssetTypeById(req.params.id);
    res.json({ data: type });
  } catch (error) {
    next(error);
  }
};

export const getFormSchema = async (req, res, next) => {
  try {
    const schema = await assetTypeService.getFormSchema(req.params.id);
    res.json({ data: schema });
  } catch (error) {
    next(error);
  }
};

export const getAllowedChildren = async (req, res, next) => {
  try {
    const children = await assetTypeService.getAllowedChildren(req.params.id);
    res.json({ data: children });
  } catch (error) {
    next(error);
  }
};

export const getImportTemplate = async (req, res, next) => {
  try {
    const template = await assetTypeService.getImportTemplate(req.params.id);
    res.json({ data: template });
  } catch (error) {
    next(error);
  }
};

export const createAssetType = async (req, res, next) => {
  try {
    const type = await assetTypeService.createAssetType(req.body, req.user._id);
    res.status(201).json({ data: type });
  } catch (error) {
    next(error);
  }
};

export const updateAssetType = async (req, res, next) => {
  try {
    const type = await assetTypeService.updateAssetType(req.params.id, req.body, req.user._id);
    res.json({ data: type });
  } catch (error) {
    next(error);
  }
};

export const deactivateAssetType = async (req, res, next) => {
  try {
    const type = await assetTypeService.deactivateAssetType(req.params.id, req.user._id);
    res.json({ data: type });
  } catch (error) {
    next(error);
  }
};
