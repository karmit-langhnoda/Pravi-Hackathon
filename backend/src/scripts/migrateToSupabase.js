import mongoose from 'mongoose';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.hixsafjidkvexevpprnh:KarmitSupabase%4010@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log('Migrating Roles...');
  const roles = await db.collection('roles').find().toArray();
  for (const r of roles) {
    const id = r._id.toString();
    await pool.query(
      `INSERT INTO roles (id, name, data, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name`,
      [id, r.name, JSON.stringify(r), r.createdAt || new Date(), r.updatedAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${roles.length} roles.`);

  console.log('Migrating Users...');
  const users = await db.collection('users').find().toArray();
  for (const u of users) {
    const id = u._id.toString();
    const roleId = u.role ? u.role.toString() : null;
    await pool.query(
      `INSERT INTO users (id, name, email, role_id, data, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, email = EXCLUDED.email, role_id = EXCLUDED.role_id`,
      [id, u.name, u.email, roleId, JSON.stringify(u), u.createdAt || new Date(), u.updatedAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${users.length} users.`);

  console.log('Migrating AssetTypes...');
  const types = await db.collection('assettypes').find().toArray();
  for (const t of types) {
    const id = t._id.toString();
    await pool.query(
      `INSERT INTO asset_types (id, name, code, data, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, code = EXCLUDED.code`,
      [id, t.name, t.code, JSON.stringify(t), t.createdAt || new Date(), t.updatedAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${types.length} asset types.`);

  console.log('Migrating Projects...');
  const projects = await db.collection('projects').find().toArray();
  for (const p of projects) {
    const id = p._id.toString();
    await pool.query(
      `INSERT INTO projects (id, name, code, status, data, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, code = EXCLUDED.code, status = EXCLUDED.status`,
      [id, p.name, p.code, p.status || 'active', JSON.stringify(p), p.createdAt || new Date(), p.updatedAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${projects.length} projects.`);

  console.log('Migrating Assets...');
  const assets = await db.collection('assets').find().toArray();
  for (const a of assets) {
    const id = a._id.toString();
    const projId = a.project ? a.project.toString() : null;
    const typeId = a.assetType ? a.assetType.toString() : null;
    const expDate = a.warranty && a.warranty.end ? new Date(a.warranty.end) : null;
    await pool.query(
      `INSERT INTO assets (id, asset_tag, name, status, project_id, asset_type_id, expiry_date, data, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, status = EXCLUDED.status, project_id = EXCLUDED.project_id`,
      [id, a.assetTag, a.name, a.status, projId, typeId, expDate, JSON.stringify(a), a.createdAt || new Date(), a.updatedAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${assets.length} assets.`);

  console.log('Migrating Counters...');
  const counters = await db.collection('counters').find().toArray();
  for (const c of counters) {
    await pool.query(
      `INSERT INTO counters (name, seq) VALUES ($1, $2) 
       ON CONFLICT (name) DO UPDATE SET seq = EXCLUDED.seq`,
      [c._id, c.seq || 0]
    );
  }
  console.log(`✅ Migrated ${counters.length} counters.`);

  console.log('Migrating Lifecycle Events...');
  const events = await db.collection('lifecycleevents').find().toArray();
  for (const ev of events) {
    const id = ev._id.toString();
    const assetId = ev.asset ? ev.asset.toString() : null;
    await pool.query(
      `INSERT INTO lifecycle_events (id, asset_id, event_type, data, created_at) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [id, assetId, ev.eventType || 'status_change', JSON.stringify(ev), ev.createdAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${events.length} lifecycle events.`);

  console.log('Migrating Audit Logs...');
  const audits = await db.collection('auditlogs').find().toArray();
  for (const aud of audits) {
    const id = aud._id.toString();
    await pool.query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, user_email, data, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [id, aud.action || 'ACTION', aud.entityType || 'ASSET', aud.entityId ? aud.entityId.toString() : null, aud.userEmail || null, JSON.stringify(aud), aud.createdAt || new Date()]
    );
  }
  console.log(`✅ Migrated ${audits.length} audit logs.`);

  await mongoose.disconnect();
  await pool.end();
  console.log('🚀 MIGRATION TO SUPABASE POSTGRESQL FINISHED SUCCESSFULLY!');
}

migrate().catch(e => {
  console.error('Fatal Migration Error:', e);
  process.exit(1);
});
