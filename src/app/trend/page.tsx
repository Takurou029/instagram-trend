'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, Heart, MessageCircle, ExternalLink, TrendingUp, Camera, Download, Flame, X, Sparkles, RefreshCcw, Zap } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

function formatAge(timestamp: string) {
  const h = (Date.now() - new Date(timestamp).getTime()) / 3_600_000;
  if (h < 1)  return `${Math.round(Math.max(h * 60, 1))}分前`;
  if (h < 24) return `${Math.round(h)}時間前`;
  return `${Math.round(h / 24)}日前`;
}

function HighlightedText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\【.*?\】)/g);
  return (
    <>
      {parts.map((part, i) => 
        part.startsWith('【') && part.endsWith('】') ? (
          <span key={i} className="block text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-4 first:mt-0">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i} className="text-[15px] font-semibold text-slate-900 leading-relaxed">
            {part}
          </span>
        )
      )}
    </>
  );
}

interface MarketInsight {
  marketAnalysis: {
    trends: string;
    audienceDemand: string;
    referencedIds?: string[];
  };
  seoKeywords: string[];
  strategicSeeds: {
    type: 'FEED' | 'REELS';
    angle: string;
    reason: string;
    hook: string;
    coreMessage: string;
    referencedIds: string[];
  }[];
}

