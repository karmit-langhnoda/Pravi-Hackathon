import { createPgModel } from '../lib/pgModel.js';

export const ChatSession = createPgModel('chat_sessions', 'ChatSession');
