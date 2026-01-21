/* =========================================
   定数・設定
   ========================================= */
const STORAGE_KEY = 'nervous_breakdown_state';
const suits = [
    { mark: '♠', color: 'black', displayName: 'スペード' },
    { mark: '♣', color: 'black', displayName: 'クラブ' },
    { mark: '♥', color: 'red', displayName: 'ハート' },
    { mark: '♦', color: 'red', displayName: 'ダイヤ' }
];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ★追加機能：特殊効果（運動の指令）リスト
const MOVEMENT_MISSIONS = [
    "次のカードをスキャンするまで、\n3歩あるく度にスクワットを一回せよ！",
    "次のカードをスキャンするまで、\n太ももを地面と平行になるぐらい上げて歩け！",
    "次のカードをスキャンするまで、\nスキップで移動せよ！",
    "次のカードをスキャンするまで、\nカニ歩き（横歩き）で移動せよ！",
    "次のカードをスキャンするまで、\n両手を挙げて「バンザイ」の姿勢で移動せよ！",
    "次のカードをスキャンするまで、\n後ろ歩き（気をつけて！）で移動せよ！",
    "次のカードをスキャンするまで、\n常に笑顔をキープして移動せよ！",
    "その場で10回ジャンプしてから、\n次のカードを探しに行け！"
];

/* =========================================
   グローバル変数
   ========================================= */
let deck = [];
let gameState = {
    foundPairs: [],     // ペア成立したカードID
    flippedCards: []    // 現在めくられているカードID（最大2枚）
};
let html5QrCode = null;
let isScanning = false;
let isMessageEnabled = true; // メッセージ表示設定

/* =========================================
   初期化・ロード処理
   ========================================= */
window.onload = () => {
    loadState();
    
    // 初回起動時などでデッキが空なら初期化
    if (deck.length === 0) {
        initGame();
    } else {
        renderGrid();
    }
    
    updateToggleButton();
};

/* =========================================
   ゲームロジック
   ========================================= */

// ゲーム初期化（カード生成・シャッフル）
function initGame() {
    deck = [];
    let idCounter = 0;
    // generate_qr.js の生成順序に合わせてIDを割り当て (Suit -> Rank)
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                id: idCounter++,
                suit: suit.mark,
                rank: rank,
                color: suit.color,
                displayName: `${suit.mark} ${rank}`,
                isOpen: false,
                isMatched: false
            });
        }
    }
    // デッキはシャッフルせず、IDがQRコードと紐付いているため固定配置とする
    // ※「神経衰弱」としてのランダム性は「部屋への配置」で担保するか、
    //   あるいはここで中身をシャッフルするかですが、
    //   QRのIDとカード内容を固定するためにシャッフルは表示上のみで行うのが一般的。
    //   今回はシンプルに「ID=カード」の対応を変えずに進めます。

    gameState = { foundPairs: [], flippedCards: [] };
    saveState();
    renderGrid();
    showMessage("ゲームを開始します！部屋のカードを探そう！");
}

// QRコード読み取り処理
function processScan(scannedText) {
    // URLパラメータからIDを抽出 (例: ...?id=5)
    let cardId = null;
    try {
        const url = new URL(scannedText);
        const params = new URLSearchParams(url.search);
        if (params.has('id')) {
            cardId = parseInt(params.get('id'), 10);
        }
    } catch (e) {
        // URLでない場合、直接数字が書かれているかも考慮
        if (!isNaN(scannedText)) {
            cardId = parseInt(scannedText, 10);
        }
    }

    if (cardId === null || isNaN(cardId) || cardId < 0 || cardId >= deck.length) {
        showMessage("無効なQRコードです: " + scannedText);
        return;
    }

    const card = deck[cardId];

    // すでにマッチ済み、または既にめくられている場合は無視
    if (gameState.foundPairs.includes(cardId)) {
        showMessage(`そのカード (${card.displayName}) は既にゲットしています！`);
        return;
    }
    if (gameState.flippedCards.includes(cardId)) {
        showMessage(`そのカード (${card.displayName}) は既にめくれています。`);
        return;
    }

    // カードをめくる処理
    handleCardFlip(cardId);
}

