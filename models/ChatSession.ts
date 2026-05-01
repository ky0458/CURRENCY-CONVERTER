import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    timestamp: { type: Number, required: true },
    attachmentMimeType: { type: String },
    attachmentName: { type: String }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    isPinned: { type: Boolean, default: false },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
    messages: [messageSchema]
}, {
    timestamps: true
});

export const ChatSession = mongoose.models.ChatSession || mongoose.model<any>('ChatSession', chatSessionSchema, 'ai_chat_history');
