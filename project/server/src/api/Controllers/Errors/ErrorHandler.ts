import { Request, Response, NextFunction } from 'express';

import ApiException from '../../ApiException';

export function ParseError(error: any, defaultMessage: string): ApiException {
  if (error instanceof ApiException)
    return error;

  return new ApiException(500, defaultMessage, error);
}

export default function ErrorHandler(error: ApiException, req: Request, res: Response, next: NextFunction) {
  return res.status(error.status).json(error);
}