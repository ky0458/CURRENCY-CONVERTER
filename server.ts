import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import mongoose from 'mongoose';
import { User } from './models/User';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));
} else {
  console.warn('MONGODB_URI environment variable is not set. MongoDB will not be connected.');
}

// API Routes
app.post('/api/users/presence', async (req, res) => {
  try {
    const { uid, displayName, photoURL, email, lastSeen, status } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    if (!process.env.MONGODB_URI) {
       return res.status(503).json({ error: 'Database not configured' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { 
        uid, 
        displayName, 
        photoURL, 
        email, 
        lastSeen, 
        status 
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user presence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
