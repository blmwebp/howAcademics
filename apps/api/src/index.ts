import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { authRouter } from './auth';
import { adminRouter } from './adminRoutes';
import { publicRouter } from './publicRoutes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const port = Number(process.env.PORT) || 3000;
const origins = [process.env.SITE_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'];

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(rateLimiter);
app.use('/api/v1/admin', (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && !origins.includes(origin)) {
      res.status(403).json({ error: { message: 'Invalid request origin' } });
      return;
    }
  }
  next();
});
const mediaDir = path.resolve(process.env.MEDIA_DIR || './media');
app.use('/media', express.static(mediaDir, { maxAge: '1d', index: false, dotfiles: 'deny' }));
app.get(['/health', '/api/v1/health'], (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/v1/public', publicRouter);
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);
if (require.main === module) app.listen(port, () => {
  console.log(`HowAcademics API running at http://localhost:${port}`);
});
export default app;
