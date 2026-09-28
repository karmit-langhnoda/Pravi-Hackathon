import crypto from 'crypto';
import siftModule from 'sift';
import { pool } from './pgClient.js';

const sift = siftModule.default || siftModule;

// Registry of created models for population
const modelRegistry = new Map();

export const registerModel = (name, model) => {
  modelRegistry.set(name.toLowerCase(), model);
};

export const getModel = (name) => {
  return modelRegistry.get(name.toLowerCase());
};

/**
 * Cleanly extract value at a path (e.g. 'warranty.end' or 'assetType.name')
 */
const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr == null) return undefined;
    curr = curr[p];
  }
  return curr;
};

/**
 * Cleanly set value at a path
 */
const setByPath = (obj, path, val) => {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p] || typeof curr[p] !== 'object') curr[p] = {};
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = val;
};

/**
 * Apply MongoDB update operators ($set, $inc, $unset, etc.) to an object
 */
const applyUpdate = (target, update) => {
  if (!update) return target;
  let hasOperators = false;

  for (const key of Object.keys(update)) {
    if (key.startsWith('$')) {
      hasOperators = true;
      break;
    }
  }

  if (!hasOperators) {
    return { ...target, ...update };
  }

  const result = { ...target };

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      setByPath(result, k, v);
    }
  }

  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      const curr = Number(getByPath(result, k)) || 0;
      setByPath(result, k, curr + Number(v));
    }
  }

  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      const parts = k.split('.');
      let curr = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) break;
        curr = curr[parts[i]];
      }
      if (curr) delete curr[parts[parts.length - 1]];
    }
  }

  return result;
};