// コンポーネント外に配置
function ReferencedPosts({ ids, allPosts }: { ids?: string[], allPosts: any[] }) {
  if (!ids || ids.length === 0) return null;
  const refs = allPosts.filter(p => ids.includes(p.id));
  if (refs.length === 0) return null;

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
      <p style={{ fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>分析の根拠となった投稿</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
        {refs.map(p => (
          <a 
            key={p.id} 
            href={p.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            title={p.title}
            style={{
              display: 'block',
              position: 'relative',
              aspectRatio: '1',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              backgroundColor: '#0F172A'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {p.type === 'REELS' ? (
              <video src={p.thumbnail} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Image src={p.thumbnail} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function TrendResearchPage() {
  const [keyword, setKeyword]   = useState('');
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [sortBy, setSortBy]     = useState('velocity');
  const [history, setHistory]   = useState<string[]>([]);

  const [insight, setInsight] = useState<MarketInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

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
    setInsight(null);
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

  const generateIdea = async () => {
    if (allPosts.length === 0) return;
    setIsGenerating(true);
    setGenError(null);
    setInsight(null);
    try {
      const topPosts = allPosts.slice(0, 10);
      const res = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: topPosts, keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '分析エラー');
      setInsight(data.insight);
      setTimeout(() => document.getElementById('ai-ideas-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const result = [...allPosts];
    if (sortBy === 'velocity') result.sort((a, b) => b.velocity - a.velocity);
    else if (sortBy === 'likes')  result.sort((a, b) => b.likes - a.likes);
    else result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return result;
  }, [allPosts, sortBy]);

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
    a.href = url; a.download = `trend_${keyword}.csv`;
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={generateIdea} 
                disabled={isGenerating} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isGenerating ? '#E2E8F0' : 'linear-gradient(to right, #EC4899, #8B5CF6)', color: isGenerating ? '#94A3B8' : 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              >
                {isGenerating ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isGenerating ? 'AI分析中...' : 'AI企画案を生成'}
              </button>
              <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#0F172A', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Download size={18} /> CSV保存
              </button>
            </div>
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
              style={{ background: isLoading ? '#CBD5E1' : '#0F172A', color: 'white', padding: '16px 32px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', transition: 'background 0.3s' }}
            >
              {isLoading ? <RefreshCcw size={20} className="animate-spin" /> : <TrendingUp size={20} />}
              リサーチ開始
            </button>
          </div>

          {allPosts.length > 0 && !isLoading && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', alignItems: 'center' }}>
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

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                  表示: <span style={{ color: '#0F172A', fontWeight: '800' }}>{filteredPosts.length}</span> 件
                </span>
                <button
                  onClick={generateIdea}
                  disabled={isGenerating}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isGenerating ? '#E2E8F0' : 'linear-gradient(to right, #EC4899, #8B5CF6)', color: isGenerating ? '#94A3B8' : 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                >
                  {isGenerating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGenerating ? 'AI分析中...' : 'AI企画案を生成'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '32px' }}>
            <p style={{ color: '#991B1B', fontWeight: '700', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* AI分析レポート */}
        {genError && (
          <div style={{ backgroundColor: '#FFF7ED', borderLeft: '4px solid #F97316', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '32px' }}>
            <p style={{ color: '#C2410C', fontWeight: '700', fontSize: '14px' }}>AI分析エラー: {genError}</p>
            <p style={{ color: '#9A3412', fontSize: '12px', marginTop: '4px' }}>しばらく時間をおいてから再度お試しください。連続して実行すると制限がかかる場合があります。</p>
          </div>
        )}

        {insight && !isGenerating && (
          <div id="ai-ideas-section" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', marginBottom: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF2F8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.2)' }}>
                  <TrendingUp size={24} color="#EC4899" />
                </div>
                <div>
                  <h3 style={{ fontWeight: '900', fontSize: '24px', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    トレンド市場分析レポート
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '600', margin: '4px 0 0' }}>AIが現在のトレンドから次のヒットを予測します</p>
                </div>
              </div>
              <button onClick={() => setInsight(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* 1. 投稿傾向 */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '28px', borderRadius: '20px', border: '1px solid #F1F5F9', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#EC4899', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}>1</div>
                    <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>投稿傾向（市場の型）</h4>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '20px', lineHeight: '1.6', padding: '12px 16px', backgroundColor: 'rgba(236, 72, 153, 0.03)', borderRadius: '12px', borderLeft: '3px solid #EC4899' }}>
                    <span style={{ color: '#EC4899', fontWeight: '900' }}>💡 何を調べている？</span><br />
                    今、市場で「どんな見た目や構成」の投稿が伸びているかを分析しています。デザインやトーンを真似るべき「勝てる型」を特定します。
                  </div>
                  <HighlightedText text={insight.marketAnalysis?.trends} />
                  <ReferencedPosts ids={insight.marketAnalysis?.referencedIds} allPosts={allPosts} />
                </div>

                {/* 2. 視聴者需要 */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '28px', borderRadius: '20px', border: '1px solid #F1F5F9', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#8B5CF6', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}>2</div>
                    <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>視聴者需要（ユーザー心理）</h4>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '20px', lineHeight: '1.6', padding: '12px 16px', backgroundColor: 'rgba(139, 92, 246, 0.03)', borderRadius: '12px', borderLeft: '3px solid #8B5CF6' }}>
                    <span style={{ color: '#8B5CF6', fontWeight: '900' }}>💡 何を調べている？</span><br />
                    ユーザーがこのキーワードで「何を知りたいか」「どんな悩みを解決したいか」を分析しています。共感される企画の「中身」を作るためのヒントです。
                  </div>
                  <HighlightedText text={insight.marketAnalysis?.audienceDemand} />
                  <ReferencedPosts ids={insight.marketAnalysis?.referencedIds} allPosts={allPosts} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {insight.strategicSeeds?.map((seed, i) => (
                  <div key={i} style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: seed.type === 'REELS' ? '#8B5CF6' : '#10B981', backgroundColor: seed.type === 'REELS' ? '#F5F3FF' : '#ECFDF5', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>{seed.type}</span>
                      <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>{seed.angle}</h4>
                    </div>
                    <p style={{ fontSize: '14px', color: '#64748B', fontWeight: '600', lineHeight: '1.6', marginBottom: '24px' }}>{seed.reason}</p>
                    <div style={{ backgroundColor: '#FDF2F8', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #EC4899', marginBottom: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '900', color: '#BE185D', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>指を止めるフック案</p>
                      <p style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: 0 }}>「{seed.hook}」</p>
                    </div>
                    <ReferencedPosts ids={seed.referencedIds} allPosts={allPosts} />
                  </div>
                ))}
              </div>
            </div>
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
                <div style={{ position: 'relative', width: '100%', aspectRatio: '9/16', backgroundColor: '#0F172A', overflow: 'hidden' }}>
                  {post.type === 'REELS' ? (
                    <video 
                      src={post.thumbnail} 
                      muted 
                      playsInline 
                      loop 
                      preload="auto"
                      onMouseEnter={async (e) => {
                        const v = e.currentTarget;
                        try {
                          await v.play();
                        } catch {
                          // Ignore
                        }
                      }} 
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                    />
                  ) : (
                    <Image src={post.thumbnail} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
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
