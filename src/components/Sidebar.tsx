'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Search, Hash, User, Save, Heart, Camera, Home } from 'lucide-react';

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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <Camera size={24} style={{ color: '#ec4899', marginRight: '8px' }} />
        <span>InstaTrend</span>
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

    </aside>
  );
}
