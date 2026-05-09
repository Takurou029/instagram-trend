function imgProxy(url: string | null | undefined): string | null {
  if (!url) return null;
  const b64url = Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `/api/img?u=${b64url}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessId  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_BUSINESS_ID;

    if (!username || !accessToken || !businessId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,video_view_count';
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
    if (!userData) {
        return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const media: any[] = userData.media?.data || [];

    const reels = media.filter(m => m.media_type === 'VIDEO' || m.media_type === 'CAROUSEL_ALBUM' || m.video_view_count !== undefined);
    const stats = {
      postsCount: userData.media_count || 0,
      followers:  userData.followers_count || 0,
      avgLikes:    reels.length > 0 ? Math.round(reels.reduce((s, m) => s + (m.like_count || 0), 0) / reels.length) : 0,
      avgComments: reels.length > 0 ? Math.round(reels.reduce((s, m) => s + (m.comments_count || 0), 0) / reels.length) : 0,
    };

    const dailyChart: any[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
      const fullDateStr = d.toISOString().split('T')[0];
      
      const postsForDay = reels.filter(m => m.timestamp && m.timestamp.startsWith(fullDateStr));
      const dayData = postsForDay.reduce((acc, m) => {
          acc.likes += (m.like_count || 0);
          acc.views += (m.video_view_count || 0);
          return acc;
        }, { likes: 0, views: 0 });
      
      dailyChart.push({ date: dateStr, ...dayData, posts: postsForDay.length });
    }

    const monthlyChart: any[] = [];
    const currentMonth = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    [lastMonth, currentMonth].forEach(month => {
      const postsForMonth = reels.filter(m => m.timestamp && m.timestamp.startsWith(month));
      const monthData = postsForMonth.reduce((acc, m) => {
          acc.likes += (m.like_count || 0);
          acc.views += (m.video_view_count || 0);
          return acc;
        }, { likes: 0, views: 0 });
      
      monthlyChart.push({ 
        date: month.replace('-', '/'), 
        ...monthData,
        posts: postsForMonth.length
      });
    });

    const mapPost = (m: any) => ({
      id:        m.id,
      caption:   m.caption ? m.caption.slice(0, 60) + (m.caption.length > 60 ? '…' : '') : '',
      mediaType: m.media_type === 'VIDEO' ? 'REELS'
               : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL'
               : 'IMAGE',
      thumbnail: imgProxy(m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url),
      permalink: m.permalink,
      likes:     m.like_count     || 0,
      comments:  m.comments_count || 0,
      views:     m.video_view_count || 0,
      timestamp: m.timestamp,
    });

    const sortedByLikes = [...media].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    const topPosts    = sortedByLikes.slice(0, 3).map(mapPost);
    const topPostsAI  = sortedByLikes.slice(0, 5).map(mapPost);
    const bottomPosts = sortedByLikes.slice(-5).map(mapPost);

    return Response.json({
      name:      userData.name,
      username:  userData.username,
      avatar:    imgProxy(userData.profile_picture_url),
      stats,
      dailyChart,
      monthlyChart,
      topPosts,
      topPostsAI,
      bottomPosts,
    });

  } catch (error: any) {
    console.error('Instagram API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
