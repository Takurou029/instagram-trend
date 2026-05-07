import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Gemini APIキーが設定されていません。' }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    const { username, stats, topPostsAI, bottomPosts } = await req.json();

    if (!username) {
      return Response.json({ error: 'ユーザー名が必要です。' }, { status: 400 });
    }

    const formatPosts = (posts: any[], label: string) =>
      posts.map((p, i) => `【${label}${i + 1}】
いいね: ${p.likes} | コメント: ${p.comments} | タイプ: ${p.mediaType}
キャプション: ${p.caption || '（なし）'}`).join('\n\n');

    const prompt = `
あなたは2026年最新のInstagramアルゴリズムを熟知した、超戦略的SNSアナリストです。
以下のアカウントデータを分析し、JSON形式でレポートを出力してください。

### アカウント情報:
ユーザー名: @${username}
フォロワー数: ${stats.followers.toLocaleString()}人
平均いいね数: ${stats.avgLikes.toLocaleString()}
平均コメント数: ${stats.avgComments.toLocaleString()}
総投稿数: ${stats.postsCount}件

### 高エンゲージメント投稿（上位最大5件）:
${formatPosts(topPostsAI || [], '高EG')}

### 低エンゲージメント投稿（下位最大5件）:
${formatPosts(bottomPosts || [], '低EG')}

### 指示:
1. アスタリスク（*）の使用禁止
2. ダラダラとした文章は禁止。「見出し」と「短い解説」を組み合わせて情報を構造化する
3. 強みと弱みは、投稿データから読み取れる客観的な事実に基づくこと
4. 戦略アドバイスは、このアカウントが「今後の90日間」に集中すべき具体的な行動を提示すること

### 出力形式 (JSON):
{
  "strengths": "【強みの核心】\\n一言で表す強み。\\n\\n【根拠】\\n高EG投稿から読み取れる共通要素。",
  "weaknesses": "【改善すべき点】\\n一言で表す課題。\\n\\n【根拠】\\n低EG投稿から読み取れる共通要素。",
  "highEngagementTraits": "【高EG投稿の型】\\n伸びている投稿の特徴（フォーマット・テーマ・トーン）。",
  "lowEngagementTraits": "【低EG投稿の型】\\n伸びていない投稿の共通パターン。",
  "strategy": "【90日戦略】\\n今後90日で集中すべき施策。\\n\\n【優先アクション1】\\n具体的な行動。\\n\\n【優先アクション2】\\n具体的な行動。\\n\\n【優先アクション3】\\n具体的な行動。"
}
`;

    let text = "";
    const modelsToTry = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash-lite"];
    const errors: string[] = [];

    for (const modelName of modelsToTry) {
      let retries = 2;
      while (retries > 0) {
        try {
          console.log(`Attempting analysis with ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          text = result.response.text();
          if (text) {
            console.log(`Success with ${modelName}`);
            break;
          }
        } catch (e: any) {
          const msg = e.message || String(e);
          const is503 = msg.includes("503") || msg.includes("Service Unavailable");
          const is429 = msg.includes("429") || msg.includes("Too Many Requests");
          if (is429 || !is503) {
            errors.push(`[${modelName}]: ${msg}`);
            retries = 0;
          } else {
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 2000));
            else errors.push(`[${modelName}]: ${msg}`);
          }
          continue;
        }
        break;
      }
      if (text) break;
    }

    if (!text) {
      throw new Error(`すべてのAIモデルが失敗しました。\n${errors.join('\n')}`);
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('AIの応答に有効なデータが含まれていません。');
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    try {
      const analysis = JSON.parse(jsonStr);
      return Response.json({ analysis });
    } catch {
      return Response.json({ error: '分析結果の解析に失敗しました。' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Analyze Account API Error:', error);
    return Response.json({ error: `AI分析に失敗しました (${error.message || 'Unknown error'})` }, { status: 500 });
  }
}
