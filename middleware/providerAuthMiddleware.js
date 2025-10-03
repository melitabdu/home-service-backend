import jwt from 'jsonwebtoken';
import Provider from '../models/Provider.js';

export const protectProvider = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await Provider.findById(decoded.id).select('_id email name');
      if (!req.user) {
        return res.status(401).json({ message: 'Provider not found' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};
