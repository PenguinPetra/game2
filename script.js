// メニュー画面への切り替え
function showMenu() {
    document.getElementById('bg-img').classList.add('bg-dimmed');
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
}

// モーダルを開く
function openModal(type) {
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    // 押されたボタンに応じてテキストを変更
    if (type === 'start') {
        title.innerText = "ゲーム開始";
        body.innerHTML = "<p>カメラの準備をしてください。<br>神経衰弱をスタートします！</p>";
    } else if (type === 'rules') {
        title.innerText = "ルール説明";
        body.innerHTML = "<p>1. 隠されたQRコードを探す<br>2. スマホで読み取る<br>3. 同じカードを揃える！</p>";
    } else if (type === 'settings') {
        title.innerText = "設定";
        body.innerHTML = "<p>BGM: ON<br>難易度: ノーマル<br>（現在変更できません）</p>";
    }

    modal.classList.remove('hidden');
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('info-modal').classList.add('hidden');
}