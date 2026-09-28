import { createPgModel } from '../lib/pgModel.js';

export const Document = createPgModel('documents', 'Document');
export const DocumentChunk = createPgModel('document_chunks', 'DocumentChunk');
