/**
 * Simple in-memory cache (replaces Redis for development).
 * In production, swap this for Redis.
 */
const store = new Map();

export const cache = {
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlSeconds = 60) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key) {
    store.delete(key);
  },

  async delPattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of store.keys()) {
      if (regex.test(key)) store.delete(key);
    }
  },
};

// In-memory refresh token store (replaces Redis)
export const refreshTokenStore = {
  _tokens: new Map(),

  async set(userId, hashedToken, ttlSeconds = 604800) {
    this._tokens.set(userId.toString(), {
      hash: hashedToken,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async get(userId) {
    const entry = this._tokens.get(userId.toString());
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._tokens.delete(userId.toString());
      return null;
    }
    return entry.hash;
  },

  async del(userId) {
    this._tokens.delete(userId.toString());
  },
};
