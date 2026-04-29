'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Hash, 
  User, 
  Save, 
  Heart, 
  MessageCircle, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Camera,
  Bell,
  HelpCircle,
  MoreVertical,
  Play
} from 'lucide-react';

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('trending');

  // ダミーデータ
  const dummyPosts = [
    { id: 1, user: 'soyun_cafe', likes: '12.3万', comments: '128', time: '2日前', desc: '今話題の韓国カフェに行ってきました♡ 店内の雰囲気もメニューも全部かわいすぎた...' },
    { id: 2, user: 'cafe_log_kr', likes: '9.8万', comments: '92', time: '3日前', desc: 'いちごたっぷりのケーキが絶品🍓 ビジュも味も100点のカフェ☕️' },
    { id: 3, user: 'haru_oneday', likes: '8.7万', comments: '56', time: '4日前', desc: '光が差し込むこの空間が最高すぎる🌿 ずっと居たくなるカフェでした' },
    { id: 4, user: 'mignon_cafe', likes: '7.6万', comments: '71', time: '2日前', desc: 'かわいすぎるクマのケーキ🧸 味も見た目も幸せすぎた〜♡' },
    { id: 5, user: 'seonul_cafe', likes: '6.9万', comments: '43', time: '5日前', desc: '弘大にある隠れ家カフェ☕️ 雰囲気もコーヒーも最高でした！' },
    { id: 6, user: 'cafe_daily_kr', likes: '6.5万', comments: '38', time: '1日前', desc: 'お花に囲まれたカフェで幸せ時間🌸 ラテアートもかわいすぎた...' },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Camera size={24} className="text-pink-500" />
          <span>InstaTrend</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'trending' ? 'active' : ''}`} onClick={() => setActiveTab('trending')}>
            <TrendingUp size={20} />
            <span>トレンド投稿</span>
          </div>
          <div className="nav-item">
            <Search size={20} />
            <span>キーワード分析</span>
          </div>
          <div className="nav-item">
            <Hash size={20} />
            <span>ハッシュタグ分析</span>
          </div>
          <div className="nav-item">
            <User size={20} />
            <span>アカウント分析</span>
          </div>
          <div className="nav-item">
            <Save size={20} />
            <span>保存した検索条件</span>
          </div>
          <div className="nav-item">
            <Heart size={20} />
            <span>お気に入り投稿</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-wider">キーワード履歴</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 hover:text-white cursor-pointer"><Hash size={12} /> 旅行</div>
            <div className="flex items-center gap-2 hover:text-white cursor-pointer"><Hash size={12} /> カフェ</div>
            <div className="flex items-center gap-2 hover:text-white cursor-pointer"><Hash size={12} /> 韓国ファッション</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="キーワードやハッシュタグを入力してください" className="search-bar" />
          </div>
          <div className="flex items-center gap-6 text-gray-500">
            <div className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-gray-900"><HelpCircle size={18} /> 使い方</div>
            <Bell size={20} className="cursor-pointer hover:text-gray-900" />
            <div className="flex items-center gap-2 cursor-pointer border-l pl-6">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">S</div>
              <div className="text-sm font-bold text-gray-700">Sample Inc. <ChevronDown size={14} className="inline" /></div>
            </div>
          </div>
        </header>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="page-title">トレンド投稿を見つける</h1>
              <p className="page-description">特定のキーワードやハッシュタグに対して、Instagramでバズっている投稿を確認できます</p>
            </div>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
              <Save size={16} /> 検索条件を保存
            </button>
          </div>

          <div className="filter-bar">
            <div className="filter-item">
              <label className="filter-label">キーワード / ハッシュタグ</label>
              <div className="relative">
                <input type="text" defaultValue="# 韓国カフェ" className="filter-select w-full pr-8" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">×</span>
              </div>
            </div>
            <div className="filter-item">
              <label className="filter-label">期間</label>
              <select className="filter-select">
                <option>過去7日間</option>
                <option>過去30日間</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">いいね数</label>
              <select className="filter-select">
                <option>1,000以上</option>
                <option>10,000以上</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">コメント数</label>
              <select className="filter-select">
                <option>50以上</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">投稿タイプ</label>
              <select className="filter-select">
                <option>すべて</option>
                <option>リールのみ</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">並び替え</label>
              <select className="filter-select">
                <option>いいね数が多い順</option>
              </select>
            </div>
            <button className="flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <LayoutGrid size={20} />
            </button>
          </div>

          <div className="results-grid">
            {dummyPosts.map(post => (
              <article key={post.id} className="post-card">
                <div className="relative">
                  <div className="post-image" />
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-lg text-white">
                    <Play size={16} fill="white" />
                  </div>
                </div>
                <div className="post-info">
                  <div className="post-header">
                    <div className="user-avatar bg-gray-200" />
                    <span className="username">{post.user}</span>
                    <span className="ml-auto text-[11px] text-gray-400">{post.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {post.desc}
                  </p>
                  <div className="post-stats">
                    <div className="stat-item"><Heart size={14} /> {post.likes}</div>
                    <div className="stat-item"><MessageCircle size={14} /> {post.comments}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
