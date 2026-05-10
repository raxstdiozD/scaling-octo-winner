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

import audioRoutes from './routes/audioRoutes';
import imageRoutes from './routes/imageRoutes';

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'active', engine: 'Lumora High-Performance', timestamp: new Date().toISOString() });
});

// Register Routes
app.use('/', audioRoutes);
app.use('/', imageRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Lumora Backend Engine is LIVE on port ${PORT}`);
  console.log(`🔗 Health check available at: http://0.0.0.0:${PORT}/health`);
});

export { prisma };
