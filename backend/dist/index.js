import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
app.get('/', (_req, res) => {
    res.send('Hello from Backend!');
});
app.get('/users', async (_req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/users', async (req, res) => {
    const { email, name } = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                email,
                name,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: 'User already exists or invalid data' });
    }
});
const PORT = process.env['PORT'] || 3001;
app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});
const frontendApp = express();
const FRONTEND_PORT = process.env['FRONTEND_PORT'] || 3002;
const frontendBuildPath = path.join(__dirname, '../../web/dist');
frontendApp.use(express.static(frontendBuildPath));
frontendApp.get('*', (_req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
frontendApp.listen(FRONTEND_PORT, () => {
    console.log(`Frontend served on port ${FRONTEND_PORT}`);
});
