// bgm.js
(function() {
    const bgmPath = 'sounds/oyubgm_107_happy_lemonade_master.mp3'; // ファイルパスを適宜修正してください
    const bgm = new Audio(bgmPath);
    bgm.loop = true;      // ループ再生を有効にする
    bgm.volume = 0.5;    // 音量を50%に設定

    // ブラウザの制限により、ユーザーが画面をクリックした後に再生を開始する
    window.addEventListener('click', () => {
        if (bgm.paused) {
            bgm.play().catch(error => {
                console.log("BGMの再生に失敗しました。ユーザー操作が必要です:", error);
            });
        }
    }, { once: true }); // 最初の一回だけ実行
})();