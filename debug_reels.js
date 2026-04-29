const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const username = 'hayate_kajihara'; // リールを投稿していそうなアカウント
  const mediaFields = 'id,media_type,video_view_count';
  const url = `https://graph.facebook.com/v19.0/${businessId}?fields=business_discovery.username(${username}){media.limit(20){${mediaFields}}}&access_token=${accessToken}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.business_discovery && data.business_discovery.media) {
      const media = data.business_discovery.media.data;
      media.forEach((m, i) => {
        console.log(`${i+1}: Type=${m.media_type}, Views=${m.video_view_count}`);
      });
    } else {
      console.log('No media found or Error:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
