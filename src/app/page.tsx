'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { UserPlus, RefreshCcw, Heart, Users, BarChart3, Trash2, ExternalLink, Camera, TrendingUp } from 'lucide-react';

const MAX_ACCOUNTS = 6;

export default function HomePage() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [accountsData, setAccountsData] = useState<any[]>([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 初期読み込み：localStorageからリストを取得
  useEffect(() => {
    const saved = localStorage.getItem('insta_watchlist');
    if (saved) {
      const list = JSON.parse(saved);
      setWatchlist(list);
      fetchAllData(list);
    }
  }, []);

  const fetchAllData = async (list: string[]) => {
    if (list.length === 0) return;
    setIsLoading(true);
    try {
      const results = await Promise.all(
        list.map(username => 
          fetch(`/api/instagram?username=${encodeURIComponent(username)}`).then(res => res.json())
        )
      );
      setAccountsData(results.filter(r => !r.error));
    } catch (err) {
      console.error('Failed to fetch watchlist data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addAccount = async () => {
    const clean = usernameInput.replace('@', '').trim();
    if (!clean || watchlist.includes(clean) || watchlist.length >= MAX_ACCOUNTS) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      
      if (data.error) {
        alert('アカウントが見つかりませんでした');
        return;
      }

      const newList = [...watchlist, clean];
      setWatchlist(newList);
      localStorage.setItem('insta_watchlist', JSON.stringify(newList));
      setAccountsData([...accountsData, data]);
      setUsernameInput('');
    } catch (err) {
      alert('追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAccount = (username: string) => {
    const newList = watchlist.filter(w => w !== username);
    setWatchlist(newList);
    localStorage.setItem('insta_watchlist', JSON.stringify(newList));
    setAccountsData(accountsData.filter(a => a.username !== username));
  };

  const refreshAll = () => {
    setIsRefreshing(true);
    fetchAllData(watchlist).then(() => setIsRefreshing(false));
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content" style={{ backgroundColor: '#F8FAFC' }}>
        
        {/* ヘッダー */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>マイ・ウォッチリスト</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ color: '#64748B', fontSize: '16px', margin: 0 }}>ベンチマークアカウントの「今」を定点観測します</p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ cursor: 'help', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { (e.currentTarget.nextSibling as HTMLElement).style.opacity = '1'; (e.currentTarget.nextSibling as HTMLElement).style.visibility = 'visible'; }}
                  onMouseLeave={e => { (e.currentTarget.nextSibling as HTMLElement).style.opacity = '0'; (e.currentTarget.nextSibling as HTMLElement).style.visibility = 'hidden'; }}
                >?</div>
                <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '8px', width: '280px', backgroundColor: '#1E293B', color: 'white', padding: '16px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.6', zIndex: 100, opacity: 0, visibility: 'hidden', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontWeight: '800', marginBottom: '8px', color: '#EC4899', fontSize: '13px' }}>表示データについて</p>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    <li><b>最新投稿 反応率:</b> 最も反応の良かった投稿の「いいね ÷ フォロワー数」を表示</li>
                    <li><b>平均いいね:</b> 直近のリール・カルーセル投稿の平均値を算出</li>
                    <li><b>データ更新:</b> 「一括更新」ボタンで最新の状態を取得します</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={refreshAll} 
            disabled={isLoading || isRefreshing || watchlist.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#0F172A', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            一括更新
          </button>
        </header>

        {/* 登録フォーム */}
        {watchlist.length < MAX_ACCOUNTS && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom: '40px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="追加するユーザー名 (例: tcb_official)" 
                style={{ width: '100%', padding: '12px 16px 12px 44px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none' }}
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addAccount()}
              />
              <UserPlus size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button 
              onClick={addAccount}
              disabled={isLoading || !usernameInput}
              style={{ backgroundColor: '#0F172A', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              追加する
            </button>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>あと {MAX_ACCOUNTS - watchlist.length} 枠</span>
          </div>
        )}

        {/* ウォッチリスト表示 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {accountsData.map((acc) => {
            const followers = acc.stats.followers || 1;
            const latestPost = acc.topPosts?.[0]; // 簡易的に最新として使用（TopPostsロジック依存だが強みの指標として）
            const engagementRate = latestPost ? ((latestPost.likes / followers) * 100).toFixed(1) : '0.0';
            const isHighEngagement = parseFloat(engagementRate) >= 3.0; // 3%以上なら好調とする

            return (
              <div key={acc.username} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '28px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                {/* 削除ボタン */}
                <button 
                  onClick={() => removeAccount(acc.username)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#E2E8F0', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#E2E8F0'; }}
                >
                  <Trash2 size={18} />
                </button>

                {/* アカウント基本情報 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                  <Image src={acc.avatar} alt="" width={56} height={56} style={{ borderRadius: '50%', border: '2px solid #F1F5F9', padding: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{acc.name}</h3>
                    <span style={{ color: '#94A3B8', fontSize: '13px' }}>@{acc.username}</span>
                  </div>
                </div>

                {/* 重要データ：フォロワー数（特大） */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    <Users size={12} /> Followers
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {(acc.stats.followers / 10000).toFixed(1)}<span style={{ fontSize: '16px', fontWeight: '700', marginLeft: '4px' }}>万</span>
                  </div>
                </div>

                {/* 反応率・エンゲージメント */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: isHighEngagement ? '#F0FDF4' : '#F8FAFC', padding: '16px', borderRadius: '16px', border: isHighEngagement ? '1px solid #BBF7D0' : '1px solid #F1F5F9' }}>
                    <div style={{ color: isHighEngagement ? '#166534' : '#64748B', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>最新投稿 反応率</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: isHighEngagement ? '#15803D' : '#0F172A' }}>
                      {engagementRate}<span style={{ fontSize: '12px', fontWeight: '700', marginLeft: '2px' }}>%</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#FDF2F8', padding: '16px', borderRadius: '16px', border: '1px solid #FCE7F3' }}>
                    <div style={{ color: '#9D174D', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>平均いいね</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#BE185D' }}>
                      {acc.stats.avgLikes.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* リンクボタン */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href={`/analysis?username=${acc.username}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#F8FAFC', color: '#0F172A', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', border: '1px solid #E2E8F0' }}>
                    <BarChart3 size={16} /> 詳細分析
                  </a>
                </div>
              </div>
            );
          })}

          {/* 空の状態のプレースホルダー */}
          {watchlist.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', color: '#94A3B8' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <TrendingUp size={40} style={{ opacity: 0.2 }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>ウォッチリストは空です</h2>
              <p style={{ fontSize: '15px', marginBottom: '32px' }}>定点観測したいアカウントを追加してください（最大6件）</p>
            </div>
          )}

          {/* ローディング状態 */}
          {isLoading && accountsData.length === 0 && (
            [...Array(3)].map((_, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '28px', height: '320px' }}>
                <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '28px' }} />
                <div className="skeleton" style={{ width: '40%', height: '12px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '70%', height: '40px', marginBottom: '32px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
                  <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
