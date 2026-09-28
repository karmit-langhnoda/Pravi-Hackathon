/**
 * Zod request validation middleware.
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 *
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 * @returns Express middleware
 */
export const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            location: 'body',
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            location: 'query',
          }))
        );
      } else {
        req.query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            location: 'params',
          }))
        );
      } else {
        req.params = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};
