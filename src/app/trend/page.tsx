'use client';

import React, { useState, useMemo } from 'react';
import { Search, Heart, MessageCircle, ExternalLink, TrendingUp, Camera, Download, Flame, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

function formatAge(timestamp: string) {
  const h = (Date.now() - new Date(timestamp).getTime()) / 3_600_000;
  if (h < 1)  return `${Math.round(h * 60)}分前`;
  if (h < 24) return `${Math.round(h)}時間前`;
  return `${Math.round(h / 24)}日前`;
}

export default function TrendResearchPage() {
  const [keyword, setKeyword]   = useState('');
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [period, setPeriod]     = useState('all');
  const [sortBy, setSortBy]     = useState('velocity');
  const [history, setHistory]   = useState<string[]>([]);

  // 履歴の読み込み
  React.useEffect(() => {
    const saved = localStorage.getItem('insta_trend_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (kw: string) => {
    const cleanKw = kw.replace('#', '').trim();
    if (!cleanKw) return;
    const newHistory = [cleanKw, ...history.filter(h => h !== cleanKw)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('insta_trend_history', JSON.stringify(newHistory));
  };

  const removeFromHistory = (kw: string) => {
    const newHistory = history.filter(h => h !== kw);
    setHistory(newHistory);
    localStorage.setItem('insta_trend_history', JSON.stringify(newHistory));
  };

  const fetchTrendData = async (kw?: string) => {
    const targetKeyword = kw || keyword;
    if (!targetKeyword) return;
    
    setIsLoading(true);
    setError(null);
    setAllPosts([]);
    try {
      const cleanKw = targetKeyword.replace('#', '').trim();
      const res  = await fetch(`/api/trend?tag=${encodeURIComponent(cleanKw)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAllPosts(data.posts);
      setKeyword(cleanKw);
      saveToHistory(cleanKw);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    let result = [...allPosts];

    if (period !== 'all') {
      const offsets: Record<string, number> = {
        '24h': 24 * 3_600_000,
        '7d':  7  * 24 * 3_600_000,
        '30d': 30 * 24 * 3_600_000,
      };
      const cutoff = Date.now() - offsets[period];
      result = result.filter(p => new Date(p.timestamp).getTime() >= cutoff);
    }

    if (sortBy === 'velocity') result.sort((a, b) => b.velocity - a.velocity);
    else if (sortBy === 'likes')  result.sort((a, b) => b.likes - a.likes);
    else result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result;
  }, [allPosts, period, sortBy]);

  const downloadCSV = () => {
    if (filteredPosts.length === 0) return;
    const headers = ['ID', 'Type', 'Title', 'Likes', 'Comments', 'Velocity', 'URL', 'Timestamp'];
    const rows = filteredPosts.map(p => [
      p.id, p.type, `"${p.title.replace(/"/g, '""')}"`,
      p.likes, p.comments, p.velocity, p.url, p.timestamp
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `trend_${keyword}_${period}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content" style={{ backgroundColor: '#F8FAFC' }}>

        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>トレンドリサーチ</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ color: '#64748B', fontSize: '16px', margin: 0 }}>ハッシュタグから「今、伸びている」投稿を抽出・分析します</p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ cursor: 'help', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { (e.currentTarget.nextSibling as HTMLElement).style.opacity = '1'; (e.currentTarget.nextSibling as HTMLElement).style.visibility = 'visible'; }}
                  onMouseLeave={e => { (e.currentTarget.nextSibling as HTMLElement).style.opacity = '0'; (e.currentTarget.nextSibling as HTMLElement).style.visibility = 'hidden'; }}
                >?</div>
                <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '8px', width: '280px', backgroundColor: '#1E293B', color: 'white', padding: '16px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.6', zIndex: 100, opacity: 0, visibility: 'hidden', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontWeight: '800', marginBottom: '8px', color: '#EC4899', fontSize: '13px' }}>分析ロジックについて</p>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    <li>指定した#タグの「人気投稿」と「最新投稿」から最大50件を取得</li>
                    <li>いいね・コメント・投稿時間から<b>「急上昇スコア（時速）」</b>を算出</li>
                    <li>正確な統計データが公開されている投稿のみを表示</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {allPosts.length > 0 && (
            <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#0F172A', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <Download size={18} /> CSVエクスポート
            </button>
          )}
        </header>

        {/* 履歴リスト */}
        {history.length > 0 && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>最近の検索:</span>
            {history.map(kw => (
              <div key={kw} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', padding: '6px 12px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <button 
                  onClick={() => fetchTrendData(kw)}
                  disabled={isLoading}
                  style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', padding: 0 }}
                >
                  #{kw}
                </button>
                <button 
                  onClick={() => removeFromHistory(kw)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 検索バー */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <input
                type="text"
                placeholder="キーワードを入力 (例: ライフハック, 筋トレ)"
                style={{ width: '100%', padding: '16px 16px 16px 48px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '16px', outline: 'none' }}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && fetchTrendData()}
              />
              <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button
              onClick={() => fetchTrendData()}
              disabled={isLoading || !keyword}
              style={{ background: isLoading ? '#CBD5E1' : 'linear-gradient(to right, #EC4899, #8B5CF6)', color: 'white', padding: '16px 32px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', transition: 'background 0.3s' }}
            >
              <TrendingUp size={20} />
              リサーチ開始
            </button>
          </div>

          {allPosts.length > 0 && !isLoading && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* 期間 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>期間</span>
                <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                  {[{ id: 'all', label: '全期間' }, { id: '24h', label: '24時間' }, { id: '7d', label: '7日間' }, { id: '30d', label: '30日間' }].map(p => (
                    <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: period === p.id ? 'white' : 'transparent', color: period === p.id ? '#0F172A' : '#64748B', boxShadow: period === p.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 並び替え */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>並び替え</span>
                <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                  {[
                    { id: 'velocity', label: '🔥 急上昇' },
                    { id: 'likes',    label: '❤️ いいね順' },
                    { id: 'newest',   label: '🕒 新着順' },
                  ].map(s => (
                    <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: sortBy === s.id ? 'white' : 'transparent', color: sortBy === s.id ? '#0F172A' : '#64748B', boxShadow: sortBy === s.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                表示: <span style={{ color: '#0F172A', fontWeight: '800' }}>{filteredPosts.length}</span> / {allPosts.length} 件
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '32px' }}>
            <p style={{ color: '#991B1B', fontWeight: '700', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0 32px', gap: '24px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #F1F5F9' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#EC4899', borderRightColor: '#8B5CF6', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>リサーチ中...</p>
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>「{keyword}」の人気投稿・最新投稿を収集しています</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '9/16' }} />
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="skeleton" style={{ height: '13px', width: '100%' }} />
                    <div className="skeleton" style={{ height: '13px', width: '65%' }} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <div className="skeleton" style={{ height: '18px', width: '56px' }} />
                      <div className="skeleton" style={{ height: '18px', width: '44px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 結果グリッド */}
        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredPosts.map((post) => (
              <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #F1F5F9', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
              >
                {/* サムネイル */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '9/16', backgroundColor: '#000' }}>
                  {post.type === 'REELS' ? (
                    <video 
                      src={post.thumbnail} 
                      muted 
                      playsInline 
                      loop 
                      onMouseEnter={e => e.currentTarget.play()} 
                      onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <img src={post.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {/* バッジ類 */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {post.isTop && (
                      <span style={{ backgroundColor: '#EC4899', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                        TOP
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: post.type === 'REELS' ? '#8B5CF6' : post.type === 'CAROUSEL' ? '#3B82F6' : '#0F172A', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                    {post.type}
                  </div>
                </div>

                {/* テキスト情報 */}
                <div style={{ padding: '16px 20px 20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#1E293B', marginBottom: '12px', lineHeight: '1.6', height: '3.2em', overflow: 'hidden' }}>{post.title}</p>

                  {/* 急上昇スコア */}
                  {post.velocity > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', backgroundColor: '#FFF7ED', padding: '4px 10px', borderRadius: '8px', width: 'fit-content' }}>
                      <Flame size={12} color="#F97316" />
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#C2410C' }}>{post.velocity.toLocaleString()} / h</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#EC4899', fontSize: '13px', fontWeight: '800' }}>
                        <Heart size={14} fill="#EC4899" /> {post.likes.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '13px', fontWeight: '800' }}>
                        <MessageCircle size={14} /> {post.comments.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>{formatAge(post.timestamp)}</span>
                      <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {allPosts.length > 0 && filteredPosts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
                <Camera size={56} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', fontWeight: '600' }}>選択した期間の投稿が見つかりませんでした</p>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>「全期間」に切り替えると確認できます</p>
              </div>
            )}

            {allPosts.length === 0 && !error && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
                <Camera size={56} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', fontWeight: '500' }}>キーワードを入力してリサーチを開始してください</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
