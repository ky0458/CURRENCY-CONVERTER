import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import mongoose from 'mongoose';
import { User } from './models/User';
import { ChatSession } from './models/ChatSession';

import { NotebookContent } from './models/NotebookContent';

import { ConvertHistory } from './models/ConvertHistory';
import { StatisticsHistory } from './models/StatisticsHistory';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://giahanconverter.vercel.app'
  ],
  credentials: true
}));
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
      { new: true, upsert: true }
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
      { new: true, upsert: true }
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
      { new: true, upsert: true }
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
      { new: true, upsert: true }
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
      { new: true, upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving statistics records:', err);
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

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  startServer();
}

export default app;
