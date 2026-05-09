'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CheckSquare, Calendar, Folder, Menu, X } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: 'To Do List', path: '/', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Folders', path: '/folder', icon: Folder },
  ];

  return (
    <>
      <button className={styles.mobileToggle} onClick={toggleSidebar}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>
          <CheckSquare className={styles.logoIcon} size={32} />
          <span>DOING</span>
        </div>

        <ul className={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <li key={item.path} className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
                <Link href={item.path} onClick={() => setIsOpen(false)}>
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
