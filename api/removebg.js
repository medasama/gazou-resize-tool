// Vercel Serverless Function
// ブラウザからは直接 remove.bg を呼ばず、この関数を経由させることで
// APIキーをクライアント側のコードに露出させない。
// APIキーは Vercel の環境変数 REMOVE_BG_API_KEY に設定する。

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POSTメソッドのみ対応しています' });
    return;
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'サーバー側にREMOVE_BG_API_KEYが設定されていません（Vercelの環境変数を確認してください）' });
    return;
  }

  const { imageBase64, size } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64が指定されていません' });
    return;
  }

  try {
    const rbgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: imageBase64,
        size: size || 'preview', // preview = 0.25メガピクセルまで、無料枠内
        format: 'png',
      }),
    });

    if (!rbgRes.ok) {
      const errBody = await rbgRes.text();
      res.status(rbgRes.status).json({ error: `remove.bgエラー: ${errBody}` });
      return;
    }

    const arrayBuffer = await rbgRes.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
