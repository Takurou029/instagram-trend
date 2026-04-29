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

      <div className="sidebar-footer">
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
          キーワード履歴
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          {['旅行', 'カフェ', '韓国ファッション'].map((tag) => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <Hash size={12} /> {tag}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
