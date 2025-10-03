// backend/middleware/verifyAdminSecret.js
export const verifyAdminSecret = (req, res, next) => {
  const clientSecret = req.headers['x-admin-secret'];
  const serverSecret = process.env.ADMIN_SECRET;

  if (!serverSecret) {
    return res.status(500).json({ message: 'Server misconfiguration: ADMIN_SECRET not set' });
  }

  if (clientSecret && clientSecret === serverSecret) {
    req.isAdminSecret = true; // ✅ mark that admin secret was used
    return next();
  }

  // If no secret, just pass to next (for providers/customers)
  req.isAdminSecret = false;
  return next();
};
