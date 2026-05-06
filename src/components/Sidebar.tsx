'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TrendingUp, Hash, User, Save, Heart, Camera, Home, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/trend', icon: TrendingUp, label: 'トレンド投稿' },
  { href: '/analysis', icon: User, label: 'アカウント分析' },
];

const disabledItems = [
  { icon: Hash, label: 'ハッシュタグ分析' },
  { icon: Save, label: '保存した検索条件' },
  { icon: Heart, label: 'お気に入り投稿' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // ページ遷移時にドロワーを閉じる
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // スクロールロック
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sidebarContent = (
    <>
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Camera size={24} style={{ color: '#ec4899', marginRight: '8px' }} />
          <span>InstaTrend</span>
        </div>
        {/* モバイル閉じるボタン */}
        <button
          onClick={() => setIsOpen(false)}
          className="sidebar-close-btn"
          aria-label="メニューを閉じる"
        >
          <X size={22} color="#94a3b8" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${pathname === href ? ' active' : ''}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        {disabledItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="nav-item"
            style={{ opacity: 0.35, cursor: 'default', pointerEvents: 'none' }}
          >
            <Icon size={20} />
            <span>{label}</span>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* ハンバーガーボタン（モバイルのみ表示） */}
      <button
        onClick={() => setIsOpen(true)}
        className="hamburger-btn"
        aria-label="メニューを開く"
      >
        <Menu size={24} />
      </button>

      {/* デスクトップ用サイドバー */}
      <aside className="sidebar">
        {sidebarContent}
      </aside>

      {/* モバイル用ドロワー */}
      {isOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsOpen(false)}>
          <aside
            className="mobile-drawer"
            onClick={e => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
