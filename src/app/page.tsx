'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Todo, Folder } from '@/types';
import styles from './page.module.css';
import { Send, Trash2 } from 'lucide-react';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchFolders();
    fetchTodos();
  }, []);

  const fetchFolders = async () => {
    const { data, error } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setFolders(data);
      if (data.length > 0 && !selectedFolder) {
        setSelectedFolder(data[0].id);
      }
    }
  };

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*, folders(*)')
      .order('created_at', { ascending: false });
    if (!error && data) setTodos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    const content = inputValue.trim();
    setInputValue('');

    try {
      // Get difficulty from Gemini API
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      const { difficulty } = await res.json();

      // Save to Supabase
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          content,
          difficulty: difficulty || '중간',
          folder_id: selectedFolder || null,
          target_date: new Date().toISOString().split('T')[0]
        }])
        .select('*, folders(*)')
        .single();

      if (!error && data) {
        setTodos(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsLoading(false);
    }
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

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTodos(prev => prev.filter(t => t.id !== id));
    }
  };

  // Filter and sort
  let displayedTodos = todos.filter(t => {
    if (filter === 'ongoing') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  displayedTodos.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>TO DO LIST</h1>
      </header>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'ongoing' ? styles.active : ''}`}
            onClick={() => setFilter('ongoing')}
          >
            Ongoing
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        <select 
          className={styles.sortSelect}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
        >
          <option value="desc">내림차순 (Newest)</option>
          <option value="asc">오름차순 (Oldest)</option>
        </select>
      </div>

      <div className={styles.todoList}>
        {displayedTodos.map(todo => (
          <div key={todo.id} className={`${styles.todoItem} ${todo.is_completed ? styles.completed : ''} animate-fade-in`}>
            <input 
              type="checkbox" 
              className={styles.todoCheckbox}
              checked={todo.is_completed}
              onChange={() => toggleTodo(todo.id, todo.is_completed)}
            />
            
            <div className={styles.todoContent}>
              {todo.content}
            </div>

            {todo.folders && (
              <span className={styles.badge} style={{ background: `${todo.folders.color}33`, color: todo.folders.color }}>
                {todo.folders.name}
              </span>
            )}

            <span className={`${styles.badge} ${
              todo.difficulty === '쉬움' ? styles.easy :
              todo.difficulty === '어려움' ? styles.hard : styles.medium
            }`}>
              {todo.difficulty}
            </span>

            <button className={styles.deleteBtn} onClick={() => deleteTodo(todo.id)}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.todoItem} ${styles.typingIndicator}`}>
            <span>AI가 난이도를 분석중입니다</span>
            <div className={styles.dots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}
      </div>

      <form className={styles.inputSection} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.todoInput}
            placeholder="새로운 할 일을 입력하세요..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <select 
            className={styles.folderSelect}
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            disabled={isLoading || folders.length === 0}
          >
            <option value="">폴더 선택</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button type="submit" className={styles.submitBtn} disabled={isLoading || !inputValue.trim()}>
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
