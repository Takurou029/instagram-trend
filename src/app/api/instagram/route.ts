export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!username || !accessToken || !businessId) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
    const discoveryUrl = `https://graph.facebook.com/v19.0/${businessId}?fields=business_discovery.username(${username}){id,name,username,profile_picture_url,follows_count,followers_count,media_count,media.limit(100){${mediaFields}}}&access_token=${accessToken}`;

    const res  = await fetch(discoveryUrl);
    const data = await res.json();

    if (data.error) {
      const message = data.error.message.includes('business_discovery')
        ? '他人のアカウント情報を取得する権限がありません。ページアクセストークンを確認してください。'
        : data.error.message;
      return Response.json({ error: message }, { status: 500 });
    }

    const userData = data.business_discovery;
    const media: any[] = userData.media?.data || [];

    // --- 統計：VIDEO + CAROUSEL を対象 ---
    const reels = media.filter(m => m.media_type === 'VIDEO' || m.media_type === 'CAROUSEL_ALBUM');
    const stats = {
      postsCount: userData.media_count,
      followers:  userData.followers_count,
      avgLikes:    Math.round(reels.reduce((s, m) => s + (m.like_count || 0), 0) / (reels.length || 1)),
      avgComments: Math.round(reels.reduce((s, m) => s + (m.comments_count || 0), 0) / (reels.length || 1)),
    };

    // --- 新しい集計ロジック：日次（直近30日） ---
    const dailyChart: any[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
      const fullDateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // その日の投稿を合算
      const dayLikes = reels
        .filter(m => m.timestamp.startsWith(fullDateStr))
        .reduce((sum, m) => sum + (m.like_count || 0), 0);
      
      dailyChart.push({ date: dateStr, likes: dayLikes });
    }

    // --- 新しい集計ロジック：月次（今月と先月） ---
    const monthlyChart: any[] = [];
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7); // YYYY-MM

    [lastMonth, currentMonth].forEach(month => {
      const monthLikes = reels
        .filter(m => m.timestamp.startsWith(month))
        .reduce((sum, m) => sum + (m.like_count || 0), 0);
      
      monthlyChart.push({ 
        date: month.replace('-', '/'), 
        likes: monthLikes 
      });
    });

    // --- トップ3投稿：全メディアをいいね数降順でソート ---
    const topPosts = [...media]
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 3)
      .map(m => ({
        id:        m.id,
        caption:   m.caption ? m.caption.slice(0, 60) + (m.caption.length > 60 ? '…' : '') : '',
        mediaType: m.media_type === 'VIDEO' ? 'REELS'
                 : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL'
                 : 'IMAGE',
        // VIDEO は thumbnail_url、それ以外は media_url
        thumbnail: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url,
        permalink: m.permalink,
        likes:     m.like_count     || 0,
        comments:  m.comments_count || 0,
        timestamp: m.timestamp,
      }));

    return Response.json({
      name:      userData.name,
      username:  userData.username,
      avatar:    userData.profile_picture_url,
      stats,
      dailyChart,
      monthlyChart,
      topPosts,
    });

  } catch {
    return Response.json({ error: 'Failed to fetch Instagram data' }, { status: 500 });
  }
}
