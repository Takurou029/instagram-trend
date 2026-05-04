export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessId  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_BUSINESS_ID;

    if (!tag || !accessToken || !businessId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const cleanTag = tag.replace('#', '').trim();

    // 1. ハッシュタグ ID を取得
    const fetchHashtagId = async (t: string) => {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${businessId}&q=${encodeURIComponent(t)}&access_token=${accessToken}`);
        const data = await res.json();
        return (data.data && data.data.length > 0) ? data.data[0].id : null;
      } catch (e) {
        console.error(`Error fetching ID for ${t}:`, e);
        return null;
      }
    };

    const hashtagId = await fetchHashtagId(cleanTag);

    if (!hashtagId) {
      return Response.json({ error: `ハッシュタグ「#${cleanTag}」が見つかりませんでした。` }, { status: 404 });
    }

    // 1.5 ハッシュタグの総投稿数を取得
    const fetchHashtagCount = async (id: string) => {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${id}?fields=media_count&access_token=${accessToken}`);
        const data = await res.json();
        return data.media_count || 0;
      } catch (e) {
        return 0;
      }
    };

    const hashTagCount = await fetchHashtagCount(hashtagId);

    // 2. top_media と recent_media を軽量リクエストで取得
    const lightweightFields = 'id,media_type,media_url,thumbnail_url,permalink,like_count,caption,comments_count,timestamp';
    
    const fetchMedia = async (type: 'top_media' | 'recent_media') => {
      try {
        const url = `https://graph.facebook.com/v19.0/${hashtagId}/${type}?user_id=${businessId}&fields=${lightweightFields}&limit=25&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
          console.error(`Error fetching ${type}:`, data.error.message);
          return [];
        }
        return data.data || [];
      } catch (e) {
        console.error(`System error fetching ${type}:`, e);
        return [];
      }
    };

    const [topRaw, recentRaw] = await Promise.all([
      fetchMedia('top_media'),
      fetchMedia('recent_media')
    ]);

    // 3. マージ（重複 ID を除去）し、source フラグを付与
    const seen = new Set<string>();
    const merged: any[] = [];

    for (const m of topRaw)    { seen.add(m.id); merged.push({ ...m, isTop: true }); }
    for (const m of recentRaw) { if (!seen.has(m.id)) merged.push({ ...m, isTop: false }); }

    if (merged.length === 0) {
      return Response.json({ error: `ハッシュタグ「#${cleanTag}」の投稿が見つかりませんでした。タグがMetaによって制限されているか、データが取得できません。` }, { status: 404 });
    }

    const usedTag = cleanTag;
    const fallbackMessage = null;

    // 4. 整形 + 急上昇スコア（いいね ÷ 経過時間[h]）を計算
    const now = Date.now();
    const posts = merged.map((m: any) => {
      const typeLabel = m.media_type === 'VIDEO' ? 'REELS'
                      : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL'
                      : 'POST';
      const hoursAgo  = Math.max((now - new Date(m.timestamp).getTime()) / 3_600_000, 0.5);
      const likes     = m.like_count     || 0;
      const comments  = m.comments_count || 0;
      const velocity  = Math.round((likes + comments * 2) / hoursAgo);

      return {
        id:        m.id,
        title:     m.caption ? m.caption.slice(0, 80) + '…' : 'Instagram Post',
        thumbnail: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url,
        url:       m.permalink,
        likes,
        comments,
        type:      typeLabel,
        timestamp: m.timestamp,
        isTop:     m.isTop,
        velocity,
      };
    });

    posts.sort((a, b) => b.velocity - a.velocity);

    return Response.json({ posts, usedTag, fallbackMessage, hashTagCount });

  } catch (error: any) {
    console.error('Trend API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
