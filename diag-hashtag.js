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

    // テスト1: thumbnail_url のみ追加
    console.log('\n--- Test 1: Testing thumbnail_url ---');
    const fields1 = 'id,media_type,media_url,thumbnail_url,permalink,like_count,timestamp';
    const res1 = await fetch(`https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${businessId}&fields=${fields1}&limit=1&access_token=${accessToken}`);
    const data1 = await res1.json();
    if (data1.error) console.log('Test 1 Failed:', data1.error.message);
    else console.log('Test 1 Success! thumbnail_url is supported.');

    // テスト2: comments_count のみ追加
    console.log('\n--- Test 2: Testing comments_count ---');
    const fields2 = 'id,media_type,media_url,permalink,like_count,comments_count,timestamp';
    const res2 = await fetch(`https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${businessId}&fields=${fields2}&limit=1&access_token=${accessToken}`);
    const data2 = await res2.json();
    if (data2.error) console.log('Test 2 Failed:', data2.error.message);
    else console.log('Test 2 Success! comments_count is supported.');
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
  }
}

debugHashtagMedia();
