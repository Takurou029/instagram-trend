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
    console.log('Hashtag ID for #カフェ:', hashtagId);

    // 2. そのハッシュタグの投稿（top_media）を無加工で取得
    const mediaUrl = `https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${businessId}&fields=id,media_type,like_count,caption&limit=10&access_token=${accessToken}`;
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      console.error('API Error:', mediaData.error.message);
    } else {
      console.log(`\nFound ${mediaData.data.length} posts. Analyzing types...`);
      mediaData.data.forEach((m, i) => {
        console.log(`[${i+1}] Type: ${m.media_type}, Likes: ${m.like_count || 0}`);
      });
      
      const videoCount = mediaData.data.filter(m => m.media_type === 'VIDEO').length;
      console.log(`\nResult: Videos found = ${videoCount} / Total = ${mediaData.data.length}`);
    }
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
  }
}

debugHashtagMedia();
