// bgm.js

// グローバル変数として定義
let bgm = null;

function playBgm() {
    if (bgm === null) {
        // ファイル名を bgm.mp3 に変更。パスが通るよう ./ を追加
        bgm = new Audio('./bgm.mp3');
        bgm.loop = true;
        bgm.volume = 0.5;
        
        bgm.play().then(() => {
            console.log("BGM再生成功");
        }).catch(error => {
            console.error("BGM再生失敗:", error);
        });
    }
}