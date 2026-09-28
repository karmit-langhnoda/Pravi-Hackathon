/**
 * Sanitize input to prevent NoSQL injection
 * Rejects any keys starting with $ in request body/query/params
 */
const hasDollarKeys = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) return true;
    if (typeof obj[key] === 'object' && hasDollarKeys(obj[key])) return true;
  }
  return false;
};

export const sanitize = (req, res, next) => {
  if (hasDollarKeys(req.body) || hasDollarKeys(req.query)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Input contains prohibited characters',
      },
    });
  }
  next();
};
