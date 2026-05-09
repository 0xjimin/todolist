'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Todo, Folder } from '@/types';
import styles from './folderDetail.module.css';
import { useParams } from 'next/navigation';

export default function FolderDetailPage() {
  const params = useParams();
  const folderId = params.id as string;
  
  const [folder, setFolder] = useState<Folder | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (folderId) {
      fetchData();
    }
  }, [folderId]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch folder
    const { data: folderData } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();
      
    if (folderData) setFolder(folderData);

    // Fetch todos
    const { data: todosData } = await supabase
      .from('todos')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
      
    if (todosData) setTodos(todosData);
    
    setIsLoading(false);
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!folder) return <div>Folder not found</div>;

  const incompleteTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: folder.color }} />
          <h1 className={styles.title}>{folder.name}</h1>
        </div>
        <div className={styles.meta}>
          <span>Created: {new Date(folder.created_at).toLocaleDateString()}</span>
          <span>Tasks: {completedTodos.length} completed / {incompleteTodos.length} pending</span>
        </div>
      </div>

      <div className={styles.todoList}>
        <h2 className={styles.sectionTitle}>Incomplete Tasks</h2>
        {incompleteTodos.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No incomplete tasks.</p>}
        {incompleteTodos.map(todo => (
          <div key={todo.id} className={styles.todoItem}>
            <input 
              type="checkbox" 
              className={styles.todoCheckbox}
              checked={todo.is_completed}
              onChange={() => toggleTodo(todo.id, todo.is_completed)}
            />
            <div className={styles.todoContent}>{todo.content}</div>
            <span className={`${styles.badge} ${
              todo.difficulty === '쉬움' ? styles.easy :
              todo.difficulty === '어려움' ? styles.hard : styles.medium
            }`}>
              {todo.difficulty}
            </span>
          </div>
        ))}

        <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Completed Tasks</h2>
        {completedTodos.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No completed tasks.</p>}
        {completedTodos.map(todo => (
          <div key={todo.id} className={`${styles.todoItem} ${styles.completed}`}>
            <input 
              type="checkbox" 
              className={styles.todoCheckbox}
              checked={todo.is_completed}
              onChange={() => toggleTodo(todo.id, todo.is_completed)}
            />
            <div className={styles.todoContent}>{todo.content}</div>
            <span className={`${styles.badge} ${
              todo.difficulty === '쉬움' ? styles.easy :
              todo.difficulty === '어려움' ? styles.hard : styles.medium
            }`}>
              {todo.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
