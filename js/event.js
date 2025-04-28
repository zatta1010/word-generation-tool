// アプリ全体を制御するモジュール
const eventApp = {
    // アプリを初期化
    initialize: function() {
        // DOM要素を初期化
        DOMManager.initialize();
        
        // UI状態を更新
        UIManager.updateUIState();
        
        // イベントリスナーを設定
        this.setupEventListeners();
    },
    
    // イベントリスナーを設定
    setupEventListeners: function() {
        // 変更イベントの一元管理
        document.addEventListener('change', (e) => {
            // 辞書選択の変更イベント
            if (e.target === DOMManager.get('regulationSelect')) {
                const vocab = DOMManager.get('regulationSelect');
                const regulationSelection = DOMManager.get('regulationSelection');
                
                // 語彙が「なし」以外の場合の処理
                if (vocab.value !== "no") {
                    regulationSelection.innerHTML = "<option value='default'>デフォルト</option>";
                    
                    if (DictionaryManager.dictionaries[vocab.value].categories) {
                        DictionaryManager.dictionaries[vocab.value].categories.forEach(category => {
                            regulationSelection.innerHTML += "<option value='" + category + "'>" + category + "</option>";
                        });
                    }
                }
                
                // UI状態を更新
                UIManager.updateUIState();
            }
            
            // 生成方法の変更イベント
            if (e.target === DOMManager.get('method')) {
                UIManager.updateUIState();
            }
        });
        
        // クリックイベントの一元管理
        document.addEventListener('click', (e) => {
            // 生成ボタンのクリックイベント
            if (e.target === DOMManager.get('generatingBtn')) {
                this.generateWords();
            }
            
            // 編集ボタンのクリックイベント
            else if (e.target === DOMManager.get('btnEdit')) {
                UIManager.switchToEditMode();
            }
            
            // 編集適用ボタンのクリックイベント
            else if (e.target === DOMManager.get('btnApplyEdit')) {
                UIManager.applyEdit();
            }
            
            // 結果削除ボタンのクリックイベント
            else if (e.target === DOMManager.get('btnDeleteResult')) {
                if (confirm("本当に削除しますか？")) {
                    WordGenerator.clearResults();
                    DOMManager.get('txtEdit').value = "";
                    DOMManager.get('result').innerText = "";
                }
            }
            
            // 結果コピーボタンのクリックイベント
            else if (e.target === DOMManager.get('copyBtnResult')) {
                navigator.clipboard.writeText(DOMManager.get('result').innerText)
                    .then(() => alert("結果をコピーしました"))
                    .catch(err => console.error("コピーに失敗しました", err));
            }
        });
        
        // ダブルクリックイベントの管理
        document.addEventListener('dblclick', (e) => {
            // 結果エリアのダブルクリックで編集モードに
            if (e.target === DOMManager.get('result')) {
                UIManager.switchToEditMode();
            }
        });
    },
    
    // 単語生成を実行
    generateWords: function() {
        if (UIManager.validateInput()) {
            WordGenerator.generate();
        }
    }
};

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    eventApp.initialize();
});