export class QueryChain {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.filter = filter;
    this.single = single;
    this._sort = null;
    this._skip = 0;
    this._limit = single ? 1 : null;
    this._select = null;
    this._populates = [];
    this._isLean = false;
  }

  sort(sortArg) {
    this._sort = sortArg;
    return this;
  }

  skip(n) {
    this._skip = Number(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = Number(n) || null;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  populate(pathOrOptions, selectFields) {
    if (typeof pathOrOptions === 'string') {
      this._populates.push({ path: pathOrOptions, select: selectFields });
    } else if (pathOrOptions && typeof pathOrOptions === 'object') {
      this._populates.push(pathOrOptions);
    }
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  async exec() {
    // 1. Fetch data from PostgreSQL
    let rows;
    const filter = this.filter || {};

    // Direct primary key optimization
    if (filter._id && typeof filter._id === 'string' && Object.keys(filter).length === 1) {
      const res = await pool.query(
        `SELECT data FROM ${this.model.tableName} WHERE id = $1 LIMIT 1`,
        [filter._id]
      );
      rows = res.rows.map((r) => r.data);
    } else if (filter.id && typeof filter.id === 'string' && Object.keys(filter).length === 1) {
      const res = await pool.query(
        `SELECT data FROM ${this.model.tableName} WHERE id = $1 LIMIT 1`,
        [filter.id]
      );
      rows = res.rows.map((r) => r.data);
    } else {
      const res = await pool.query(`SELECT data FROM ${this.model.tableName}`);
      rows = res.rows.map((r) => r.data);
      // Filter with MongoDB-compatible predicate
      const predicate = sift(filter);
      rows = rows.filter(predicate);
    }

    // 2. Sort
    if (this._sort) {
      const sortFields = [];
      if (typeof this._sort === 'string') {
        const parts = this._sort.split(/\s+/);
        for (const p of parts) {
          if (!p) continue;
          if (p.startsWith('-')) sortFields.push({ field: p.slice(1), dir: -1 });
          else sortFields.push({ field: p, dir: 1 });
        }
      } else if (typeof this._sort === 'object') {
        for (const [k, v] of Object.entries(this._sort)) {
          sortFields.push({ field: k, dir: v === -1 || v === 'desc' ? -1 : 1 });
        }
      }

      rows.sort((a, b) => {
        for (const { field, dir } of sortFields) {
          const valA = getByPath(a, field);
          const valB = getByPath(b, field);
          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
        }
        return 0;
      });
    }

    // 3. Skip & Limit
    if (this._skip > 0) {
      rows = rows.slice(this._skip);
    }
    if (this._limit != null && this._limit >= 0) {
      rows = rows.slice(0, this._limit);
    }

    // 4. Populate references
    if (this._populates.length > 0) {
      for (const pop of this._populates) {
        const path = pop.path;
        let targetModel = pop.model ? getModel(pop.model) : null;
        if (!targetModel) {
          if (path === 'role') targetModel = getModel('Role');
          else if (path === 'assetType') targetModel = getModel('AssetType');
          else if (path === 'project') targetModel = getModel('Project');
          else if (path === 'manager' || path === 'user' || path === 'assignee')
            targetModel = getModel('User');
          else if (path === 'parent' || path === 'asset') targetModel = getModel('Asset');
        }

        if (targetModel) {
          for (let item of rows) {
            const refVal = getByPath(item, path);
            if (refVal && typeof refVal === 'string') {
              const refDoc = await targetModel.findById(refVal).lean();
              if (refDoc) {
                let populatedObj = refDoc;
                if (pop.select) {
                  const allowed = pop.select.split(/\s+/).filter(Boolean);
                  populatedObj = { _id: refDoc._id };
                  for (const f of allowed) {
                    if (refDoc[f] !== undefined) populatedObj[f] = refDoc[f];
                  }
                }
                setByPath(item, path, populatedObj);
              }
            }
          }
        }
      }
    }

    // 5. Select projection
    if (this._select) {
      const selectFields = this._select.split(/\s+/).filter(Boolean);
      const isExclude = selectFields.every((f) => f.startsWith('-'));
      const isInclude = selectFields.every((f) => !f.startsWith('-') && !f.startsWith('+'));

      if (isInclude) {
        rows = rows.map((item) => {
          const projected = { _id: item._id };
          for (const f of selectFields) {
            if (item[f] !== undefined) projected[f] = item[f];
          }
          return projected;
        });
      } else if (isExclude) {
        const excludeKeys = selectFields.map((f) => f.slice(1));
        rows = rows.map((item) => {
          const projected = { ...item };
          for (const k of excludeKeys) delete projected[k];
          return projected;
        });
      }
    }

    // 6. Return single item or array
    if (this.single) {
      const result = rows[0] || null;
      if (!result) return null;
      return this._isLean ? result : new this.model(result);
    }

    return this._isLean ? rows : rows.map((r) => new this.model(r));
  }

  // Promise chaining support: allows `await Model.find(...)` directly
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

/**
 * Creates a Model class connected directly to a Supabase PostgreSQL table
 */
export const createPgModel = (tableName, modelName) => {
  class Model {
    constructor(data = {}) {
      Object.assign(this, data);
      this._id = this._id || this.id || crypto.randomUUID();
      this.id = this._id;
      if (!this.createdAt) this.createdAt = new Date();
      if (!this.updatedAt) this.updatedAt = new Date();
    }

    toObject() {
      return { ...this };
    }

    toJSON() {
      return { ...this };
    }

    async save() {
      this.updatedAt = new Date();
      const docData = { ...this };
      const id = this._id.toString();

      let queryText = '';
      let params = [];

      if (tableName === 'assets') {
        const projId = this.project ? (this.project._id || this.project).toString() : null;
        const typeId = this.assetType ? (this.assetType._id || this.assetType).toString() : null;
        const expDate =
          this.warranty && this.warranty.end ? new Date(this.warranty.end) : this.expiry_date || null;
        queryText = `
          INSERT INTO assets (id, asset_tag, name, status, project_id, asset_type_id, expiry_date, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            asset_tag = EXCLUDED.asset_tag,
            status = EXCLUDED.status,
            project_id = EXCLUDED.project_id,
            asset_type_id = EXCLUDED.asset_type_id,
            expiry_date = EXCLUDED.expiry_date,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at
        `;
        params = [
          id,
          this.assetTag || id,
          this.name || 'Unnamed',
          this.status || 'available',
          projId,
          typeId,
          expDate,
          JSON.stringify(docData),
          this.createdAt,
          this.updatedAt,
        ];
      } else if (tableName === 'users') {
        const roleId = this.role ? (this.role._id || this.role).toString() : null;
        queryText = `
          INSERT INTO users (id, name, email, role_id, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            role_id = EXCLUDED.role_id,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at
        `;
        params = [
          id,
          this.name || '',
          this.email || '',
          roleId,
          JSON.stringify(docData),
          this.createdAt,
          this.updatedAt,
        ];
      } else if (tableName === 'projects') {
        queryText = `
          INSERT INTO projects (id, name, code, status, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at
        `;
        params = [
          id,
          this.name || '',
          this.code || '',
          this.status || 'active',
          JSON.stringify(docData),
          this.createdAt,
          this.updatedAt,
        ];
      } else if (tableName === 'roles') {
        queryText = `
          INSERT INTO roles (id, name, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at
        `;
        params = [id, this.name || '', JSON.stringify(docData), this.createdAt, this.updatedAt];
      } else if (tableName === 'asset_types') {
        queryText = `
          INSERT INTO asset_types (id, name, code, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at
        `;
        params = [id, this.name || '', this.code || '', JSON.stringify(docData), this.createdAt, this.updatedAt];
      } else if (tableName === 'audit_logs') {
        queryText = `
          INSERT INTO audit_logs (id, action, entity_type, entity_id, user_email, data, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
        `;
        params = [
          id,
          this.action || 'ACTION',
          this.entityType || 'SYSTEM',
          this.entityId ? this.entityId.toString() : null,
          this.userEmail || null,
          JSON.stringify(docData),
          this.createdAt,
        ];
      } else if (tableName === 'lifecycle_events') {
        queryText = `
          INSERT INTO lifecycle_events (id, asset_id, event_type, data, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
        `;
        params = [
          id,
          this.asset ? this.asset.toString() : null,
          this.eventType || 'status_change',
          JSON.stringify(docData),
          this.createdAt,
        ];
      } else {
        queryText = `
          INSERT INTO ${tableName} (id, data, created_at, updated_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
        `;
        params = [id, JSON.stringify(docData), this.createdAt, this.updatedAt];
      }

      await pool.query(queryText, params);
      return this;
    }

    async deleteOne() {
      const id = this._id.toString();
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
      return { acknowledged: true, deletedCount: 1 };
    }

    static get tableName() {
      return tableName;
    }

    static find(filter = {}) {
      return new QueryChain(Model, filter, false);
    }

    static findOne(filter = {}) {
      return new QueryChain(Model, filter, true);
    }

    static findById(id) {
      const idStr = id ? (id._id || id).toString() : '';
      return new QueryChain(Model, { _id: idStr }, true);
    }

    static async countDocuments(filter = {}) {
      const res = await pool.query(`SELECT data FROM ${tableName}`);
      const predicate = sift(filter);
      return res.rows.map((r) => r.data).filter(predicate).length;
    }

    static async create(docOrDocs) {
      if (Array.isArray(docOrDocs)) {
        const instances = docOrDocs.map((d) => new Model(d));
        for (const inst of instances) await inst.save();
        return instances;
      }
      const instance = new Model(docOrDocs);
      await instance.save();
      return instance;
    }

    static async updateOne(filter = {}, update = {}, options = {}) {
      const item = await Model.findOne(filter);
      if (!item) {
        if (options.upsert) {
          const newDoc = applyUpdate(filter, update);
          const created = await Model.create(newDoc);
          return { acknowledged: true, modifiedCount: 0, upsertedId: created._id };
        }
        return { acknowledged: true, modifiedCount: 0 };
      }
      const updatedData = applyUpdate(item.toObject(), update);
      const updatedInstance = new Model(updatedData);
      await updatedInstance.save();
      return { acknowledged: true, modifiedCount: 1 };
    }

    static async updateMany(filter = {}, update = {}, options = {}) {
      const items = await Model.find(filter);
      let count = 0;
      for (const item of items) {
        const updatedData = applyUpdate(item.toObject(), update);
        const inst = new Model(updatedData);
        await inst.save();
        count++;
      }
      return { acknowledged: true, modifiedCount: count };
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      const idStr = id ? (id._id || id).toString() : '';

      // Special handling for counter table
      if (tableName === 'counters') {
        const seqInc = update?.$inc?.seq || 1;
        const res = await pool.query(
          `INSERT INTO counters (name, seq) VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET seq = counters.seq + $2
           RETURNING seq`,
          [idStr, seqInc]
        );
        return { _id: idStr, seq: Number(res.rows[0].seq) };
      }

      let item = await Model.findById(idStr);
      if (!item) {
        if (options.upsert) {
          const newDoc = applyUpdate({ _id: idStr }, update);
          return await Model.create(newDoc);
        }
        return null;
      }

      const updatedData = applyUpdate(item.toObject(), update);
      const updatedInstance = new Model(updatedData);
      await updatedInstance.save();
      return options.new ? updatedInstance : item;
    }

    static async deleteOne(filter = {}) {
      const item = await Model.findOne(filter);
      if (!item) return { acknowledged: true, deletedCount: 0 };
      await item.deleteOne();
      return { acknowledged: true, deletedCount: 1 };
    }

    static async deleteMany(filter = {}) {
      const items = await Model.find(filter);
      for (const item of items) {
        await item.deleteOne();
      }
      return { acknowledged: true, deletedCount: items.length };
    }

    static async distinct(field, filter = {}) {
      const items = await Model.find(filter).lean();
      const set = new Set();
      for (const item of items) {
        const val = getByPath(item, field);
        if (val !== undefined && val !== null) set.add(val);
      }
      return Array.from(set);
    }

    static async aggregate(pipeline = []) {
      const res = await pool.query(`SELECT data FROM ${tableName}`);
      let docs = res.rows.map((r) => r.data);

      for (const stage of pipeline) {
        if (stage.$match) {
          docs = docs.filter(sift(stage.$match));
        } else if (stage.$group) {
          const groupField = stage.$group._id;
          const map = new Map();

          for (const doc of docs) {
            let key = null;
            if (typeof groupField === 'string' && groupField.startsWith('$')) {
              key = getByPath(doc, groupField.slice(1));
            } else {
              key = groupField;
            }

            if (!map.has(key)) {
              map.set(key, { _id: key, count: 0 });
            }
            const entry = map.get(key);

            for (const [k, v] of Object.entries(stage.$group)) {
              if (k === '_id') continue;
              if (v && v.$sum) {
                const addVal = typeof v.$sum === 'number' ? v.$sum : Number(getByPath(doc, v.$sum.slice(1))) || 0;
                entry[k] = (entry[k] || 0) + addVal;
              }
            }
          }
          docs = Array.from(map.values());
        } else if (stage.$sort) {
          // Sort stage
          docs.sort((a, b) => {
            for (const [k, v] of Object.entries(stage.$sort)) {
              const valA = getByPath(a, k);
              const valB = getByPath(b, k);
              if (valA === valB) continue;
              if (valA == null) return 1;
              if (valB == null) return -1;
              return valA < valB ? -v : v;
            }
            return 0;
          });
        } else if (stage.$limit) {
          docs = docs.slice(0, stage.$limit);
        }
      }

      return docs;
    }
  }

  registerModel(modelName, Model);
  return Model;
};
