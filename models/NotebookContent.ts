import mongoose from 'mongoose';

const notebookContentSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    notes: { type: Array, default: [] },
    tags: { type: Array, default: [] }
}, {
    timestamps: true
});

export const NotebookContent = mongoose.models.NotebookContent || mongoose.model('NotebookContent', notebookContentSchema, 'notebook_contents');
