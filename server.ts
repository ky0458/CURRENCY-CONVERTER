import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { ChatSession } from './models/ChatSession.js';

import { NotebookContent } from './models/NotebookContent.js';
import { NoteTag } from './models/NoteTag.js';

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

const ensureAdmin = async (req: any, res: any, next: any) => {
  const adminUid = req.headers['x-admin-uid'];
  if (!adminUid) return res.status(403).json({ error: 'Access denied: Admin UID required' });
  
  try {
    await connectToDatabase();
    const adminUser = await User.findOne({ uid: adminUid, isAdmin: true });
    if (!adminUser) return res.status(403).json({ error: 'Access denied: Not an administrator' });
    next();
  } catch (e) {
    res.status(500).json({ error: 'Security check failed' });
  }
};

const ensureAuth = (req: any, res: any, next: any) => {
  const uid = req.headers['x-user-uid'] || req.query?.uid || req.body?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized: Missing User UID' });
  req.userUid = uid;
  next();
};

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

app.post('/api/users/presence', ensureAuth, async (req, res) => {
  try {
    const { uid, displayName, photoURL, email, lastSeen, status, deviceInfo } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    if (!process.env.MONGODB_URI) {
       return res.status(503).json({ error: 'Database not configured' });
    }

    const userExists = await User.findOne({ uid });
    
    if (userExists && userExists.isLocked) {
        return res.status(403).json({ error: 'LOCKED' });
    }

    let increment = 0;
    
    if (userExists) {
        // Calculate the time difference in seconds
        const timeDiff = (Date.now() - (userExists.lastSeen || Date.now())) / 1000;
        
        // If the previous status was online and time difference is reasonable (e.g., up to 10 minutes to account for interval + lag)
        if (userExists.status === 'online' && timeDiff > 0 && timeDiff < 600) {
           increment = timeDiff;
        }
    }

    const updateFields: any = {
      uid, 
      displayName, 
      photoURL, 
      email, 
      lastSeen, 
      status 
    };

    const updateQuery: any = {
      $set: updateFields,
      $inc: {
        appUsageTime: increment
      }
    };

    if (deviceInfo) {
      updateQuery.$addToSet = { devices: deviceInfo };
    }

    const user = await User.findOneAndUpdate(
      { uid },
      updateQuery,
      { returnDocument: 'after', upsert: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user presence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat History API
app.get('/api/chat/sessions', ensureAuth, async (req, res) => {
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

app.post('/api/chat/sync', ensureAuth, async (req, res) => {
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

app.post('/api/chat/sessions', ensureAuth, async (req, res) => {
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

app.delete('/api/chat/sessions/:id', ensureAuth, async (req, res) => {
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
app.get('/api/notes', ensureAuth, async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ notes: [], tags: [] });
    
    // Using lean() for better performance
    const content = await NotebookContent.findOne({ userId: uid as string }).lean();
    const tagContent = await NoteTag.findOne({ userId: uid as string }).lean();
    
    res.json({
        notes: content?.notes || [],
        tags: tagContent?.tags || []
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/notes', ensureAuth, async (req, res) => {
  try {
    const { uid, notes } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    const content = await NotebookContent.findOneAndUpdate(
      { userId: uid as string },
      { $set: { notes: notes || [] } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/note-tags', ensureAuth, async (req, res) => {
  try {
    const { uid, tags } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    
    const content = await NoteTag.findOneAndUpdate(
      { userId: uid as string },
      { $set: { tags: tags || [] } },
      { returnDocument: 'after', upsert: true }
    ).lean();
    
    res.json(content);
  } catch (err) {
    console.error('Error saving note tags:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/convert-history', ensureAuth, async (req, res) => {
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

app.post('/api/convert-history/conversions', ensureAuth, async (req, res) => {
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

app.get('/api/statistics-history', ensureAuth, async (req, res) => {
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

app.post('/api/statistics-history/revenues', ensureAuth, async (req, res) => {
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

// Admin Middleware
const checkAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminUid = (req.query?.adminUid as string) || (req.body?.adminUid as string) || (req.headers['x-admin-uid'] as string);
  if (!adminUid) {
    return res.status(401).json({ error: 'Unauthorized: missing adminUid' });
  }
  try {
    const adminUser = await User.findOne({ uid: adminUid }).lean();
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: not admin' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during auth check' });
  }
};

app.use('/api/admin', checkAdmin);

// Admin APIs
app.get('/api/admin/users', ensureAdmin, async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.json([]);
    const users = await User.find().sort({ lastSeen: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/admin/users/:uid/role', ensureAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { isAdmin } = req.body;
    await User.findOneAndUpdate({ uid }, { isAdmin });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:uid/lock', ensureAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { isLocked } = req.body;
    await User.findOneAndUpdate({ uid }, { $set: { isLocked } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:uid', ensureAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    await Promise.all([
      User.findOneAndDelete({ uid }),
      NotebookContent.findOneAndDelete({ userId: uid }),
      NoteTag.findOneAndDelete({ userId: uid }),
      ConvertHistory.findOneAndDelete({ userId: uid }),
      StatisticsHistory.findOneAndDelete({ userId: uid }),
      ChatSession.deleteMany({ userId: uid }),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/user-details/:uid', ensureAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    if (!process.env.MONGODB_URI) return res.json(null);
    
    const [notes, tags, convertHistory, statsHistory, chatSessions] = await Promise.all([
      NotebookContent.findOne({ userId: uid }).lean(),
      NoteTag.findOne({ userId: uid }).lean(),
      ConvertHistory.findOne({ userId: uid }).lean(),
      StatisticsHistory.findOne({ userId: uid }).lean(),
      ChatSession.find({ userId: uid }).sort({ updatedAt: -1 }).lean()
    ]);
    
    res.json({
      notes: notes?.notes || [],
      tags: tags?.tags || [],
      convertHistory: convertHistory?.conversions || [],
      statsHistory: statsHistory?.revenues || [],
      chatSessions: chatSessions || []
    });
  } catch (err) {
    console.error('Error fetching admin user details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/all-tags', ensureAdmin, async (req, res) => {
  try {
    const [docs, users] = await Promise.all([ NoteTag.find().lean(), User.find().lean() ]);
    const userMap = new Map(users.map((u: any) => [u.uid, u]));
    let flat: any[] = [];
    docs.forEach((doc: any) => {
        const u = userMap.get(doc.userId);
        (doc.tags || []).forEach((item: any) => {
            flat.push({ ...item, userId: doc.userId, userName: u?.displayName || 'Unknown', userEmail: u?.email || '' });
        });
    });
    res.json(flat);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.get('/api/admin/all-notes', ensureAdmin, async (req, res) => {
  try {
    const [docs, users] = await Promise.all([ NotebookContent.find().lean(), User.find().lean() ]);
    const userMap = new Map(users.map((u: any) => [u.uid, u]));
    let flat: any[] = [];
    docs.forEach((doc: any) => {
        const u = userMap.get(doc.userId);
        (doc.notes || []).forEach((item: any) => {
            flat.push({ ...item, userId: doc.userId, userName: u?.displayName || 'Unknown', userEmail: u?.email || '' });
        });
    });
    flat.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    res.json(flat);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.get('/api/admin/all-stats', ensureAdmin, async (req, res) => {
  try {
    const [docs, users] = await Promise.all([ StatisticsHistory.find().lean(), User.find().lean() ]);
    const userMap = new Map(users.map((u: any) => [u.uid, u]));
    let flat: any[] = [];
    docs.forEach((doc: any) => {
        const u = userMap.get(doc.userId);
        (doc.revenues || []).forEach((item: any) => {
            flat.push({ ...item, userId: doc.userId, userName: u?.displayName || 'Unknown', userEmail: u?.email || '' });
        });
    });
    flat.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    res.json(flat);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.get('/api/admin/all-chats', ensureAdmin, async (req, res) => {
  try {
    const [docs, users] = await Promise.all([ ChatSession.find().lean(), User.find().lean() ]);
    const userMap = new Map(users.map((u: any) => [u.uid, u]));
    const list = docs.map((doc: any) => {
      const u = userMap.get(doc.userId);
      return {
        ...doc,
        userName: u?.displayName || 'Unknown',
        userEmail: u?.email || ''
      };
    });
    list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    res.json(list);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.get('/api/admin/models', ensureAdmin, async (req, res) => {
  try {
    const config = await AppConfig.findOne({ key: 'ai_models' });
    res.json(config ? config.value : []);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.get('/api/models', ensureAuth, async (req, res) => {
  try {
    const config = await AppConfig.findOne({ key: 'ai_models' });
    res.json(config ? config.value : []);
  } catch (err) { res.status(500).json({ error: 'Internal error' }); }
});

app.post('/api/admin/models', ensureAdmin, async (req, res) => {
  try {
    const { name, modelKey } = req.body;
    let config = await AppConfig.findOne({ key: 'ai_models' });
    if (!config) {
      config = new AppConfig({ key: 'ai_models', value: [] });
    }
    const newModel = { id: Math.random().toString(36).substring(7), name, modelKey };
    config.value.push(newModel);
    await config.save();
    res.json(config.value);
  } catch(err) {
    res.status(500).json({ error: 'System error' });
  }
});

app.delete('/api/admin/models/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let config = await AppConfig.findOne({ key: 'ai_models' });
    if (config) {
      config.value = config.value.filter((m: any) => m.id !== id);
      await config.save();
    }
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'System error' });
  }
});

app.put('/api/admin/models/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, modelKey } = req.body;
    let config = await AppConfig.findOne({ key: 'ai_models' });
    if (config) {
      const idx = config.value.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        config.value[idx].name = name;
        config.value[idx].modelKey = modelKey;
      }
      config.markModified('value');
      await config.save();
    }
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'System error' });
  }
});

app.delete('/api/admin/user-details/:uid/chats/:sessionId', ensureAdmin, async (req, res) => {
  try {
    const { uid, sessionId } = req.params;
    await ChatSession.findOneAndDelete({ id: sessionId, userId: uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/user-details/:uid/notes/:noteId', ensureAdmin, async (req, res) => {
  try {
    const { uid, noteId } = req.params;
    await NotebookContent.findOneAndUpdate(
      { userId: uid },
      { $pull: { notes: { id: noteId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/user-details/:uid/tags/:tagId', ensureAdmin, async (req, res) => {
  try {
    const { uid, tagId } = req.params;
    await NoteTag.findOneAndUpdate(
      { userId: uid },
      { $pull: { tags: { id: tagId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/user-details/:uid/conversions/:conversionId', ensureAdmin, async (req, res) => {
  try {
    const { uid, conversionId } = req.params;
    await ConvertHistory.findOneAndUpdate(
      { userId: uid },
      { $pull: { conversions: { id: conversionId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/user-details/:uid/stats/:statId', ensureAdmin, async (req, res) => {
  try {
    const { uid, statId } = req.params;
    await StatisticsHistory.findOneAndUpdate(
      { userId: uid },
      { $pull: { revenues: { id: statId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/releases', ensureAdmin, async (req, res) => {
  try {
    const { version, title } = req.body;
    const newRelease = new UpdateVersion({
      version,
      title,
      timestamp: Date.now(),
      viewedBy: []
    });
    await newRelease.save();
    res.json(newRelease);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/releases/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await UpdateVersion.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
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
