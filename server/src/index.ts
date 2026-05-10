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

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'active', engine: 'Lumora High-Performance', timestamp: new Date().toISOString() });
});

// Import Routes (Placeholder for actual tool routes)
// app.use('/api/video', videoRoutes);
// app.use('/api/audio', audioRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Lumora Backend Engine running on port ${PORT}`);
});

export { prisma };
