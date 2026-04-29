require('dotenv').config();

async function testConnection() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  console.log('--- Instagram API Connection Test ---');
  console.log('Business ID:', businessId);
  
  try {
    const url = `https://graph.facebook.com/v19.0/${businessId}?fields=name,username&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('API Error:', data.error.message);
      return;
    }

    console.log('Successfully connected!');
    console.log('Account Name:', data.name);
    
    console.log('\n--- Business Discovery Test (Searching for "instagram") ---');
    const discoveryUrl = `https://graph.facebook.com/v19.0/${businessId}?fields=business_discovery.username(instagram){followers_count,media_count}&access_token=${accessToken}`;
    const discoveryRes = await fetch(discoveryUrl);
    const discoveryData = await discoveryRes.json();

    if (discoveryData.error) {
      console.error('Discovery Error:', discoveryData.error.message);
    } else {
      console.log('Discovery Success!');
      console.log('Instagram Followers:', discoveryData.business_discovery.followers_count);
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
