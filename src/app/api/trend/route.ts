export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!tag || !accessToken || !businessId) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const cleanTag = tag.replace('#', '').trim();

  // 1. ハッシュタグ ID を取得
  const tagIdRes  = await fetch(`https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${businessId}&q=${encodeURIComponent(cleanTag)}&access_token=${accessToken}`);
  const tagIdData = await tagIdRes.json();

  if (!tagIdData.data || tagIdData.data.length === 0) {
    return Response.json({ error: `ハッシュタグ「#${cleanTag}」が見つかりませんでした。` }, { status: 404 });
  }

  const hashtagId = tagIdData.data[0].id;
  const fields    = 'id,media_type,media_url,permalink,like_count,caption,comments_count,timestamp';

  // 2. top_media と recent_media を並列取得 (最大50件ずつ)
  const [topRes, recentRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${businessId}&fields=${fields}&limit=50&access_token=${accessToken}`),
    fetch(`https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=${businessId}&fields=${fields}&limit=50&access_token=${accessToken}`),
  ]);
  const [topData, recentData] = await Promise.all([topRes.json(), recentRes.json()]);

  const topRaw    = (!topData.error    && topData.data)    ? topData.data    : [];
  const recentRaw = (!recentData.error && recentData.data) ? recentData.data : [];

  // 3. マージ（重複 ID を除去）し、1週間以内の投稿に絞り込む
  const seen = new Set<string>();
  const merged: any[] = [];
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // いいね数が 0 より大きい & 1週間以内
  const filterCriteria = (m: any) => {
    const isRecentEnough = (now - new Date(m.timestamp).getTime()) <= ONE_WEEK_MS;
    const hasLikes = (m.like_count || 0) > 0;
    return isRecentEnough && hasLikes;
  };

  for (const m of topRaw.filter(filterCriteria))    { seen.add(m.id); merged.push({ ...m, isTop: true }); }
  for (const m of recentRaw.filter(filterCriteria)) { if (!seen.has(m.id)) merged.push({ ...m, isTop: false }); }

  if (merged.length === 0) {
    return Response.json({ error: '直近1週間以内に、正確な統計データが公開されている人気投稿が見つかりませんでした。' }, { status: 404 });
  }

  // 4. 整形 + 急上昇スコア（いいね ÷ 経過時間[h]）を計算
  const posts = merged.map((m: any) => {
    const typeLabel = m.media_type === 'VIDEO' ? 'REELS'
                    : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL'
                    : 'POST';
    const hoursAgo  = Math.max((now - new Date(m.timestamp).getTime()) / 3_600_000, 0.5);
    const likes     = m.like_count     || 0;
    const comments  = m.comments_count || 0;
    const velocity  = Math.round((likes + comments * 2) / hoursAgo); // コメントを2倍重み付け

    return {
      id:        m.id,
      title:     m.caption ? m.caption.slice(0, 80) + '…' : 'Instagram Post',
      thumbnail: m.media_url,
      url:       m.permalink,
      likes,
      comments,
      type:      typeLabel,
      timestamp: m.timestamp,
      isTop:     m.isTop,
      velocity,
    };
  });


  // 5. デフォルトは急上昇順（velocity 降順）で返す
  posts.sort((a, b) => b.velocity - a.velocity);

  return Response.json({ posts });
}
