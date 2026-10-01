import type { NextFunction, Request, Response } from 'express';
import type Joi from 'joi';
import { ValidationError } from '../utils';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, unknown> = {};

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.body = error.details.map((item) => item.message);
      } else {
        req.body = value;
      }
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.params = error.details.map((item) => item.message);
      } else {
        req.params = value;
      }
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.query = error.details.map((item) => item.message);
      } else {
        req.query = value;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError('Request validation failed', errors));
      return;
    }

    next();
  };
};
