require('dotenv').config();

async function debugHashtagMedia() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const tag = '整形';

  console.log('--- Hashtag Media Diagnostic ---');
  
  try {
    // 1. ハッシュタグのIDを取得
    const tagIdUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${businessId}&q=${encodeURIComponent(tag)}&access_token=${accessToken}`;
    const tagIdRes = await fetch(tagIdUrl);
    const tagIdData = await tagIdRes.json();

    if (!tagIdData.data || tagIdData.data.length === 0) {
      console.log('Error: Hashtag ID not found');
      return;
    }

    const hashtagId = tagIdData.data[0].id;
    console.log('Hashtag ID:', hashtagId);

    const fields = 'id,media_type,media_url,permalink,like_count,caption,timestamp';

    // 2. top_media と recent_media を取得
    console.log('\n--- Fetching Top Media ---');
    const topUrl = `https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${businessId}&fields=${fields}&limit=5&access_token=${accessToken}`;
    const topRes = await fetch(topUrl);
    const topData = await topRes.json();

    if (topData.error) {
      console.error('Top Media Error:', JSON.stringify(topData.error, null, 2));
    } else {
      console.log(`Top Media: ${topData.data?.length || 0} posts found`);
    }

    console.log('\n--- Fetching Recent Media ---');
    const recentUrl = `https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=${businessId}&fields=${fields}&limit=15&access_token=${accessToken}`;
    const recentRes = await fetch(recentUrl);
    const recentData = await recentRes.json();

    if (recentData.error) {
      console.error('Recent Media Error:', JSON.stringify(recentData.error, null, 2));
    } else {
      console.log(`Recent Media: ${recentData.data?.length || 0} posts found`);
    }
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
  }
}

debugHashtagMedia();
