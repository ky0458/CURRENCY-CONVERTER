
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
  
  const { user } = useAuth();

  // Load Data
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const savedNotes = localStorage.getItem('app_notes');
        const savedTags = localStorage.getItem('app_note_tags');
        
        let parsedNotes = [];
        let parsedTags = DEFAULT_TAGS;

        if (savedNotes) parsedNotes = JSON.parse(savedNotes);
        if (savedTags) parsedTags = JSON.parse(savedTags);
        
        setNotes(parsedNotes);
        setTags(parsedTags);
      } catch (e) {
        console.error("Failed to load notes", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Helper to save everything to LocalStorage
  const persistData = (newNotes: Note[], newTags: NoteTag[]) => {
    localStorage.setItem('app_notes', JSON.stringify(newNotes));
    localStorage.setItem('app_note_tags', JSON.stringify(newTags));
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
