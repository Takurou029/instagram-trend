const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const username = 'tcb_official';
  const mediaFields = 'id,caption,media_type,timestamp,like_count,video_view_count';
  const url = `https://graph.facebook.com/v19.0/${businessId}?fields=business_discovery.username(${username}){media.limit(10){${mediaFields}}}&access_token=${accessToken}`;

  console.log('Fetching from:', url.replace(accessToken, 'REDACTED'));
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.business_discovery && data.business_discovery.media) {
      const media = data.business_discovery.media.data;
      console.log('\n--- Media Details ---');
      media.forEach((m, i) => {
        console.log(`${i+1}: Type=${m.media_type}, Likes=${m.like_count}, Views=${m.video_view_count}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
