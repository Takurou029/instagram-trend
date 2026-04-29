require('dotenv').config();

async function debugHashtag() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const tag = 'カフェ';

  console.log('--- Hashtag Debug Test ---');
  console.log('Business ID:', businessId);
  console.log('Search Query:', tag);
  
  try {
    const url = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${businessId}&q=${encodeURIComponent(tag)}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('API Error:', JSON.stringify(data.error, null, 2));
      if (data.error.message.includes('permission')) {
        console.log('\nヒント: トークンに "instagram_manage_insights" か "ads_management" の権限が足りない可能性があります。');
      }
    } else {
      console.log('API Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

debugHashtag();
