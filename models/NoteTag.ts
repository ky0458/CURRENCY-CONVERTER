import mongoose from 'mongoose';

const noteTagSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    tags: { type: Array, default: [] }
}, {
    timestamps: true
});

export const NoteTag = mongoose.models.NoteTag || mongoose.model<any>('NoteTag', noteTagSchema, 'note_tags');
