export type MessageRole = 'user' | 'ai';

export interface Message {
  id: number;
  role: MessageRole;
  text: string;
  created_at: string;
}

export interface ScenarioSummary {
  id: number;
  name: string;
  icon: string;
}

export interface Conversation {
  id: number;
  scenario: ScenarioSummary;
  created_at: string;
  finished_at: string | null;
  messages: Message[];
}

export interface SendMessageResult {
  user_message: Message;
  ai_message: Message;
}
