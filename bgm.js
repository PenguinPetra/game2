// bgm.js
(function() {
    const bgmPath = 'oyubgm_107_happy_lemonade_master.mp3'; 
    const bgm = new Audio(bgmPath);

    bgm.loop = true;      // ループ再生（途中で終わったら再度流す）
    bgm.volume = 0.5;    // 音量

    // 元々の showMenu 関数をバックアップ
    const originalShowMenu = window.showMenu;

    // showMenu 関数を上書きして、BGM再生機能を追加
    window.showMenu = function() {
        // BGMを再生
        bgm.play().then(() => {
            console.log("BGMの再生を開始しました。");
        }).catch(error => {
            console.log("再生に失敗しました:", error);
        });

        // 本来の画面遷移処理（script.jsにあるshowMenu）を実行
        if (typeof originalShowMenu === 'function') {
            originalShowMenu();
        }
    };
})();