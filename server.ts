import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { ChatSession } from './models/ChatSession.js';

import { NotebookContent } from './models/NotebookContent.js';

import { ConvertHistory } from './models/ConvertHistory.js';
import { StatisticsHistory } from './models/StatisticsHistory.js';
import { UpdateVersion } from './models/UpdateVersion.js';
import { AppConfig } from './models/AppConfig.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', 
      'https://giahanconverter.vercel.app'
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS for origin:', origin);
      callback(null, false); // Allow it conditionally or return an error depending on strictness. Let's return error so it fails properly if wrong domain
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Database connection helper for serverless environment
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set. Skipping DB connection.');
    return;
  }
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Ensure DB connection before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error: Database connection failed' });
  }
});

// API Routes
app.get('/api/db-status', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({ 
    connected: isConnected, 
    uriConfigured: !!process.env.MONGODB_URI,
    readyState: mongoose.connection.readyState
  });
});

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
      { returnDocument: 'after', upsert: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user presence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat History API
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json([]);
    
    // Explicitly stripping mongoose document fields, although res.json does that. 
    // Adding lean() just to be safe.
    const sessions = await ChatSession.find({ userId: uid as string }).sort({ updatedAt: -1 }).lean();
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/sync', async (req, res) => {
  try {
    const { uid, localSessions } = req.body;
    if (!uid || !localSessions || !Array.isArray(localSessions)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    if (!process.env.MONGODB_URI) return res.json(localSessions);

    if (localSessions.length > 0) {
      const bulkOps = localSessions.map((session: any) => ({
        updateOne: {
          filter: { id: session.id },
          update: { $set: { ...session, userId: uid } },
          upsert: true
        }
      }));
      await ChatSession.bulkWrite(bulkOps);
    }
    
    const sessions = await ChatSession.find({ userId: uid }).sort({ updatedAt: -1 }).lean();
    res.json(sessions);
  } catch (err) {
    console.error('Error syncing sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/sessions', async (req, res) => {
  try {
    const { uid, session } = req.body;
    if (!uid || !session || !session.id) return res.status(400).json({ error: 'Invalid payload' });
    if (!process.env.MONGODB_URI) return res.json(session);
    
    const updatedSession = await ChatSession.findOneAndUpdate(
      { id: session.id },
      { $set: { ...session, userId: uid } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    res.json(updatedSession);
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    await ChatSession.findOneAndDelete({ id, userId: uid });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notes API
app.get('/api/notes', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json(null);
    
    // Using lean() for better performance
    const content = await NotebookContent.findOne({ userId: uid as string }).lean();
    res.json(content || { notes: [], tags: [] });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { uid, notes, tags } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    const content = await NotebookContent.findOneAndUpdate(
      { userId: uid as string },
      { $set: { notes: notes || [], tags: tags || [] } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/convert-history', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json(null);
    
    const content = await ConvertHistory.findOne({ userId: uid as string }).lean();
    res.json(content || { conversions: [] });
  } catch (err) {
    console.error('Error fetching convert history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/convert-history/conversions', async (req, res) => {
  try {
    const { uid, conversions } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    const content = await ConvertHistory.findOneAndUpdate(
      { userId: uid as string },
      { $set: { conversions: conversions || [] } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving conversions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics-history', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json(null);
    
    const content = await StatisticsHistory.findOne({ userId: uid as string }).lean();
    res.json(content || { revenues: [] });
  } catch (err) {
    console.error('Error fetching statistics history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/statistics-history/revenues', async (req, res) => {
  try {
    const { uid, revenues } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    const content = await StatisticsHistory.findOneAndUpdate(
      { userId: uid as string },
      { $set: { revenues: revenues || [] } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving statistics records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/app-releases', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.json([]);
    }
    const versions = await UpdateVersion.find().sort({ timestamp: -1 }).lean();
    res.json(versions);
  } catch (err) {
    console.error('Error fetching updater versions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
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

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  startServer();
}

export default app;
