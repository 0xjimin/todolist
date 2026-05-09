export type Folder = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Todo = {
  id: string;
  content: string;
  difficulty: '쉬움' | '중간' | '어려움' | null;
  is_completed: boolean;
  folder_id: string | null;
  target_date: string | null;
  created_at: string;
  folders?: Folder; // For joined queries
};
