import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config';
import { apiRateLimiter, errorHandler, notFoundHandler, requestLogger } from './middleware';
import { tenantMiddleware, correlationMiddleware } from './middleware/tenant';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: `${env.MAX_FILE_SIZE}b` }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(tenantMiddleware);
app.use(correlationMiddleware);

app.use(`/api/${env.API_VERSION}`, apiRateLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
