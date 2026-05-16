
import { useState, useEffect } from 'react';
import { Note, NoteTag, NoteStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_TAGS: NoteTag[] = [
  { id: 'personal', name: 'Cá nhân', color: '#3b82f6', isPinned: false },
  { id: 'work', name: 'Công việc', color: '#10b981', isPinned: true },
  { id: 'idea', name: 'Ý tưởng', color: '#f59e0b', isPinned: false },
];

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>(DEFAULT_TAGS);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, loading } = useAuth();

  const loadData = async (isRefocus = false) => {
      if (loading) return;
      if (!isRefocus) setIsLoading(true);
      try {
        const savedNotesStr = localStorage.getItem('app_notes');
        const savedNotesOwner = localStorage.getItem('app_notes_owner');
        const savedTagsStr = localStorage.getItem('app_note_tags');
        const savedTagsOwner = localStorage.getItem('app_note_tags_owner');
        const currentOwner = user?.uid || 'guest';
        
        let localNotes = [];
        let localTags = DEFAULT_TAGS;

        const shouldLoadLocalNotes = !savedNotesOwner || savedNotesOwner === currentOwner || savedNotesOwner === 'guest';
        const shouldLoadLocalTags = !savedTagsOwner || savedTagsOwner === currentOwner || savedTagsOwner === 'guest';

        if (shouldLoadLocalNotes) {
            localNotes = savedNotesStr ? JSON.parse(savedNotesStr) : [];
        }
        if (shouldLoadLocalTags) {
            localTags = savedTagsStr ? JSON.parse(savedTagsStr) : DEFAULT_TAGS;
        }

        if (user && user.uid) {
          try {
            const response = await fetch(`/api/notes?uid=${user.uid}`, { headers: { 'x-user-uid': user.uid }});
            if (response.ok) {
              const data = await response.json();
              if (data) {
                const dbNotes = data.notes || [];
                const dbTags = data.tags || [];

                const mergedNotesMap = new Map();
                if (!isRefocus) {
                    localNotes.forEach((n: Note) => mergedNotesMap.set(n.id, n));
                }
                dbNotes.forEach((n: Note) => mergedNotesMap.set(n.id, n));
                
                const mergedTagsMap = new Map();
                if (!isRefocus) {
                    localTags.forEach((t: NoteTag) => mergedTagsMap.set(t.id, t));
                }
                dbTags.forEach((t: NoteTag) => mergedTagsMap.set(t.id, t));

                const finalNotes = Array.from(mergedNotesMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
                const finalTags = Array.from(mergedTagsMap.values());

                setNotes(finalNotes);
                setTags(finalTags);

                localStorage.setItem('app_notes', JSON.stringify(finalNotes));
                localStorage.setItem('app_note_tags', JSON.stringify(finalTags));
                localStorage.setItem('app_notes_owner', user.uid);
                localStorage.setItem('app_note_tags_owner', user.uid);

                if (!isRefocus) {
                    await Promise.all([
                       fetch('/api/notes', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                         body: JSON.stringify({ uid: user.uid, notes: finalNotes })
                       }),
                       fetch('/api/note-tags', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                         body: JSON.stringify({ uid: user.uid, tags: finalTags })
                       })
                    ]);
                }
                
                if (!isRefocus) setIsLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error('Error fetching notes from DB', err);
          }
        }
        
        setNotes(localNotes);
        setTags(localTags);
      } catch (e) {
        console.error("Failed to load notes", e);
      } finally {
        if (!isRefocus) setIsLoading(false);
      }
    };

  // Load Data
  useEffect(() => {
    loadData();
  }, [user, loading]);

  // Sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Helper to save everything to LocalStorage & DB
  const persistData = async (newNotes: Note[], newTags: NoteTag[]) => {
    localStorage.setItem('app_notes', JSON.stringify(newNotes));
    localStorage.setItem('app_note_tags', JSON.stringify(newTags));
    localStorage.setItem('app_notes_owner', user?.uid || 'guest');
    localStorage.setItem('app_note_tags_owner', user?.uid || 'guest');
    
    if (user && user.uid) {
      try {
        await Promise.all([
           fetch('/api/notes', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
             body: JSON.stringify({ uid: user.uid, notes: newNotes })
           }),
           fetch('/api/note-tags', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
             body: JSON.stringify({ uid: user.uid, tags: newTags })
           })
        ]);
      } catch (err) {
        console.error('Error syncing notes to DB', err);
      }
    }
  };

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    persistData(newNotes, tags);
  };

  const saveTags = (newTags: NoteTag[]) => {
    setTags(newTags);
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
