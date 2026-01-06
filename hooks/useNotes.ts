import { useState, useEffect } from 'react';
import { Note, NoteTag, NoteStatus } from '../types';

const DEFAULT_TAGS: NoteTag[] = [
  { id: 'personal', name: 'Cá nhân', color: '#3b82f6', isPinned: false }, // Blue
  { id: 'work', name: 'Công việc', color: '#10b981', isPinned: true },   // Emerald (Pinned by default example)
  { id: 'idea', name: 'Ý tưởng', color: '#f59e0b', isPinned: false },     // Amber
];

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>(DEFAULT_TAGS);

  // Load data
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('app_notes');
      const savedTags = localStorage.getItem('app_note_tags');
      
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedTags) setTags(JSON.parse(savedTags));
      else setTags(DEFAULT_TAGS);
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  }, []);

  // Save data helpers
  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('app_notes', JSON.stringify(newNotes));
  };

  const saveTags = (newTags: NoteTag[]) => {
    setTags(newTags);
    localStorage.setItem('app_note_tags', JSON.stringify(newTags));
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

  const deleteTag = (id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  };

  const toggleTagPin = (id: string) => {
    const updatedTags = tags.map(t => 
        t.id === id ? { ...t, isPinned: !t.isPinned } : t
    );
    saveTags(updatedTags);
  };

  // Sort tags: Pinned first
  const sortedTags = [...tags].sort((a, b) => {
      // If one is pinned and other isn't, pinned comes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Otherwise keep original order (or sort by ID/Name if desired)
      return 0; 
  });

  return {
    notes,
    tags: sortedTags, // Return sorted tags
    addNote,
    updateNoteStatus,
    deleteNote,
    deleteNotes,
    addTag,
    deleteTag,
    toggleTagPin
  };
};