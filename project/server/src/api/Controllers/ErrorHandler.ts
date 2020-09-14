import { Request, Response, NextFunction } from 'express';

import ApiException from '../ApiException';

export default function ErrorHandler(error: ApiException, req: Request, res: Response, next: NextFunction) {
  return res.status(error.status).json(error);
}