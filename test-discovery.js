require('dotenv').config();

async function testDiscovery() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  // 前回のチェックで見つけた本当の Instagram Business Account ID
  const igId = '17841461857602664';

  console.log('--- Instagram Business Discovery Test ---');
  console.log('Using IG ID:', igId);
  
  try {
    const discoveryUrl = `https://graph.facebook.com/v19.0/${igId}?fields=business_discovery.username(instagram){followers_count,media_count}&access_token=${accessToken}`;
    const discoveryRes = await fetch(discoveryUrl);
    const discoveryData = await discoveryRes.json();

    if (discoveryData.error) {
      console.error('Discovery Error:', discoveryData.error.message);
      if (discoveryData.error.message.includes('permission')) {
        console.log('\nヒント: トークンの権限が不足しているか、ページアクセストークンではない可能性があります。');
      }
    } else {
      console.log('Discovery Success!');
      console.log('Instagram Followers:', discoveryData.business_discovery.followers_count);
      console.log('Instagram Media Count:', discoveryData.business_discovery.media_count);
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testDiscovery();
