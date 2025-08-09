// backend/src/middlewares/error.js
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const message = err.message || 'Erro interno';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({ error: message });
};
