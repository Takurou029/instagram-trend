require('dotenv').config();

async function checkIdType() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  console.log('--- Checking ID Type ---');
  
  try {
    // Pageかどうか確認
    const pageUrl = `https://graph.facebook.com/v19.0/${id}?fields=name,instagram_business_account&access_token=${accessToken}`;
    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    if (pageData.instagram_business_account) {
      console.log('ID is a Facebook Page linked to Instagram Business Account:', pageData.instagram_business_account.id);
      return;
    }

    // Instagram Business Accountかどうか確認
    const instaUrl = `https://graph.facebook.com/v19.0/${id}?fields=username,name&access_token=${accessToken}`;
    const instaRes = await fetch(instaUrl);
    const instaData = await instaRes.json();

    if (instaData.username) {
      console.log('ID is already an Instagram Business Account:', instaData.username);
    } else {
      console.log('ID type unknown or error:', pageData.error || instaData.error);
    }
  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

checkIdType();
