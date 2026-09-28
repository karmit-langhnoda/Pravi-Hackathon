import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../.env') });

import { SYSTEM_ROLES } from '../config/constants.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Location } from '../models/Location.js';
import { AssetType } from '../models/AssetType.js';
import { Asset } from '../models/Asset.js';
import { Counter } from '../models/Counter.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/asset_platform';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'User@123';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Department.deleteMany({}),
      Location.deleteMany({}),
      AssetType.deleteMany({}),
      Asset.deleteMany({}),
      Counter.deleteMany({}),
    ]);

    // ==================== ROLES ====================
    console.log('📋 Seeding roles...');
    const roles = {};
    for (const [name, config] of Object.entries(SYSTEM_ROLES)) {
      const role = await Role.create({
        name,
        description: config.description,
        permissions: config.permissions,
        isSystem: true,
      });
      roles[name] = role;
    }
    console.log(`   Created ${Object.keys(roles).length} roles`);

    // ==================== USERS ====================
    console.log('👤 Seeding users...');
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const userHash = await bcrypt.hash(USER_PASSWORD, 12);

    const users = {};
    const userSeedData = [
      { name: 'Admin User', email: 'admin@example.com', role: 'Admin', hash: adminHash },
      { name: 'Asset Manager', email: 'manager@example.com', role: 'AssetManager', hash: userHash },
      { name: 'Approver User', email: 'approver@example.com', role: 'Approver', hash: userHash },
      { name: 'Tech User', email: 'technician@example.com', role: 'Technician', hash: userHash },
      { name: 'Auditor User', email: 'auditor@example.com', role: 'Auditor', hash: userHash },
      { name: 'Employee One', email: 'employee@example.com', role: 'Employee', hash: userHash },
      { name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'Employee', hash: userHash },
      { name: 'Priya Sharma', email: 'priya@example.com', role: 'AssetManager', hash: userHash },
    ];

    for (const u of userSeedData) {
      const user = await User.create({
        name: u.name,
        email: u.email,
        passwordHash: u.hash,
        role: roles[u.role]._id,
        status: 'active',
      });
      users[u.email] = user;
    }
    console.log(`   Created ${Object.keys(users).length} users`);

    // ==================== DEPARTMENTS ====================
    console.log('🏢 Seeding departments...');
    const depts = {};
    const deptData = [
      { name: 'Information Technology', code: 'IT' },
      { name: 'Human Resources', code: 'HR' },
      { name: 'Operations', code: 'OPS' },
      { name: 'Finance', code: 'FIN' },
    ];

    for (const d of deptData) {
      const dept = await Department.create(d);
      depts[d.code] = dept;
    }

    // Assign departments to users
    await User.updateOne({ _id: users['admin@example.com']._id }, { department: depts['IT']._id });
    await User.updateOne({ _id: users['manager@example.com']._id }, { department: depts['IT']._id });
    await User.updateOne({ _id: users['employee@example.com']._id }, { department: depts['IT']._id });
    await User.updateOne({ _id: users['rajesh@example.com']._id }, { department: depts['OPS']._id });
    await User.updateOne({ _id: users['priya@example.com']._id }, { department: depts['OPS']._id });

    console.log(`   Created ${Object.keys(depts).length} departments`);

    // ==================== LOCATIONS ====================
    console.log('📍 Seeding locations...');
    const locs = {};

    // India
    const india = await Location.create({ name: 'India', kind: 'country' });
    locs['india'] = india;

    // Cities
    const pune = new Location({ name: 'Pune', kind: 'city', parent: india._id });
    await pune.save();
    locs['pune'] = pune;

    const mumbai = new Location({ name: 'Mumbai', kind: 'city', parent: india._id });
    await mumbai.save();
    locs['mumbai'] = mumbai;

    const bengaluru = new Location({ name: 'Bengaluru', kind: 'city', parent: india._id });
    await bengaluru.save();
    locs['bengaluru'] = bengaluru;

    // HQ Building
    const hq = new Location({ name: 'HQ Building', kind: 'building', parent: pune._id });
    await hq.save();
    locs['hq'] = hq;

    // Floors & Rooms
    const floor1 = new Location({ name: 'Floor 1', kind: 'floor', parent: hq._id });
    await floor1.save();
    locs['floor1'] = floor1;

    const room101 = new Location({ name: 'Room 101', kind: 'room', parent: floor1._id });
    await room101.save();
    locs['room101'] = room101;

    const room102 = new Location({ name: 'Room 102', kind: 'room', parent: floor1._id });
    await room102.save();
    locs['room102'] = room102;

    const floor2 = new Location({ name: 'Floor 2', kind: 'floor', parent: hq._id });
    await floor2.save();
    locs['floor2'] = floor2;

    console.log(`   Created ${Object.keys(locs).length} locations`);

    // ==================== ASSET TYPES ====================
    console.log('🔧 Seeding asset types...');

    // Laptop
    const laptopType = await AssetType.create({
      name: 'Laptop',
      code: 'LT',
      category: 'IT Equipment',
      description: 'Portable computers',
      icon: 'Laptop',
      tagFormat: { prefix: 'LT', includeYear: true, padding: 5 },
      fields: [
        { key: 'serial_number', label: 'Serial Number', dataType: 'text', required: true, unique: true, searchable: true, order: 1 },
        { key: 'brand', label: 'Brand', dataType: 'select', options: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer'], order: 2 },
        { key: 'model', label: 'Model', dataType: 'text', searchable: true, order: 3 },
        { key: 'ram_gb', label: 'RAM (GB)', dataType: 'number', validation: { min: 4, max: 128 }, order: 4 },
        { key: 'storage_gb', label: 'Storage (GB)', dataType: 'number', order: 5 },
        { key: 'os', label: 'Operating System', dataType: 'select', options: ['Windows 11', 'Windows 10', 'macOS', 'Ubuntu', 'ChromeOS'], order: 6 },
        { key: 'purchase_channel', label: 'Purchase Channel', dataType: 'text', order: 7 },
      ],
      states: [
        { key: 'procured', label: 'Procured', color: '#6B7280', isInitial: true },
        { key: 'in_stock', label: 'In Stock', color: '#10B981' },
        { key: 'assigned', label: 'Assigned', color: '#3B82F6' },
        { key: 'in_repair', label: 'In Repair', color: '#F59E0B' },
        { key: 'retired', label: 'Retired', color: '#8B5CF6' },
        { key: 'disposed', label: 'Disposed', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'procured', to: 'in_stock', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'in_stock', to: 'assigned', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'assigned', to: 'in_stock', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'in_stock', to: 'in_repair', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'assigned', to: 'in_repair', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'in_repair', to: 'in_stock', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'in_stock', to: 'retired', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'retired', to: 'disposed', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin', 'AssetManager'] },
      ],
    });

    // Vehicle
    const vehicleType = await AssetType.create({
      name: 'Vehicle',
      code: 'VH',
      category: 'Transport',
      description: 'Company vehicles',
      icon: 'Car',
      tagFormat: { prefix: 'VH', includeYear: true, padding: 4 },
      fields: [
        { key: 'registration_no', label: 'Registration No', dataType: 'text', required: true, unique: true, searchable: true, order: 1 },
        { key: 'fuel_type', label: 'Fuel Type', dataType: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'], order: 2 },
        { key: 'odometer_km', label: 'Odometer (km)', dataType: 'number', order: 3 },
        { key: 'insurance_expiry', label: 'Insurance Expiry', dataType: 'date', order: 4 },
        { key: 'driver', label: 'Driver', dataType: 'user', order: 5 },
      ],
      states: [
        { key: 'available', label: 'Available', color: '#10B981', isInitial: true },
        { key: 'in_use', label: 'In Use', color: '#3B82F6' },
        { key: 'in_service', label: 'In Service', color: '#F59E0B' },
        { key: 'sold', label: 'Sold', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'available', to: 'in_use', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'in_use', to: 'available', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'available', to: 'in_service', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'in_use', to: 'in_service', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'in_service', to: 'available', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'available', to: 'sold', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin', 'AssetManager'] },
      ],
    });

    // Generator
    const generatorType = await AssetType.create({
      name: 'Generator',
      code: 'GN',
      category: 'Infrastructure',
      description: 'Power generators',
      icon: 'Zap',
      tagFormat: { prefix: 'GN', includeYear: true, padding: 4 },
      fields: [
        { key: 'capacity_kva', label: 'Capacity (KVA)', dataType: 'number', required: true, order: 1 },
        { key: 'fuel_type', label: 'Fuel Type', dataType: 'select', options: ['Diesel', 'Petrol', 'Natural Gas', 'Solar'], order: 2 },
        { key: 'last_service_date', label: 'Last Service Date', dataType: 'date', order: 3 },
      ],
      states: [
        { key: 'active', label: 'Active', color: '#10B981', isInitial: true },
        { key: 'under_maintenance', label: 'Under Maintenance', color: '#F59E0B' },
        { key: 'decommissioned', label: 'Decommissioned', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'active', to: 'under_maintenance', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'under_maintenance', to: 'active', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'active', to: 'decommissioned', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin', 'AssetManager'] },
      ],
    });

    // AC Unit
    const acType = await AssetType.create({
      name: 'AC Unit',
      code: 'AC',
      category: 'HVAC',
      description: 'Air conditioning units',
      icon: 'Wind',
      tagFormat: { prefix: 'AC', includeYear: true, padding: 4 },
      fields: [
        { key: 'tonnage', label: 'Tonnage', dataType: 'number', required: true, order: 1 },
        { key: 'type', label: 'Type', dataType: 'select', options: ['Split', 'Window', 'Central', 'Cassette'], order: 2 },
        { key: 'refrigerant', label: 'Refrigerant', dataType: 'text', order: 3 },
      ],
      states: [
        { key: 'operational', label: 'Operational', color: '#10B981', isInitial: true },
        { key: 'under_repair', label: 'Under Repair', color: '#F59E0B' },
        { key: 'scrapped', label: 'Scrapped', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'operational', to: 'under_repair', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'under_repair', to: 'operational', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'operational', to: 'scrapped', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin'] },
      ],
    });

    // Lift
    const liftType = await AssetType.create({
      name: 'Lift',
      code: 'LF',
      category: 'Infrastructure',
      description: 'Elevators and lifts',
      icon: 'ArrowUpDown',
      tagFormat: { prefix: 'LF', includeYear: true, padding: 4 },
      fields: [
        { key: 'capacity_kg', label: 'Capacity (kg)', dataType: 'number', required: true, order: 1 },
        { key: 'floors_served', label: 'Floors Served', dataType: 'number', order: 2 },
        { key: 'manufacturer', label: 'Manufacturer', dataType: 'text', order: 3 },
      ],
      states: [
        { key: 'operational', label: 'Operational', color: '#10B981', isInitial: true },
        { key: 'under_maintenance', label: 'Under Maintenance', color: '#F59E0B' },
        { key: 'decommissioned', label: 'Decommissioned', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'operational', to: 'under_maintenance', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'under_maintenance', to: 'operational', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'operational', to: 'decommissioned', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin'] },
      ],
    });

    // Fire Panel
    const firePanelType = await AssetType.create({
      name: 'Fire Panel',
      code: 'FP',
      category: 'Safety',
      description: 'Fire alarm panels',
      icon: 'Flame',
      tagFormat: { prefix: 'FP', includeYear: true, padding: 4 },
      fields: [
        { key: 'zones', label: 'Number of Zones', dataType: 'number', required: true, order: 1 },
        { key: 'panel_type', label: 'Panel Type', dataType: 'select', options: ['Conventional', 'Addressable', 'Hybrid'], order: 2 },
        { key: 'last_inspection', label: 'Last Inspection', dataType: 'date', order: 3 },
      ],
      states: [
        { key: 'active', label: 'Active', color: '#10B981', isInitial: true },
        { key: 'under_inspection', label: 'Under Inspection', color: '#F59E0B' },
        { key: 'decommissioned', label: 'Decommissioned', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'active', to: 'under_inspection', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'under_inspection', to: 'active', allowedRoles: ['Admin', 'AssetManager', 'Technician'] },
        { from: 'active', to: 'decommissioned', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin'] },
      ],
    });

    // Building (Container type)
    const buildingType = await AssetType.create({
      name: 'Building',
      code: 'BL',
      category: 'Infrastructure',
      description: 'Building assets that can contain other infrastructure assets',
      icon: 'Building2',
      tagFormat: { prefix: 'BL', includeYear: true, padding: 4 },
      fields: [
        { key: 'floors', label: 'Number of Floors', dataType: 'number', required: true, order: 1 },
        { key: 'built_year', label: 'Built Year', dataType: 'number', order: 2 },
        { key: 'owner', label: 'Owner', dataType: 'text', order: 3 },
      ],
      states: [
        { key: 'active', label: 'Active', color: '#10B981', isInitial: true },
        { key: 'under_renovation', label: 'Under Renovation', color: '#F59E0B' },
        { key: 'decommissioned', label: 'Decommissioned', color: '#EF4444', isFinal: true },
      ],
      transitions: [
        { from: 'active', to: 'under_renovation', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'under_renovation', to: 'active', allowedRoles: ['Admin', 'AssetManager'] },
        { from: 'active', to: 'decommissioned', requiresApproval: true, approverRole: 'Approver', allowedRoles: ['Admin'] },
      ],
      hierarchy: {
        isContainer: true,
        allowedChildTypes: [generatorType._id, acType._id, liftType._id, firePanelType._id],
        inheritLocation: true,
      },
    });

    console.log('   Created 7 asset types (Laptop, Vehicle, Generator, AC Unit, Lift, Fire Panel, Building)');

    // ==================== SAMPLE ASSETS ====================
    console.log('📦 Seeding sample assets...');

    const generateTag = async (prefix, year) => {
      const counterId = `tag:${prefix}:${year}`;
      const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      return `${prefix}-${year}-${String(counter.seq).padStart(5, '0')}`;
    };

    const year = new Date().getFullYear();
    let assetCount = 0;

    // Create Buildings (containers)
    const buildings = [];
    const buildingData = [
      { name: 'HQ Building Alpha', loc: locs['hq']._id, floors: 5, built_year: 2015, owner: 'Company' },
      { name: 'Tech Park Beta', loc: locs['pune']._id, floors: 8, built_year: 2018, owner: 'Leased' },
      { name: 'Mumbai Office Tower', loc: locs['mumbai']._id, floors: 12, built_year: 2020, owner: 'Company' },
    ];

    for (const b of buildingData) {
      const tag = await generateTag('BL', year);
      const building = await Asset.create({
        assetTag: tag,
        assetType: buildingType._id,
        typeVersion: 1,
        name: b.name,
        status: 'active',
        attributes: { floors: b.floors, built_year: b.built_year, owner: b.owner },
        location: b.loc,
        department: depts['OPS']._id,
        purchase: { cost: 50000000, currency: 'INR', date: new Date(b.built_year, 0, 1) },
        createdBy: users['admin@example.com']._id,
      });
      buildings.push(building);
      assetCount++;
    }

    // Create child assets for each building
    const childTypes = [
      { type: generatorType, prefix: 'GN', statusKey: 'active', makeAttrs: (i) => ({ capacity_kva: [50, 100, 150, 200, 250][i % 5], fuel_type: ['Diesel', 'Natural Gas'][i % 2] }) },
      { type: acType, prefix: 'AC', statusKey: 'operational', makeAttrs: (i) => ({ tonnage: [1.5, 2, 3, 5][i % 4], type: ['Split', 'Central', 'Cassette'][i % 3] }) },
      { type: liftType, prefix: 'LF', statusKey: 'operational', makeAttrs: (i) => ({ capacity_kg: [500, 1000, 1500][i % 3], floors_served: 5 + (i % 8) }) },
      { type: firePanelType, prefix: 'FP', statusKey: 'active', makeAttrs: (i) => ({ zones: [4, 8, 16][i % 3], panel_type: ['Addressable', 'Conventional'][i % 2] }) },
    ];

    for (const building of buildings) {
      let childCountForBuilding = 0;
      const numChildren = 5 + Math.floor(Math.random() * 11); // 5 to 15 children

      for (let i = 0; i < numChildren; i++) {
        const ct = childTypes[i % childTypes.length];
        const tag = await generateTag(ct.prefix, year);
        await Asset.create({
          assetTag: tag,
          assetType: ct.type._id,
          typeVersion: 1,
          name: `${ct.type.name} ${tag}`,
          status: ct.statusKey,
          attributes: ct.makeAttrs(i),
          location: building.location,
          department: depts['OPS']._id,
          parent: building._id,
          purchase: { cost: 50000 + Math.floor(Math.random() * 200000), currency: 'INR', date: new Date() },
          warranty: {
            start: new Date(),
            end: new Date(Date.now() + (30 + Math.floor(Math.random() * 90)) * 24 * 60 * 60 * 1000),
          },
          createdBy: users['admin@example.com']._id,
        });
        childCountForBuilding++;
        assetCount++;
      }

      // Update childCount
      await Asset.updateOne({ _id: building._id }, { childCount: childCountForBuilding });
    }

    // Create Laptops
    const brands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus'];
    const models = ['XPS 15', 'EliteBook', 'ThinkPad X1', 'MacBook Pro', 'ZenBook'];
    const statuses = ['procured', 'in_stock', 'assigned', 'in_repair', 'in_stock', 'assigned', 'assigned'];

    for (let i = 0; i < 100; i++) {
      const tag = await generateTag('LT', year);
      const status = statuses[i % statuses.length];
      const assignUser = status === 'assigned' ?
        Object.values(users)[Math.floor(Math.random() * Object.values(users).length)] : null;

      await Asset.create({
        assetTag: tag,
        assetType: laptopType._id,
        typeVersion: 1,
        name: `${brands[i % brands.length]} ${models[i % models.length]}`,
        status,
        attributes: {
          serial_number: `SN-${String(i + 1).padStart(6, '0')}`,
          brand: brands[i % brands.length],
          model: models[i % models.length],
          ram_gb: [8, 16, 32, 64][i % 4],
          storage_gb: [256, 512, 1024][i % 3],
          os: ['Windows 11', 'macOS', 'Ubuntu'][i % 3],
        },
        location: Object.values(locs)[Math.floor(Math.random() * Object.values(locs).length)]._id,
        department: Object.values(depts)[Math.floor(Math.random() * Object.values(depts).length)]._id,
        assignment: assignUser ? {
          kind: 'user',
          user: assignUser._id,
          since: new Date(),
          dueAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        } : undefined,
        purchase: {
          cost: 50000 + Math.floor(Math.random() * 150000),
          currency: 'INR',
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          vendor: ['Amazon Business', 'Flipkart Business', 'Direct'][i % 3],
        },
        warranty: {
          start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + (i < 20 ? 15 + i * 3 : 365) * 24 * 60 * 60 * 1000),
        },
        createdBy: users['admin@example.com']._id,
      });
      assetCount++;
    }

    // Create Vehicles
    const vRegNos = ['MH12AB1234', 'MH14CD5678', 'KA01EF9012', 'MH12GH3456', 'MH14IJ7890',
      'KA01KL2345', 'MH12MN6789', 'MH14OP1234', 'KA01QR5678', 'MH12ST9012',
      'MH14UV3456', 'KA01WX7890', 'MH12YZ2345', 'MH14AB6789', 'KA01CD1234'];

    for (let i = 0; i < 15; i++) {
      const tag = await generateTag('VH', year);
      await Asset.create({
        assetTag: tag,
        assetType: vehicleType._id,
        typeVersion: 1,
        name: `Vehicle ${vRegNos[i]}`,
        status: ['available', 'in_use', 'in_service'][i % 3],
        attributes: {
          registration_no: vRegNos[i],
          fuel_type: ['Petrol', 'Diesel', 'Electric'][i % 3],
          odometer_km: Math.floor(Math.random() * 100000),
          insurance_expiry: new Date(Date.now() + (30 + Math.floor(Math.random() * 300)) * 24 * 60 * 60 * 1000),
        },
        location: Object.values(locs)[i % Object.values(locs).length]._id,
        department: depts['OPS']._id,
        purchase: {
          cost: 500000 + Math.floor(Math.random() * 2000000),
          currency: 'INR',
          date: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
        },
        warranty: {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + (i < 5 ? 20 + i * 10 : 365) * 24 * 60 * 60 * 1000),
        },
        createdBy: users['admin@example.com']._id,
      });
      assetCount++;
    }

    // Create standalone generators
    for (let i = 0; i < 10; i++) {
      const tag = await generateTag('GN', year);
      await Asset.create({
        assetTag: tag,
        assetType: generatorType._id,
        typeVersion: 1,
        name: `Standalone Generator ${i + 1}`,
        status: 'active',
        attributes: {
          capacity_kva: [100, 200, 500, 750, 1000][i % 5],
          fuel_type: 'Diesel',
        },
        location: Object.values(locs)[i % Object.values(locs).length]._id,
        department: depts['OPS']._id,
        purchase: {
          cost: 200000 + Math.floor(Math.random() * 500000),
          currency: 'INR',
          date: new Date(),
        },
        createdBy: users['admin@example.com']._id,
      });
      assetCount++;
    }

    console.log(`   Created ${assetCount} total assets (including container children)`);

    // ==================== SUMMARY ====================
    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Roles: ${Object.keys(roles).length}`);
    console.log(`   Users: ${Object.keys(users).length}`);
    console.log(`   Departments: ${Object.keys(depts).length}`);
    console.log(`   Locations: ${Object.keys(locs).length}`);
    console.log(`   Asset Types: 7`);
    console.log(`   Assets: ${assetCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📧 Login credentials:');
    console.log(`   Admin:      admin@example.com / ${ADMIN_PASSWORD}`);
    console.log(`   Manager:    manager@example.com / ${USER_PASSWORD}`);
    console.log(`   Approver:   approver@example.com / ${USER_PASSWORD}`);
    console.log(`   Technician: technician@example.com / ${USER_PASSWORD}`);
    console.log(`   Auditor:    auditor@example.com / ${USER_PASSWORD}`);
    console.log(`   Employee:   employee@example.com / ${USER_PASSWORD}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
