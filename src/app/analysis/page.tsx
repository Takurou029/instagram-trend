'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Search, RefreshCcw, X, Camera, Heart, MessageCircle, ExternalLink, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

const RANK_STYLES = [
  { bg: '#FEF9C3', border: '#FBBF24', text: '#92400E', label: '🥇' },
  { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', label: '🥈' },
  { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', label: '🥉' },
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

function TopPostsSection({ accounts }: { accounts: any[] }) {
  if (accounts.length === 0) return null;

  return (
    <div style={{ marginBottom: '40px' }}>
      {accounts.map(acc => {
        // フォロワー数に基づいたエンゲージメント率の計算
        const followers = acc.stats.followers || 1;
        
        return (
          <div key={acc.username} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
            {/* セクションヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#FDF2F8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={20} color="#EC4899" />
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', fontSize: '20px', color: '#0F172A', margin: 0 }}>
                    @{acc.username} の強み（最多いいね Top 3）
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                    直近100件の投稿から、特に反響の大きかった投稿を抽出しています
                  </p>
                </div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#64748B', border: '1px solid #E2E8F0' }}>
                抽出範囲: 直近100件
              </div>
            </div>

            {/* 3枚カード */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {acc.topPosts?.map((post: any, idx: number) => {
                const rank = RANK_STYLES[idx];
                const engagementRate = ((post.likes / followers) * 100).toFixed(1);
                
                return (
                  <div key={post.id} style={{ borderRadius: '20px', border: `1px solid #F1F5F9`, overflow: 'hidden', backgroundColor: 'white', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                  >
                    {/* サムネイル */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#000', overflow: 'hidden' }}>
                      {post.thumbnail
                        ? <img src={post.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={32} color="#475569" /></div>
                      }
                      {/* 順位バッジ */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', width: '32px', height: '32px', backgroundColor: rank.bg, border: `2px solid ${rank.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {rank.label}
                      </div>
                      {/* メディアタイプ */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: post.mediaType === 'REELS' ? '#8B5CF6' : post.mediaType === 'CAROUSEL' ? '#3B82F6' : '#0F172A', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                        {post.mediaType}
                      </div>
                      
                      {/* Instagram リンク（オーバーレイ） */}
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" 
                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 0.2s', backgroundColor: 'rgba(15, 23, 42, 0.6)', textDecoration: 'none', zIndex: 2 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                      >
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#0F172A', transform: 'translateY(10px)', transition: 'transform 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                        >
                          <ExternalLink size={16} /> 投稿を見る
                        </div>
                      </a>
                    </div>

                    {/* テキスト情報 */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: rank.text, backgroundColor: rank.bg, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          Performance
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#EC4899' }}>
                          反応率 {engagementRate}%
                        </span>
                      </div>
                      
                      {post.caption && (
                        <p style={{ fontSize: '12px', color: '#1E293B', lineHeight: '1.5', marginBottom: '12px', height: '3em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.caption}
                        </p>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '800', color: '#EC4899' }}>
                            <Heart size={14} fill="#EC4899" /> {post.likes.toLocaleString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '700', color: '#64748B' }}>
                            <MessageCircle size={14} /> {post.comments.toLocaleString()}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>{formatDate(post.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* topPosts が空のとき */}
              {(!acc.topPosts || acc.topPosts.length === 0) && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  <p style={{ fontSize: '14px' }}>投稿データが取得できませんでした</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InstagramAnalysisPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [accounts, setAccounts]           = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [apiError, setApiError]           = useState<string | null>(null);

  const fetchInstaData = async (username: string) => {
    if (!username) return;
    const clean = username.replace('@', '').trim();
    setIsLoading(true);
    setApiError(null);
    try {
      const res  = await fetch(`/api/instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccounts(prev => {
        if (prev.some(a => a.username === data.username)) return prev;
        return [...prev, { ...data, color: COLORS[prev.length % COLORS.length] }].slice(0, 2);
      });
      setUsernameInput('');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAccount = (username: string) => setAccounts(prev => prev.filter(a => a.username !== username));

  const getChartData = () => {
    if (accounts.length === 0) return [];
    return accounts[0].timeSeries.map((d: any, i: number) => {
      const entry: any = { date: d.date };
      accounts.forEach(acc => { if (acc.timeSeries[i]) entry[acc.username] = acc.timeSeries[i].likes; });
      return entry;
    });
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content" style={{ backgroundColor: '#F8FAFC' }}>

        {/* ヘッダー */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A' }}>アカウント比較分析</h1>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="ユーザー名を入力 (例: tcb_official)"
              style={{ width: '100%', padding: '14px 48px 14px 16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchInstaData(usernameInput)}
            />
            <button
              onClick={() => fetchInstaData(usernameInput)}
              disabled={isLoading || !usernameInput || accounts.length >= 2}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '8px', color: '#EC4899', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {isLoading ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </header>

        {apiError && (
          <div style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#991B1B', fontWeight: '700', fontSize: '14px' }}>{apiError}</p>
            <button onClick={() => setApiError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}><X size={20} /></button>
          </div>
        )}

        {/* スコアカード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          {accounts.map(acc => (
            <div key={acc.username} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <button onClick={() => removeAccount(acc.username)} style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px', color: '#94A3B8', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}>
                <X size={20} />
              </button>
              <div style={{ height: '6px', width: '100%', backgroundColor: acc.color }} />
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                  <img src={acc.avatar} style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${acc.color}`, padding: '2px' }} alt="" />
                  <div>
                    <h3 style={{ fontWeight: '800', fontSize: '20px', color: '#0F172A', margin: 0 }}>{acc.name}</h3>
                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>@{acc.username}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'フォロワー',  value: `${(acc.stats.followers / 10000).toFixed(1)}万` },
                    { label: '総投稿数',    value: acc.stats.postsCount },
                    { label: '平均いいね',  value: acc.stats.avgLikes.toLocaleString() },
                    { label: '平均コメント', value: acc.stats.avgComments.toLocaleString() },
                  ].map((s, i) => (
                    <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px' }}>
                      <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {accounts.length < 2 && (
            <div style={{ border: '2px dashed #E2E8F0', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Camera size={40} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>比較対象のアカウントを<br />追加してください</p>
            </div>
          )}
        </div>

        {/* トップ3投稿セクション */}
        <TopPostsSection accounts={accounts} />

        {/* エンゲージメントチャート */}
        {accounts.length > 0 && (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#FDF2F8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={20} color="#EC4899" />
              </div>
              <h3 style={{ fontWeight: '800', fontSize: '20px', color: '#0F172A', margin: 0 }}>直近投稿のエンゲージメント推移（いいね数）</h3>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }} itemStyle={{ fontWeight: '700' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {accounts.map(acc => (
                    <Line key={acc.username} type="monotone" dataKey={acc.username} stroke={acc.color} strokeWidth={4} dot={{ r: 6, fill: acc.color, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 8 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
