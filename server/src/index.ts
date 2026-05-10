// Build Sync: 2026-05-10T14:40 - Rapid Response Startup
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 1. Immediate Health Check for Railway
app.get('/', (req, res) => res.status(200).send('Lumora Engine is LIVE! 🚀'));
app.get('/health', (req, res) => res.status(200).json({ status: 'active', timestamp: new Date().toISOString() }));

// 2. Delayed Route Registration to prevent health check timeout
import audioRoutes from './routes/audioRoutes';
import imageRoutes from './routes/imageRoutes';
app.use('/', audioRoutes);
app.use('/', imageRoutes);

// 3. Robust Listener
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Lumora Backend Engine is LIVE on 0.0.0.0:${PORT}`);
});

// 4. Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { prisma };
