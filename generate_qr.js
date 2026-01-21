const QRCode = require('qrcode');
const fs = require('fs');

// 末尾の「/」はあってもなくても自動調整します
const BASE_URL = 'https://kai-1208.github.io/card_game_app/';

// カード定義（app.jsと同じ順序・内容であること）
const suits = [
    { mark: '♠', name: 'スペード' },
    { mark: '♣', name: 'クラブ' },
    { mark: '♥', name: 'ハート' },
    { mark: '♦', name: 'ダイヤ' }
];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 出力するHTMLファイル名
const OUTPUT_FILE = 'qr_print.html';

// メイン処理
async function generate() {
    console.log('QRコードを生成中...');

    // URLの末尾調整
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';

    // HTMLヘッダー（CSS含む）
    let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>QRコード印刷用シート</title>
    <style>
        body { font-family: sans-serif; text-align: center; }
        h1 { margin: 10px 0; font-size: 18px; }
        .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* 横4列 */
            gap: 15px;
            width: 100%;
            max-width: 210mm; /* A4幅 */
            margin: 0 auto;
        }
        .item {
            border: 1px dashed #ccc;
            padding: 10px 5px;
            page-break-inside: avoid; /* 印刷時に途中で切れないように */
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        img { width: 120px; height: 120px; }
        .label { font-weight: bold; margin-top: 5px; font-size: 14px; }
        .sub-label { font-size: 10px; color: #666; }
        
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <h1>🖨️ 印刷用QRコードシート</h1>
        <p>このページを印刷（Ctrl + P / Command + P）して使用してください。</p>
        <p>設定URL: ${baseUrl}</p>
        <hr>
    </div>
    <div class="grid">
`;

    let idCounter = 0;

    // カードごとにQRコードを生成
    for (const suit of suits) {
        for (const rank of ranks) {
            const targetUrl = `${baseUrl}?id=${idCounter}`;
            
            // QRコードをデータURL(Base64画像)として生成
            try {
                const qrDataUrl = await QRCode.toDataURL(targetUrl, {
                    width: 150,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                });

                html += `
        <div class="item">
            <img src="${qrDataUrl}" alt="QR Code">
            <div class="label">${suit.mark} ${rank}</div>
            <div class="sub-label">No.${idCounter + 1}</div>
        </div>`;
                
            } catch (err) {
                console.error('エラーが発生しました:', err);
            }

            idCounter++;
        }
    }

    // HTMLフッター
    html += `
    </div>
</body>
</html>`;

    // ファイル書き出し
    fs.writeFileSync(OUTPUT_FILE, html);
    console.log(`完了！ '${OUTPUT_FILE}' が作成されました。`);
}

// 実行
generate();