// カードをめくった後の判定
function handleCardFlip(id) {
    // 2枚すでにめくられていたら、それをリセットしてから新しいのをめくる（連続スキャン対策）
    if (gameState.flippedCards.length >= 2) {
        // マッチしなかったカードを裏返す
        gameState.flippedCards = []; 
        renderGrid();
    }

    gameState.flippedCards.push(id);
    renderGrid(); // 画面更新

    // ★追加機能：カードをスキャンしたら指令を表示（モーダル）
    // 1枚目でも2枚目でも、スキャンするたびに運動させるならここで表示
    showMissionModal();

    // 2枚めくった場合の判定
    if (gameState.flippedCards.length === 2) {
        checkForMatch();
    } else {
        // 1枚目の場合
        showMessage(`1枚目: ${deck[id].displayName} です。もう1枚探そう！`);
        saveState();
    }
}

// ★追加機能：ランダムな指令を表示する関数
function showMissionModal() {
    const randomIndex = Math.floor(Math.random() * MOVEMENT_MISSIONS.length);
    const mission = MOVEMENT_MISSIONS[randomIndex];
    
    // 既存のモーダル機能を使って表示
    // 第2引数(content)を渡せるように openModal を拡張して利用
    openModal('mission', mission);
}

// ペア判定
function checkForMatch() {
    const [id1, id2] = gameState.flippedCards;
    const card1 = deck[id1];
    const card2 = deck[id2];

    // 数字(rank)が同じならマッチ
    if (card1.rank === card2.rank) {
        // マッチ成功
        gameState.foundPairs.push(id1);
        gameState.foundPairs.push(id2);
        gameState.flippedCards = []; // めくりリストからは削除
        saveState();
        
        // 少し遅らせて祝福メッセージ
        setTimeout(() => {
            renderGrid(); // マッチ確定色に更新
            // 全クリア判定
            if (gameState.foundPairs.length === deck.length) {
                document.getElementById('status-text').textContent = "🎊 全制覇！おめでとう！ 🎊";
                openModal('mission', "🎉 おめでとう！ゲームクリア！ 🎉<br>最後に深呼吸をして終了しよう！");
            } else {
                showMessage(`ペア成立！ ${card1.rank} のペア！`);
            }
        }, 500);

    } else {
        // マッチ失敗
        saveState();
        setTimeout(() => {
            showMessage("残念、不一致…。");
            // 次のスキャン時に裏返るので、ここでは何もしないか、
            // あるいは明示的に「次をスキャンすると裏返ります」と出す
        }, 500);
    }
}

/* =========================================
   UI/画面遷移ロジック
   ========================================= */

// タイトル -> メニュー
function showMenu() {
    document.getElementById('bg-img').classList.add('bg-dimmed');
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
}

// メニュー -> ゲーム画面
function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // カメラ起動
    startScanner();
}

// ゲーム画面 -> タイトル（戻るボタン）
function backToTitle() {
    stopScanner(); // カメラ停止
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('bg-img').classList.remove('bg-dimmed');
}

// モーダル制御（★拡張：content引数を追加）
function openModal(type, content = null) {
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');

    if (type === 'rules') {
        title.innerText = "ルール説明";
        body.innerHTML = `
            <p style='text-align:left;'>
            1. 部屋に設置したQRコードまで移動しよう。<br>
            2. 「スキャン」ボタンでQRを読み取る。<br>
            3. トランプが表示されるよ。<br>
            4. 同じ数字を見つけてペアを作ろう！<br>
            <br>
            <b>★特別ルール★</b><br>
            カードをスキャンすると「指令」が出るぞ！<br>
            指令に従って次のカードへ向かおう！
            </p>`;
    } else if (type === 'mission') {
        // ★追加：指令表示用
        title.innerText = "🏃 指令発生！ 🏃";
        body.innerHTML = `<p style="font-size:1.2rem; font-weight:bold; color:#d00;">${content}</p>`;
    } else {
        title.innerText = "情報";
        body.innerHTML = content ? content : "";
    }
}

function closeModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

/* =========================================
   カメラスキャン関連 (html5-qrcode)
   ========================================= */
