import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authToken = req.headers['authorization'];

  if (!authToken) {
    res.status(401).send('Authorization token is required');
    return;
  }

  if (authToken !== process.env.AUTH_TOKEN) {
    res.status(403).send('Invalid authorization token');
    return;
  }

  next();
};
