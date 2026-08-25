export type AppState = 'home' | 'building' | 'workspace' | 'all-projects';

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 without prefix
}

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  color: string;
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export interface Project {
  id: string;
  title: string;
  files: CodeFile[];
  history: ChatMessage[];
  updatedAt: number;
}
