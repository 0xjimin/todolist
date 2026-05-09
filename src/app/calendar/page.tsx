'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Todo, Folder } from '@/types';
import styles from './calendar.module.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
    fetchFolders();
  }, [currentDate]);

  const fetchFolders = async () => {
    const { data, error } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setFolders(data);
      if (data.length > 0) {
        setSelectedFolder(data[0].id);
      }
    }
  };

  const fetchTodos = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Format to YYYY-MM-DD
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('todos')
      .select('*, folders(*)')
      .gte('target_date', startStr)
      .lte('target_date', endStr);

    if (!error && data) {
      setTodos(data);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedDate) return;

    setIsLoading(true);
    const content = inputValue.trim();
    setInputValue('');

    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      const { difficulty } = await res.json();

      const { data, error } = await supabase
        .from('todos')
        .insert([{
          content,
          difficulty: difficulty || '중간',
          folder_id: selectedFolder || null,
          target_date: format(selectedDate, 'yyyy-MM-dd')
        }])
        .select('*, folders(*)')
        .single();

      if (!error && data) {
        setTodos(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={24} /></button>
        <h1>{format(currentDate, 'MMMM yyyy')}</h1>
        <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={24} /></button>
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekdays}>
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>
        
        <div className={styles.daysGrid}>
          {daysInMonth.map(day => {
            const dayTodos = todos.filter(t => t.target_date === format(day, 'yyyy-MM-dd'));
            return (
              <div 
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`${styles.dayCell} ${!isSameMonth(day, currentDate) ? styles.otherMonth : ''} ${isSameDay(day, new Date()) ? styles.today : ''}`}
              >
                <div className={styles.dayNumber}>{format(day, 'd')}</div>
                <div className={styles.todoDots}>
                  {dayTodos.map(todo => (
                    <div 
                      key={todo.id} 
                      className={styles.todoDot}
                      style={{ backgroundColor: todo.folders?.color || 'var(--accent-color)' }}
                      title={todo.content}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Basic modal for selected date (we can just redirect to main page or add simple input here) */}
      {selectedDate && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDate(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{format(selectedDate, 'yyyy-MM-dd')}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedDate(null)}>
                <X size={24} />
              </button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto'}}>
              {todos.filter(t => t.target_date === format(selectedDate, 'yyyy-MM-dd')).map(t => (
                <div key={t.id} style={{padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                   <div style={{width: '10px', height: '10px', backgroundColor: t.folders?.color || '#fff', borderRadius: '50%'}}/>
                   <span style={{flex: 1}}>{t.content}</span>
                   <span style={{fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)'}}>{t.difficulty}</span>
                </div>
              ))}
              {todos.filter(t => t.target_date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                <div style={{color: 'var(--text-secondary)'}}>이 날짜에 할 일이 없습니다.</div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem'}}>
              <input
                type="text"
                placeholder="새 할 일 입력..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                disabled={isLoading || folders.length === 0}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              >
                <option value="">폴더 선택</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button 
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                style={{
                  background: 'var(--accent-color)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !inputValue.trim() ? 0.5 : 1
                }}
              >
                {isLoading ? '...' : '추가'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
