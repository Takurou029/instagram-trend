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
        const res = await fetch(`https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${businessId}&q=${encodeURIComponent(t)}&access_token=${accessToken}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return (data.data && data.data.length > 0) ? data.data[0].id : null;
      } catch (e: any) {
        console.error(`Error fetching ID for ${t}:`, e);
        throw e;
      }
    };

    let hashtagId;
    try {
      hashtagId = await fetchHashtagId(cleanTag);
    } catch (e: any) {
      return Response.json({ error: `APIエラー: ${e.message}` }, { status: 500 });
    }

    if (!hashtagId) {
      return Response.json({ error: `ハッシュタグ「#${cleanTag}」がInstagram上で見つかりませんでした。別の言葉で試してください。` }, { status: 404 });
    }

    // 1.5 ハッシュタグの総投稿数を取得
    const fetchHashtagCount = async (id: string) => {
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${id}?fields=media_count&access_token=${accessToken}`);
        const data = await res.json();
        return data.media_count || 0;
      } catch (e) {
        return 0;
      }
    };

    const hashTagCount = await fetchHashtagCount(hashtagId);

    // 2. top_media と recent_media を取得
    // ハッシュタグ検索APIでは thumbnail_url はサポートされていないため除外
    const lightweightFields = 'id,media_type,media_url,permalink,like_count,caption,comments_count,timestamp';
    
    const fetchMedia = async (type: 'top_media' | 'recent_media') => {
      try {
        const url = `https://graph.facebook.com/v21.0/${hashtagId}/${type}?user_id=${businessId}&fields=${lightweightFields}&limit=15&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
          return { error: data.error.message, data: [] };
        }
        return { data: data.data || [] };
      } catch (e: any) {
        return { error: e.message, data: [] };
      }
    };

    const [topRes, recentRes] = await Promise.all([
      fetchMedia('top_media'),
      fetchMedia('recent_media')
    ]);

    // エラーチェック
    if (topRes.error && recentRes.error) {
      return Response.json({ error: `Meta APIエラー: ${topRes.error}` }, { status: 500 });
    }

    const topRaw = topRes.data;
    const recentRaw = recentRes.data;

    // 3. マージ（重複 ID を除去）し、source フラグを付与
    const seen = new Set<string>();
    const merged: any[] = [];

    for (const m of topRaw)    { seen.add(m.id); merged.push({ ...m, isTop: true }); }
    for (const m of recentRaw) { if (!seen.has(m.id)) merged.push({ ...m, isTop: false }); }

    if (merged.length === 0) {
      const detail = (topRes.error || recentRes.error) ? ` (一部エラー: ${topRes.error || recentRes.error})` : "";
      return Response.json({ error: `ハッシュタグ「#${cleanTag}」の投稿が見つかりませんでした。Meta側の制限によりデータが公開されていない可能性があります${detail}。` }, { status: 404 });
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
        thumbnail: m.media_url, // ハッシュタグ検索では media_url がサムネイルを兼ねる場合が多い
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
