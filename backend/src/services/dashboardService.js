import { Asset } from '../models/Asset.js';
import { Request } from '../models/Request.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { LifecycleEvent } from '../models/LifecycleEvent.js';
import { buildAssetFilter } from '../helpers/assetHelpers.js';

export const getSummary = async (user) => {
  const baseFilter = buildAssetFilter(user);
  const [totalAssets, archivedCount, assignedCount, projectAssetsCount, freeAssetsCount] = await Promise.all([
    Asset.countDocuments({ ...baseFilter }),
    Asset.countDocuments({ ...baseFilter, isArchived: true }),
    Asset.countDocuments({
      ...baseFilter,
      $or: [
        { 'assignment.user': { $exists: true, $ne: null } },
        { project: { $exists: true, $ne: null } }
      ]
    }),
    Asset.countDocuments({ ...baseFilter, project: { $exists: true, $ne: null } }),
    Asset.countDocuments({
      ...baseFilter,
      $or: [
        { project: null },
        { project: { $exists: false } }
      ]
    }),
  ]);
  return { totalAssets, archivedCount, assignedCount, projectAssetsCount, freeAssetsCount };
};

export const getByStatus = async (user) => {
  const baseFilter = buildAssetFilter(user);
  return Asset.aggregate([
    { $match: baseFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

export const getByType = async (user) => {
  const baseFilter = buildAssetFilter(user);
  return Asset.aggregate([
    { $match: baseFilter },
    {
      $lookup: {
        from: 'assettypes',
        localField: 'assetType',
        foreignField: '_id',
        as: 'typeDoc',
      },
    },
    { $unwind: '$typeDoc' },
    {
      $group: {
        _id: '$assetType',
        name: { $first: '$typeDoc.name' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
};

export const getByLocation = async (user) => {
  const baseFilter = buildAssetFilter(user);
  return Asset.aggregate([
    { $match: { ...baseFilter, location: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: 'locations',
        localField: 'location',
        foreignField: '_id',
        as: 'locDoc',
      },
    },
    { $unwind: '$locDoc' },
    {
      $group: {
        _id: '$location',
        name: { $first: '$locDoc.name' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
};

export const getExpiringWarranties = async (user) => {
  const baseFilter = buildAssetFilter(user);
  const now = new Date();
  const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [in30Days, in60Days, in90Days] = await Promise.all([
    Asset.countDocuments({
      ...baseFilter,
      $or: [
        { 'warranty.end': { $gte: now, $lte: d30 } },
        { 'warranty.endDate': { $gte: now, $lte: d30 } },
      ],
    }),
    Asset.countDocuments({
      ...baseFilter,
      $or: [
        { 'warranty.end': { $gte: now, $lte: d60 } },
        { 'warranty.endDate': { $gte: now, $lte: d60 } },
      ],
    }),
    Asset.countDocuments({
      ...baseFilter,
      $or: [
        { 'warranty.end': { $gte: now, $lte: d90 } },
        { 'warranty.endDate': { $gte: now, $lte: d90 } },
      ],
    }),
  ]);

  const items = await Asset.find({
    ...baseFilter,
    $or: [
      { 'warranty.end': { $lte: d60 } },
      { 'warranty.endDate': { $lte: d60 } },
    ],
  })
    .select('name assetTag warranty status project')
    .populate('project', 'name')
    .sort({ 'warranty.end': 1, 'warranty.endDate': 1 })
    .limit(25)
    .lean();

  return { in30Days, in60Days, in90Days, items };
};

export const getOverdueReturns = async (user) => {
  const baseFilter = buildAssetFilter(user);
  return Asset.find({
    ...baseFilter,
    'assignment.dueAt': { $lt: new Date() },
  })
    .populate('assignment.user', 'name email')
    .limit(10)
    .lean();
};

export const getUpcomingMaintenance = async () => {
  return MaintenanceRecord.find({
    status: 'scheduled',
    scheduledDate: { $gte: new Date() },
  })
    .populate('asset', 'name assetTag')
    .sort('scheduledDate')
    .limit(10)
    .lean();
};

export const getRecentActivity = async (user) => {
  const baseFilter = buildAssetFilter(user);
  
  const recentAssets = await Asset.find(baseFilter).select('_id').lean();
  const assetIds = recentAssets.map((a) => a._id);

  return LifecycleEvent.find({ asset: { $in: assetIds } })
    .populate('asset', 'name assetTag')
    .populate('actor', 'name')
    .sort('-createdAt')
    .limit(20)
    .lean();
};

export const getMaintenanceStats = async (user) => {
  const baseFilter = buildAssetFilter(user);
  const assets = await Asset.find(baseFilter).select('_id').lean();
  const assetIds = assets.map(a => a._id);

  const [scheduled, inProgress, completed] = await Promise.all([
    MaintenanceRecord.countDocuments({ asset: { $in: assetIds }, status: 'scheduled' }),
    MaintenanceRecord.countDocuments({ asset: { $in: assetIds }, status: 'in_progress' }),
    MaintenanceRecord.countDocuments({ asset: { $in: assetIds }, status: 'completed' })
  ]);
  return { scheduled, inProgress, completed };
};

export const getPendingRequests = async (user) => {
  return Request.find({
    status: 'pending',
    assignedTo: user._id
  })
    .populate('requestedBy', 'name')
    .populate('assetType', 'name')
    .sort('createdAt')
    .limit(5)
    .lean();
};
