
import { useState, useEffect } from 'react';
import { Note, NoteTag, NoteStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_TAGS: NoteTag[] = [
  { id: 'personal', name: 'Cá nhân', color: '#3b82f6', isPinned: false },
  { id: 'work', name: 'Công việc', color: '#10b981', isPinned: true },
  { id: 'idea', name: 'Ý tưởng', color: '#f59e0b', isPinned: false },
];

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>(DEFAULT_TAGS);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();

  // Load Data & Sync Real-time
  useEffect(() => {
    let unsubscribe = () => {};
    setIsLoading(true);

    if (user) {
        // LOGGED IN: Listen to Firestore changes
        const docRef = doc(db, "users", user.uid);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setNotes(data.notes || []);
                setTags(data.tags || DEFAULT_TAGS);
            } else {
                // New user - keep defaults or empty
                setNotes([]);
                setTags(DEFAULT_TAGS);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore notes sync error", error);
            setIsLoading(false);
        });
    } else {
        // GUEST: Load from LocalStorage
        try {
          const savedNotes = localStorage.getItem('app_notes');
          const savedTags = localStorage.getItem('app_note_tags');
          
          if (savedNotes) setNotes(JSON.parse(savedNotes));
          else setNotes([]);

          if (savedTags) setTags(JSON.parse(savedTags));
          else setTags(DEFAULT_TAGS);
        } catch (e) {
          console.error("Failed to load notes from LocalStorage", e);
        } finally {
          setIsLoading(false);
        }
    }

    return () => unsubscribe();
  }, [user]);

  // Helper to save everything to Firestore or LocalStorage
  const persistData = async (newNotes: Note[], newTags: NoteTag[]) => {
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { notes: newNotes, tags: newTags }, { merge: true });
      } catch (e) {
        console.error("Failed to save notes/tags to Firestore", e);
      }
    } else {
      localStorage.setItem('app_notes', JSON.stringify(newNotes));
      localStorage.setItem('app_note_tags', JSON.stringify(newTags));
    }
  };

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes); // Optimistic Update
    persistData(newNotes, tags);
  };

  const saveTags = (newTags: NoteTag[]) => {
    setTags(newTags); // Optimistic Update
    persistData(notes, newTags);
  };

  // Note Actions
  const addNote = (content: string, tagId: string | null) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      status: 'incomplete',
      tagId
    };
    saveNotes([newNote, ...notes]);
  };

  const updateNoteStatus = (id: string, status: NoteStatus) => {
    const updated = notes.map(n => n.id === id ? { ...n, status } : n);
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  const deleteNotes = (ids: string[]) => {
    saveNotes(notes.filter(n => !ids.includes(n.id)));
  };

  const setNoteReminder = (id: string, time: number) => {
    const updated = notes.map(n => n.id === id ? { ...n, reminderTime: time } : n);
    saveNotes(updated);
  };

  // Tag Actions
  const addTag = (name: string, color: string) => {
    const newTag: NoteTag = {
      id: Date.now().toString(),
      name,
      color,
      isPinned: false
    };
    saveTags([...tags, newTag]);
  };

  const updateTag = (id: string, name: string, color: string) => {
    const updatedTags = tags.map(t => 
        t.id === id ? { ...t, name, color } : t
    );
    saveTags(updatedTags);
  };

  const deleteTag = (id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  };

  const deleteTags = (ids: string[]) => {
    saveTags(tags.filter(t => !ids.includes(t.id)));
  };

  const toggleTagPin = (id: string) => {
    const updatedTags = tags.map(t => 
        t.id === id ? { ...t, isPinned: !t.isPinned } : t
    );
    saveTags(updatedTags);
  };

  const sortedTags = [...tags].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; 
  });

  return {
    notes,
    tags: sortedTags,
    isLoading,
    addNote,
    updateNoteStatus,
    deleteNote,
    deleteNotes,
    addTag,
    updateTag,
    deleteTag,
    deleteTags,
    toggleTagPin,
    setNoteReminder
  };
};