function startScanner() {
    const readerContainer = document.getElementById('reader');
    // すでに起動中なら何もしない
    if(html5QrCode) return;

    // スキャンエリアを表示
    document.getElementById('reader-container').style.display = 'block';
    document.getElementById('scan-btn').style.display = 'none'; // ボタンは隠す
    document.getElementById('close-scan-btn').style.display = 'inline-block';

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, // リアカメラ優先
        config,
        (decodedText, decodedResult) => {
            // スキャン成功時
            console.log(`Scan result: ${decodedText}`);
            // 連続読み取り防止のため一時停止するか、UIで制御
            processScan(decodedText);
            
            // 一度読んだら少し止める？今回は連続スキャンしたいので止めないが、
            // 誤検知が多い場合は stopScanner() を呼んでから processScan してもよい。
            // ここでは使い勝手を考慮し、「閉じる」までカメラは動かし続けるが、
            // ダイアログが出ている間は裏で読み込みが走らないように工夫が必要かも。
            // 簡易的に、モーダル表示中は無視するように修正するとより良い。
            if(!document.getElementById('info-modal').classList.contains('hidden')) {
                return; 
            }
        },
        (errorMessage) => {
            // 読み取り待機中エラーは無視
        }
    ).catch(err => {
        console.error("Camera start failed", err);
        showMessage("カメラの起動に失敗しました。");
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
        }).catch(err => console.error("Failed to stop scanner", err));
    }
    document.getElementById('reader-container').style.display = 'none'; // エリアを隠す（必要に応じて）
    
    // UIをスキャンボタンに戻す（常時カメラオンにするならこの処理は調整）
    document.getElementById('scan-btn').style.display = 'inline-block';
    document.getElementById('close-scan-btn').style.display = 'none';
}

// ボタンイベント設定
document.getElementById('scan-btn').addEventListener('click', startScanner);
document.getElementById('close-scan-btn').addEventListener('click', stopScanner);


/* =========================================
   描画・ユーティリティ
   ========================================= */

// ダイアログ表示（トースト的なもの）
function showMessage(msg) {
    if (!isMessageEnabled) return;

    const dialog = document.getElementById('custom-dialog');
    const content = document.getElementById('dialog-content');
    
    // すでに表示されていても内容を更新
    content.textContent = msg;
    dialog.classList.remove('hidden');

    // 3秒後に消える
    setTimeout(() => {
        dialog.classList.add('hidden');
    }, 3000);
}

// グリッド描画
function renderGrid() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    deck.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        div.dataset.id = card.id;

        // 状態判定
        const isMatched = gameState.foundPairs.includes(card.id);
        const isFlipped = gameState.flippedCards.includes(card.id);
        const isOpen = isMatched || isFlipped;

        if (isOpen) {
            div.classList.add('open');
            div.classList.add(card.color); // red or black
            div.textContent = card.displayName;
        }
        if (isMatched) {
            div.classList.add('matched');
        }
        grid.appendChild(div);
    });
}

// ユーティリティ
const toggleBtn = document.getElementById('toggle-msg-btn');
toggleBtn.addEventListener('click', () => {
    isMessageEnabled = !isMessageEnabled;
    localStorage.setItem('msgSetting', isMessageEnabled);
    updateToggleButton();
});

function updateToggleButton() {
    toggleBtn.textContent = isMessageEnabled ? "💬 ダイアログ表示: ON" : "💬 ダイアログ表示: OFF";
    toggleBtn.style.background = isMessageEnabled ? "#6a8dbd" : "#6c757d";
}

document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("リセットしますか？")) {
        localStorage.removeItem(STORAGE_KEY);
        // デッキ再生成も含めてリセット
        initGame();
    }
});

function saveState() {
    // deckの状態も含めて保存したほうが安全だが、今回は進行状況のみ
    // もしシャッフルを実装するならdeckの並び順も保存が必要
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        gameState = JSON.parse(saved);
    }
    
    const msgSetting = localStorage.getItem('msgSetting');
    if (msgSetting !== null) {
        isMessageEnabled = (msgSetting === 'true');
    }
}