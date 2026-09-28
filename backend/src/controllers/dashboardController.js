import * as dashboardService from '../services/dashboardService.js';

export const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getByStatus = async (req, res, next) => {
  try {
    const data = await dashboardService.getByStatus(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getByType = async (req, res, next) => {
  try {
    const data = await dashboardService.getByType(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getByLocation = async (req, res, next) => {
  try {
    const data = await dashboardService.getByLocation(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getExpiringWarranties = async (req, res, next) => {
  try {
    const data = await dashboardService.getExpiringWarranties(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getOverdueReturns = async (req, res, next) => {
  try {
    const data = await dashboardService.getOverdueReturns(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingMaintenance = async (req, res, next) => {
  try {
    const data = await dashboardService.getUpcomingMaintenance();
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivity(req.user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
