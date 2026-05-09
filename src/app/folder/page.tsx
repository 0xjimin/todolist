'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Folder } from '@/types';
import styles from './folder.module.css';
import { Folder as FolderIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const PRESET_COLORS = [
  '#FF5C5C', '#FF8A00', '#FFCF00', '#5CFF85',
  '#5C85FF', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#06B6D4', '#84CC16', '#6366F1',
];

type ModalMode = 'create' | 'edit';

export default function FolderPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const { data, error } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
    if (!error && data) setFolders(data);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingFolder(null);
    setFolderName('');
    setSelectedColor(PRESET_COLORS[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    setModalMode('edit');
    setEditingFolder(folder);
    setFolderName(folder.name);
    setSelectedColor(folder.color);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFolder(null);
  };

  const handleSave = async () => {
    if (!folderName.trim()) return;
    setIsSaving(true);

    if (modalMode === 'create') {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: folderName.trim(), color: selectedColor }])
        .select()
        .single();
      if (!error && data) setFolders(prev => [...prev, data]);
    } else if (editingFolder) {
      const { error } = await supabase
        .from('folders')
        .update({ name: folderName.trim(), color: selectedColor })
        .eq('id', editingFolder.id);
      if (!error) {
        setFolders(prev =>
          prev.map(f => f.id === editingFolder.id ? { ...f, name: folderName.trim(), color: selectedColor } : f)
        );
      }
    }

    setIsSaving(false);
    closeModal();
  };

  const handleDelete = async (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${folder.name}" 폴더를 삭제하시겠습니까? 폴더 내 할 일은 삭제되지 않습니다.`)) return;

    const { error } = await supabase.from('folders').delete().eq('id', folder.id);
    if (!error) setFolders(prev => prev.filter(f => f.id !== folder.id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Folders</h1>
        <button className={styles.addBtn} onClick={openCreateModal}>
          <Plus size={18} />
          새 폴더
        </button>
      </div>

      <div className={styles.grid}>
        {folders.map(folder => (
          <Link href={`/folder/${folder.id}`} key={folder.id}>
            <div className={styles.folderCard}>
              {/* Edit / Delete actions */}
              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => openEditModal(e, folder)}
                  title="편집"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={(e) => handleDelete(e, folder)}
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div
                className={styles.iconWrapper}
                style={{
                  backgroundColor: folder.color,
                  boxShadow: `0 4px 20px ${folder.color}66`,
                }}
              >
                <FolderIcon size={32} />
              </div>
              <h2 className={styles.folderName}>{folder.name}</h2>
            </div>
          </Link>
        ))}

        {folders.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            폴더가 없습니다. 새 폴더를 만들어보세요!
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {modalMode === 'create' ? '새 폴더 만들기' : '폴더 편집'}
            </h2>

            <div className={styles.formGroup}>
              <label>폴더 이름</label>
              <input
                className={styles.nameInput}
                type="text"
                placeholder="폴더 이름 입력..."
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div className={styles.formGroup}>
              <label>색상 선택</label>
              <div className={styles.colorPicker}>
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    className={`${styles.colorSwatch} ${selectedColor === color ? styles.selected : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className={styles.customColorRow}>
                <label>직접 입력:</label>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                />
                <div
                  className={styles.colorPreview}
                  style={{ backgroundColor: selectedColor }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selectedColor}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeModal}>취소</button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving || !folderName.trim()}
              >
                {isSaving ? '저장 중...' : modalMode === 'create' ? '만들기' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
