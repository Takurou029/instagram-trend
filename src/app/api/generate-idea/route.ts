import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { posts, keyword } = await req.json();

    if (!posts || posts.length === 0) {
      return Response.json({ error: '分析対象の投稿が見つかりません。' }, { status: 400 });
    }

    const trendSummary = posts.map((p: any, i: number) => {
      return `【投稿${i + 1}】
ID: ${p.id}
タイトル: ${p.title}
いいね: ${p.likes}
コメント: ${p.comments}
時速スコア: ${p.velocity}
投稿タイプ: ${p.type}`;
    }).join('\n\n');

    const prompt = `
  あなたは2026年最新のInstagramアルゴリズムを熟知した、超戦略的SNSマーケティング軍師です。
  以下のトレンドデータを分析し、キーワード「${keyword}」の市場深掘りレポートを作成してください。

  ### 分析対象データ:
  ${trendSummary}

  ### 指示（重要）:
  1. **情報の強弱を徹底せよ**: 
     - ダラダラとした文章は禁止。
     - 「一言の見出し」と「短い解説」を組み合わせて、視覚的に情報が飛び込んでくるように。
  2. **アスタリスク（*）の使用を禁止する**: 
     - 箇条書きなどにアスタリスクを使わないこと。
  3. **市場中心の客観分析**:
     - 「視聴者需要」は、たくろーのアカウント状況ではなく、**このトレンドデータが示す市場全体のユーザー心理**を客観的に分析すること。
  4. **リファレンスの紐付け**:
     - marketAnalysis と strategicSeeds の各項目において、**根拠とした投稿のID（${posts.map((p:any)=>p.id).join(', ')} から選択）を必ず含めること**。
  5. **構成**:
     - **投稿傾向**: 市場で主流のスタイル、トーン、デザインの型。見出しは「1. 投稿傾向（市場の型）」とする。
     - **視聴者需要**: このキーワードで検索するユーザーが、今「市場に対して」何を渇望しているか。見出しは「2. 視聴者需要（ユーザー心理）」とする。
     - **コンセプト案**: 上記に基づいた、勝率の高い切り口。

  ### 出力形式 (JSON):
  {
    "marketAnalysis": {
      "trends": "【見出し】\\n一言で表すトレンドの正体。\\n\\n【詳細】\\n具体的なトーンや構成の型。",
      "audienceDemand": "【核心】\\nユーザーが今、市場に求めているもの。\\n\\n【心理】\\n検索の裏側にある深い悩み。",
      "referencedIds": ["特に参考にした投稿のID（複数可）"]
    },
    "seoKeywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4", "キーワード5"],
    "strategicSeeds": [
      {
        "type": "FEED" | "REELS",
        "angle": "狙うべき切り口",
        "reason": "なぜ今、市場でこれが勝てるのか",
        "hook": "指を止める最強のフック",
        "coreMessage": "伝えるべき核心メッセージ",
        "referencedIds": ["この案の根拠となった投稿のID（複数可）"]
      }
    ]
  }
  `;

    let text = "";
    const modelsToTry = ["gemini-3.1-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting analysis with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break; // 成功したらループを抜ける
      } catch (e: any) {
        lastError = e;
        console.warn(`${modelName} failed:`, e.message);
        // 次のモデルへ（503や404などのエラー時）
        continue;
      }
    }

    if (!text) {
      throw new Error(lastError?.message || "すべてのAIモデルが現在利用できません。");
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('AIの応答に有効なデータが含まれていません。');
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    try {
      const insight = JSON.parse(jsonStr);
      return Response.json({ insight });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw:', jsonStr);
      return Response.json({ error: '分析結果の解析に失敗しました。' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: `企画案の生成に失敗しました (${error.message || 'Unknown error'})` }, { status: 500 });
  }
}
