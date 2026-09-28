import * as assetService from '../services/assetService.js';

export const listAssets = async (req, res, next) => {
  try { res.json(await assetService.listAssets(req.query, req.user)); }
  catch (e) { next(e); }
};

export const getAssetById = async (req, res, next) => {
  try { res.json({ data: await assetService.getAssetById(req.params.id, req.user) }); }
  catch (e) { next(e); }
};

export const getAssetByTag = async (req, res, next) => {
  try { res.json({ data: await assetService.getAssetByTag(req.params.tag, req.user) }); }
  catch (e) { next(e); }
};

export const createAsset = async (req, res, next) => {
  try { res.status(201).json({ data: await assetService.createAsset(req.body, req.user) }); }
  catch (e) { next(e); }
};

export const updateAsset = async (req, res, next) => {
  try { res.json({ data: await assetService.updateAsset(req.params.id, req.body, req.user) }); }
  catch (e) { next(e); }
};

export const archiveAsset = async (req, res, next) => {
  try { res.json({ data: await assetService.archiveAsset(req.params.id, req.user) }); }
  catch (e) { next(e); }
};

export const deleteAsset = async (req, res, next) => {
  try { res.json(await assetService.deleteAsset(req.params.id, req.user)); }
  catch (e) { next(e); }
};

export const changeStatus = async (req, res, next) => {
  try { res.json({ data: await assetService.changeAssetStatus(req.params.id, req.body, req.user) }); }
  catch (e) { next(e); }
};

export const getAssetHistory = async (req, res, next) => {
  try { res.json({ data: await assetService.getAssetHistory(req.params.id) }); }
  catch (e) { next(e); }
};

export const getAssetQR = async (req, res, next) => {
  try { res.json({ data: await assetService.getAssetQR(req.params.id) }); }
  catch (e) { next(e); }
};

export const getAssetChildren = async (req, res, next) => {
  try { res.json(await assetService.getAssetChildren(req.params.id, req.query, req.user)); }
  catch (e) { next(e); }
};

export const getContainerSummary = async (req, res, next) => {
  try { res.json({ data: await assetService.getContainerSummary(req.params.id) }); }
  catch (e) { next(e); }
};

export const setAssetParent = async (req, res, next) => {
  try { res.json({ data: await assetService.setAssetParent(req.params.id, req.body.parent, req.user) }); }
  catch (e) { next(e); }
};
