/**
 * script.js - 台本・登場人物機能のためのJavaScriptファイル
 * dakos.jp 映像制作支援サイト
 * ファイルパス: /js/script.js
 */

/* 初期設定 ↓ */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded イベント発火: script.js 読み込み開始');
    
    try {
        // グローバル変数の初期化
        initializeGlobalVariables();
        console.log('グローバル変数の初期化完了');
        
        // イベントリスナーの設定
        setupEventListeners();
        console.log('イベントリスナーの設定完了');
        
        // 台本エディタの初期設定（エディタページの場合のみ）
        if (document.getElementById('scriptEditArea')) {
            console.log('scriptEditArea を検出: 台本エディタの初期化開始');
            initializeScriptEditor();
            console.log('台本エディタの初期化完了');
        } else {
            console.log('scriptEditArea が見つかりません');
        }
        
        // 登場人物テーブルの初期設定（登場人物ページの場合のみ）
        if (document.getElementById('characters-table')) {
            console.log('characters-table を検出: 登場人物テーブルの初期化開始');
            initializeCharacterTable();
            console.log('登場人物テーブルの初期化完了');
        }
        
        console.log('script.js の初期化が正常に完了しました');
    } catch (error) {
        console.error('script.js の初期化中にエラーが発生しました:', error);
    }
    
    // 初期化完了フラグを設定
    window.dakosScriptInitialized = true;
});

/**
 * グローバル変数の初期化
 */
function initializeGlobalVariables() {
    // 台本の状態を保持するグローバル変数
    window.scriptState = {
        edited: false,                    // 編集されたかどうか
        currentScene: 0,                  // 現在選択中のシーン番号
        sceneCount: 0,                    // シーン数
        displayMode: 'horizontal',        // 表示モード（horizontal/vertical）
        viewSettings: {                   // 表示設定
            hiddenHashira: false,         // 隠れ柱表示
            hiddenTogaki: false,          // 隠れト書き表示
            hiddenChar: false,            // 隠れ登場人物表示
            editMark: false,              // 編集記号表示
            pageBreak: false,             // ページ区切り表示
            structure: false,             // 柱・ト書き・セリフ表示
            kouban: false,                // 香盤情報表示
            cut: false,                   // カット割表示
            lineNumber: false,            // 行番号表示
            bookmark: false               // しおり表示
        },
        selection: {                      // 選択中のテキスト情報
            text: '',                     // 選択テキスト
            range: null,                  // 選択範囲
            element: null                 // 選択要素
        },
        lineNumbers: [],                  // 行番号情報
        sceneLineNumbers: {},             // シーンごとの行番号
        characters: [],                   // 登場人物リスト（最近使用順）
        shapes: [],                       // 図形描画データ
        bookmarks: [],                    // しおり情報
        undoStack: [],                    // 元に戻す用スタック
        redoStack: [],                    // やり直し用スタック
        isSaving: false,                  // 保存中かどうか
        lastSaved: new Date(),            // 最終保存日時
        maxUndoSteps: 50                  // 最大Undo回数
    };
    
    // フォーム関連のグローバル変数
    window.formState = {
        scriptId: document.querySelector('input[name="script_id"]') ? 
                 document.querySelector('input[name="script_id"]').value : '',
        workId: document.querySelector('input[name="work_id"]') ? 
               document.querySelector('input[name="work_id"]').value : '',
        editMode: document.querySelector('input[name="edit_mode"]') ? 
                 document.querySelector('input[name="edit_mode"]').value === '1' : false,
        csrfToken: document.querySelector('input[name="csrf_token"]') ? 
                  document.querySelector('input[name="csrf_token"]').value : ''
    };
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 台本編集画面のイベントリスナー
    if (document.getElementById('scriptEditArea')) {
        setupScriptEditorListeners();
    }
    
    // 台本閲覧画面のイベントリスナー
    if (document.getElementById('scriptViewArea')) {
        setupScriptViewerListeners();
    }
    
    // 登場人物テーブルのイベントリスナー
    if (document.getElementById('characters-table')) {
        setupCharacterTableListeners();
    }
    
    // 画面離脱時の警告
    window.addEventListener('beforeunload', function(e) {
        if (window.scriptState && window.scriptState.edited) {
            const message = '変更が保存されていません。本当にページを離れますか？';
            e.returnValue = message;
            return message;
        }
    });
}
/* 初期設定 ↑ */

/* 台本エディタ初期化 ↓ */
/**
 * 台本エディタの初期化
 */
function initializeScriptEditor() {
    console.log('台本エディタを初期化しています...');
    
    // エディタ要素の取得
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 初期シーン数をカウントし設定
    const scenes = editArea.querySelectorAll('.script-scene');
    window.scriptState.sceneCount = scenes.length;
    
    // シーン一覧を更新
    updateSceneList();
    
    // 行番号を生成
    generateLineNumbers();
    
    // 編集状態の監視を開始
    startEditWatcher();
    
    // 登場人物リストを読み込み
    loadCharacterList();
    
    // 表示設定の初期値を適用
    applyViewSettings();
    
    // ユーザー設定を読み込み
    loadUserSettings();
    
    // 自動保存の設定（5分ごと）
    setInterval(function() {
        if (window.scriptState.edited && !window.scriptState.isSaving) {
            autoSave();
        }
    }, 5 * 60 * 1000); // 5分
    
    console.log('台本エディタの初期化が完了しました');
}

/**
 * 台本エディタのイベントリスナー設定
 */
function setupScriptEditorListeners() {
    // メニューバーのイベントリスナー
    setupMenuListeners();
    
    // ツールバーのイベントリスナー
    setupToolbarListeners();
    
    // エディタ本体のイベントリスナー
    setupEditorListeners();
    
    // サイドバーのイベントリスナー
    setupSidebarListeners();
    
    // モーダルダイアログのイベントリスナー
    setupModalListeners();
    
    // キーボードショートカットの設定
    setupKeyboardShortcuts();
}

/**
 * メニューバーのイベントリスナー設定
 */
function setupMenuListeners() {
    // ファイルメニュー
    document.getElementById('menuNewFile')?.addEventListener('click', createNewScript);
    document.getElementById('menuOpenVersion')?.addEventListener('click', openVersionModal);
    document.getElementById('menuDeleteVersion')?.addEventListener('click', deleteVersion);
    document.getElementById('menuDeleteAll')?.addEventListener('click', deleteAllVersions);
    document.getElementById('menuExitEdit')?.addEventListener('click', exitEditMode);
    
    // 保存メニュー
    document.getElementById('menuSaveOverwrite')?.addEventListener('click', saveOverwrite);
    document.getElementById('menuSaveVersion')?.addEventListener('click', saveNewVersion);
    document.getElementById('menuSetFinal')?.addEventListener('click', setFinalVersion);
    document.getElementById('menuSyncKouban')?.addEventListener('click', syncKoubanInfo);
    document.getElementById('menuSaveText')?.addEventListener('click', saveAsText);
    document.getElementById('menuSavePDF')?.addEventListener('click', saveAsPDF);
    
    // 挿入メニュー
    document.getElementById('menuInsertHashira')?.addEventListener('click', insertHashira);
    document.getElementById('menuInsertHiddenHashira')?.addEventListener('click', insertHiddenHashira);
    document.getElementById('menuInsertTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('menuInsertHiddenTogaki')?.addEventListener('click', insertHiddenTogaki);
    document.getElementById('menuInsertHiddenChar')?.addEventListener('click', insertHiddenChar);
    document.getElementById('menuInsertSerifu')?.addEventListener('click', insertSerifu);
    
    // 特殊記号のサブメニュー項目のイベントリスナー
    document.querySelectorAll('#menuInsertSpecialMark .script-submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            if (action === 'insertTimeProgress') {
                insertTimeProgress();
            }
        });
    });
    
    // 編集記号のサブメニュー項目のイベントリスナー
    document.querySelectorAll('#menuInsertEditMark .script-submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            const mark = this.getAttribute('data-mark');
            insertEditMark(mark);
        });
    });
    
    document.getElementById('menuInsertImage')?.addEventListener('click', insertImage);
    document.getElementById('menuInsertPageBreak')?.addEventListener('click', insertPageBreak);
    document.getElementById('menuInsertLink')?.addEventListener('click', insertLink);
    document.getElementById('menuInsertTextboxV')?.addEventListener('click', insertTextboxVertical);
    document.getElementById('menuInsertTextboxH')?.addEventListener('click', insertTextboxHorizontal);
    document.getElementById('menuInsertCut')?.addEventListener('click', insertCutMark);
    
    // 香盤情報メニュー
    document.getElementById('menuKoubanAll')?.addEventListener('click', () => registerKoubanInfo('all'));
    document.getElementById('menuKoubanChar')?.addEventListener('click', () => registerKoubanInfo('character'));
    document.getElementById('menuKoubanProp')?.addEventListener('click', () => registerKoubanInfo('prop'));
    document.getElementById('menuKoubanDevice')?.addEventListener('click', () => registerKoubanInfo('device'));
    document.getElementById('menuKoubanCostume')?.addEventListener('click', () => registerKoubanInfo('costume'));
    document.getElementById('menuKoubanMakeup')?.addEventListener('click', () => registerKoubanInfo('makeup'));
    document.getElementById('menuKoubanEffect')?.addEventListener('click', () => registerKoubanInfo('effect'));
    document.getElementById('menuKoubanPlace1')?.addEventListener('click', () => registerKoubanInfo('place1'));
    document.getElementById('menuKoubanPlace2')?.addEventListener('click', () => registerKoubanInfo('place2'));
    document.getElementById('menuKoubanPlace3')?.addEventListener('click', () => registerKoubanInfo('place3'));
    document.getElementById('menuKoubanTime')?.addEventListener('click', () => registerKoubanInfo('time'));
    document.getElementById('menuKoubanOther')?.addEventListener('click', () => registerKoubanInfo('other'));
    
    // 描画メニュー
    document.getElementById('menuDrawRect')?.addEventListener('click', () => drawShape('rect'));
    document.getElementById('menuDrawCircle')?.addEventListener('click', () => drawShape('circle'));
    document.getElementById('menuDrawEllipse')?.addEventListener('click', () => drawShape('ellipse'));
    document.getElementById('menuDrawTriangle')?.addEventListener('click', () => drawShape('triangle'));
    document.getElementById('menuDrawLine')?.addEventListener('click', () => drawShape('line'));
    document.getElementById('menuDrawArrow')?.addEventListener('click', () => drawShape('arrow'));
    document.getElementById('menuDrawBubble')?.addEventListener('click', () => drawShape('bubble'));
    
    // 表示メニュー
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            const currentState = this.getAttribute('data-state');
            const newState = currentState === 'hidden' ? 'visible' : 'hidden';
            
            // 表示状態を更新
            this.setAttribute('data-state', newState);
            
            // メニュー表示を更新
            if (newState === 'visible') {
                this.textContent = this.textContent.replace('表示', '非表示');
            } else {
                this.textContent = this.textContent.replace('非表示', '表示');
            }
            
            // 表示設定を適用
            toggleViewSetting(viewType, newState === 'visible');
        });
    });
    
    // 校閲メニュー
    document.getElementById('menuCheckSpelling')?.addEventListener('click', checkSpelling);
    document.getElementById('menuCountChars')?.addEventListener('click', countCharacters);
    document.getElementById('menuCheckProhibited')?.addEventListener('click', checkProhibitedWords);
}

/**
 * ツールバーのイベントリスナー設定
 */
function setupToolbarListeners() {
    // 保存ボタン
    document.getElementById('toolbarSaveBtn')?.addEventListener('click', saveOverwrite);
    
    // 要素挿入ボタン
    document.getElementById('toolHashira')?.addEventListener('click', insertHashira);
    document.getElementById('toolTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('toolSerifu')?.addEventListener('click', insertSerifu);
    
    // 元に戻す/やり直しボタン
    document.getElementById('toolUndo')?.addEventListener('click', undoAction);
    document.getElementById('toolRedo')?.addEventListener('click', redoAction);
    
    // コピー/ペーストボタン
    document.getElementById('toolCopy')?.addEventListener('click', copySelection);
    document.getElementById('toolPaste')?.addEventListener('click', pasteContent);
    
    // テキスト装飾ボタン
    document.getElementById('toolBold')?.addEventListener('click', () => applyTextFormat('bold'));
    document.getElementById('toolItalic')?.addEventListener('click', () => applyTextFormat('italic'));
    document.getElementById('toolUnderline')?.addEventListener('click', () => applyTextFormat('underline'));
    document.getElementById('toolStrike')?.addEventListener('click', () => applyTextFormat('strikethrough'));
    
    document.getElementById('toolSubscript')?.addEventListener('click', () => applyTextFormat('subscript'));
    document.getElementById('toolSuperscript')?.addEventListener('click', () => applyTextFormat('superscript'));
    document.getElementById('toolBox')?.addEventListener('click', () => applyTextFormat('box'));
    document.getElementById('toolColor')?.addEventListener('click', () => applyTextFormat('color'));
    document.getElementById('toolHighlight')?.addEventListener('click', () => applyTextFormat('highlight'));
    document.getElementById('toolPattern')?.addEventListener('click', () => applyTextFormat('pattern'));
    
    // ルビ/リンクボタン
    document.getElementById('toolRuby')?.addEventListener('click', insertRuby);
    document.getElementById('toolLink')?.addEventListener('click', insertLink);
    
    // 文字サイズボタン
    document.getElementById('toolFontSmall')?.addEventListener('click', () => applyTextFormat('fontSmall'));
    document.getElementById('toolFontMedium')?.addEventListener('click', () => applyTextFormat('fontMedium'));
    document.getElementById('toolFontLarge')?.addEventListener('click', () => applyTextFormat('fontLarge'));
    
    // テキスト配置ボタン
    document.getElementById('toolAlignLeft')?.addEventListener('click', () => applyTextFormat('alignLeft'));
    document.getElementById('toolAlignCenter')?.addEventListener('click', () => applyTextFormat('alignCenter'));
    document.getElementById('toolAlignRight')?.addEventListener('click', () => applyTextFormat('alignRight'));
    document.getElementById('toolAlignJustify')?.addEventListener('click', () => applyTextFormat('alignJustify'));
    
    // 特殊文字ボタン
    document.getElementById('toolEllipsis')?.addEventListener('click', () => insertSpecialChar('…'));
    document.getElementById('toolDash')?.addEventListener('click', () => insertSpecialChar('―'));
    
    // リスト/数字リストボタン
    document.getElementById('toolBulletList')?.addEventListener('click', () => applyTextFormat('bulletList'));
    document.getElementById('toolNumberList')?.addEventListener('click', () => applyTextFormat('numberList'));
    
    // セリフ連結ボタン
    document.getElementById('toolJoinSerifu')?.addEventListener('click', joinSerifu);
    
    // 画像挿入ボタン
    document.getElementById('toolImage')?.addEventListener('click', insertImage);
}

/**
 * エディタ本体のイベントリスナー設定
 */
function setupEditorListeners() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 編集エリアの変更イベント
    editArea.addEventListener('input', function() {
        window.scriptState.edited = true;
        generateLineNumbers();
    });
    
    // クリックイベント（要素選択など）
    editArea.addEventListener('click', function(e) {
        // 選択中の行ハイライト
        highlightCurrentLine(e.target);
        
        // 編集箇所までスクロール
        syncLineNumbersScroll();
    });
    
    // キーダウンイベント（特殊キー処理）
    editArea.addEventListener('keydown', function(e) {
        handleEditorKeydown(e);
    });
    
    // セレクションイベント（選択テキスト管理）
    editArea.addEventListener('mouseup', updateSelectionInfo);
    editArea.addEventListener('keyup', updateSelectionInfo);
    
    // コンテキストメニュー（右クリックメニュー）
    editArea.addEventListener('contextmenu', showContextMenu);
    
    // ドラッグアンドドロップイベント（画像や図形）
    editArea.addEventListener('dragover', handleDragOver);
    editArea.addEventListener('drop', handleDrop);
    
    // フォーカスイベント（行ハイライト）
    editArea.addEventListener('focus', function() {
        // フォーカス時の処理
    });
    
    // ブラー（フォーカス喪失）イベント
    editArea.addEventListener('blur', function() {
        // フォーカス喪失時の処理
    });
    
    // スクロールイベント（行番号同期）
    editArea.addEventListener('scroll', function() {
        syncLineNumbersScroll();
    });
}

/**
 * サイドバーのイベントリスナー設定
 */
function setupSidebarListeners() {
    // シーン一覧のクリックイベント
    document.querySelectorAll('.script-sidebar-scene').forEach(sceneItem => {
        sceneItem.addEventListener('click', function() {
            const sceneIndex = this.getAttribute('data-scene');
            jumpToScene(parseInt(sceneIndex));
        });
    });
}

/**
 * モーダルダイアログのイベントリスナー設定
 */
function setupModalListeners() {
    // 閉じるボタン
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // 登場人物選択モーダル
    setupCharacterSelectionModal();
    
    // 香盤情報モーダル
    setupKoubanModal();
    
    // バージョン選択モーダル
    setupVersionModal();
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // 修飾キーの判定（MacとWindowsで異なる）
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        
        // ショートカットキーの処理
        if (ctrlKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    if (e.shiftKey) {
                        // Ctrl+Shift+S: バージョン保存
                        e.preventDefault();
                        saveNewVersion();
                    } else {
                        // Ctrl+S: 上書き保存
                        e.preventDefault();
                        saveOverwrite();
                    }
                    break;
                case 'n':
                    if (e.shiftKey) {
                        // Ctrl+Shift+N: バージョンを開く
                        e.preventDefault();
                        openVersionModal();
                    } else {
                        // Ctrl+N: 新規作成
                        e.preventDefault();
                        createNewScript();
                    }
                    break;
                case 'h':
                    if (e.shiftKey) {
                        // Ctrl+Shift+H: 隠れ柱挿入
                        e.preventDefault();
                        insertHiddenHashira();
                    } else {
                        // Ctrl+H: 柱挿入
                        e.preventDefault();
                        insertHashira();
                    }
                    break;
                case 't':
                    if (e.shiftKey) {
                        // Ctrl+Shift+T: 隠れト書き挿入
                        e.preventDefault();
                        insertHiddenTogaki();
                    } else {
                        // Ctrl+T: ト書き挿入
                        e.preventDefault();
                        insertTogaki();
                    }
                    break;
                case 'l':
                    // Ctrl+L: セリフ挿入
                    e.preventDefault();
                    insertSerifu();
                    break;
                case 'z':
                    if (e.shiftKey) {
                        // Ctrl+Shift+Z: やり直し
                        e.preventDefault();
                        redoAction();
                    } else {
                        // Ctrl+Z: 元に戻す
                        e.preventDefault();
                        undoAction();
                    }
                    break;
                case 'y':
                    // Ctrl+Y: やり直し
                    e.preventDefault();
                    redoAction();
                    break;
            }
        }
    });
}

/**
 * 登場人物選択モーダルの設定
 */
function setupCharacterSelectionModal() {
    const modal = document.getElementById('character-select-modal');
    if (!modal) return;
    
    // 登場人物クリックイベント
    document.querySelectorAll('.character-item').forEach(item => {
        item.addEventListener('click', function() {
            const characterName = this.getAttribute('data-name');
            insertCharacterName(characterName);
            modal.style.display = 'none';
        });
    });
    
    // 新規登場人物追加ボタン
    document.getElementById('add-character-btn')?.addEventListener('click', function() {
        const input = document.getElementById('custom-character');
        const name = input.value.trim();
        if (name) {
            insertCharacterName(name);
            modal.style.display = 'none';
            input.value = '';
        }
    });
}

/**
 * 香盤情報モーダルの設定
 */
function setupKoubanModal() {
    const modal = document.getElementById('kouban-select-modal');
    if (!modal) return;
    
    // 香盤情報適用ボタン
    document.getElementById('apply-kouban-btn')?.addEventListener('click', function() {
        const koubanType = document.getElementById('kouban-type').value;
        const koubanDesc = document.getElementById('kouban-desc').value;
        
        applyKoubanInfo(koubanType, koubanDesc);
        modal.style.display = 'none';
    });
}

/**
 * バージョン選択モーダルの設定
 */
function setupVersionModal() {
    const modal = document.getElementById('version-select-modal');
    if (!modal) return;
    
    // バージョン一覧読み込みとイベント設定は実行時に動的に行う
}
/* 台本エディタ初期化 ↑ */

/* 台本編集機能 ↓ */
/**
 * 指定されたシーンにジャンプする
 * @param {number} sceneIndex シーンインデックス
 */
function jumpToScene(sceneIndex) {
    const scenes = document.querySelectorAll('.script-scene');
    if (sceneIndex >= 0 && sceneIndex < scenes.length) {
        // 現在のシーンインデックスを更新
        window.scriptState.currentScene = sceneIndex;
        
        // シーン要素にスクロール
        scenes[sceneIndex].scrollIntoView({ behavior: 'smooth' });
        
        // サイドバーのハイライト更新
        document.querySelectorAll('.script-sidebar-scene').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.script-sidebar-scene[data-scene="${sceneIndex}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

/**
 * シーン一覧を更新する
 */
function updateSceneList() {
    const sidebarList = document.getElementById('script-scene-list');
    const scenes = document.querySelectorAll('.script-scene');
    
    if (!sidebarList) return;
    
    // 既存の内容をクリア
    sidebarList.innerHTML = '';
    
    // シーン一覧を再構築
    scenes.forEach((scene, index) => {
        const hashiraId = scene.querySelector('.script-hashira-id')?.textContent.trim() || '';
        const location = scene.querySelector('.script-hashira-location')?.textContent.trim() || '';
        
        const sceneItem = document.createElement('div');
        sceneItem.className = 'script-sidebar-scene';
        sceneItem.setAttribute('data-scene', index);
        
        // しおりがある場合はアイコンを表示
        if (hasBookmark(index)) {
            const bookmarkIcon = document.createElement('span');
            bookmarkIcon.className = 'sidebar-bookmark';
            sceneItem.appendChild(bookmarkIcon);
        }
        
        sceneItem.appendChild(document.createTextNode(`#${hashiraId} ${location}`));
        
        // クリックイベントを設定
        sceneItem.addEventListener('click', function() {
            jumpToScene(index);
        });
        
        sidebarList.appendChild(sceneItem);
    });
    
    // 現在のシーンをハイライト
    const currentScene = window.scriptState.currentScene;
    const activeItem = sidebarList.querySelector(`.script-sidebar-scene[data-scene="${currentScene}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

/**
 * 行番号を生成する
 */
function generateLineNumbers() {
    const editArea = document.getElementById('scriptEditArea');
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (!editArea || !lineNumbersCont || !lineNumbersScene) return;
    
    // 行番号エリアをクリア
    lineNumbersCont.innerHTML = '';
    lineNumbersScene.innerHTML = '';
    
    // 行番号情報を初期化
    window.scriptState.lineNumbers = [];
    window.scriptState.sceneLineNumbers = {};
    
    let lineCount = 1;
    let currentSceneIndex = 0;
    let sceneLineCount = 1;
    
    // 編集エリア内の要素を走査して行番号を生成
    const elements = editArea.querySelectorAll('.scriptarea-hashira, .scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .script-page-break, .time-progress');
    
    elements.forEach((element, index) => {
        // シーン開始を検出
        if (element.classList.contains('scriptarea-hashira')) {
            // 新しいシーンの開始
            const sceneElement = element.closest('.script-scene');
            if (sceneElement) {
                currentSceneIndex = Array.from(document.querySelectorAll('.script-scene')).indexOf(sceneElement);
                sceneLineCount = 1;
                
                // シーンごとの行番号オブジェクトを初期化
                if (!window.scriptState.sceneLineNumbers[currentSceneIndex]) {
                    window.scriptState.sceneLineNumbers[currentSceneIndex] = [];
                }
            }
        }
        
        // 行番号を生成
        const lineItemCont = document.createElement('div');
        lineItemCont.className = 'script-line-number';
        lineItemCont.textContent = lineCount;
        lineItemCont.setAttribute('data-element-index', index);
        
        const lineItemScene = document.createElement('div');
        lineItemScene.className = 'script-line-number';
        lineItemScene.textContent = sceneLineCount;
        lineItemScene.setAttribute('data-element-index', index);
        
        // シーン開始行の場合、クラスを追加
        if (sceneLineCount === 1) {
            lineItemScene.classList.add('scene-start-number');
        }
        
        // しおりが設定されている場合はアイコンを表示
        if (isLineBookmarked(lineCount)) {
            const bookmark = document.createElement('div');
            bookmark.className = 'script-bookmark';
            bookmark.setAttribute('data-line', lineCount);
            bookmark.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
            
            // しおり番号を表示
            const bookmarkData = getBookmarkByLine(lineCount);
            if (bookmarkData) {
                const bookmarkNumber = document.createElement('span');
                bookmarkNumber.className = 'script-bookmark-number';
                bookmarkNumber.textContent = bookmarkData.number;
                bookmark.appendChild(bookmarkNumber);
            }
            
            // クリックイベントを設定
            bookmark.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleBookmark(lineCount);
            });
            
            lineItemCont.appendChild(bookmark);
        }
        
        // 行番号コンテナに追加
        lineNumbersCont.appendChild(lineItemCont);
        lineNumbersScene.appendChild(lineItemScene);
        
        // 行番号情報を保存
        window.scriptState.lineNumbers.push({
            lineNumber: lineCount,
            sceneIndex: currentSceneIndex,
            sceneLineNumber: sceneLineCount,
            element: element
        });
        
        // シーンごとの行番号情報も保存
        if (window.scriptState.sceneLineNumbers[currentSceneIndex]) {
            window.scriptState.sceneLineNumbers[currentSceneIndex].push({
                lineNumber: lineCount,
                sceneLineNumber: sceneLineCount,
                element: element
            });
        }
        
        // 行番号をインクリメント
        lineCount++;
        sceneLineCount++;
    });
}

/**
 * 行番号エリアとエディタエリアのスクロール位置を同期する
 */
function syncLineNumbersScroll() {
    const editArea = document.getElementById('scriptEditArea');
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (!editArea || !lineNumbersCont || !lineNumbersScene) return;
    
    lineNumbersCont.scrollTop = editArea.scrollTop;
    lineNumbersScene.scrollTop = editArea.scrollTop;
}

/**
 * 現在の行をハイライトする
 * @param {Element} targetElement ハイライト対象の要素
 */
function highlightCurrentLine(targetElement) {
    // ハイライトクラスをすべての要素から削除
    document.querySelectorAll('.current-line').forEach(el => {
        el.classList.remove('current-line');
    });
    
    // 対象要素が編集対象要素の場合、ハイライトクラスを追加
    const highlightElements = [
        '.scriptarea-hashira',
        '.scriptarea-togaki',
        '.scriptarea-serifu',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden',
        '.script-hashira-location',
        '.script-hashira-time',
        '.script-serifu-name',
        '.script-serifu-content'
    ];
    
    let target = targetElement;
    while (target && target.id !== 'scriptEditArea') {
        const selector = highlightElements.find(sel => target.matches(sel));
        if (selector) {
            target.classList.add('current-line');
            
            // 対応する行番号もハイライト
            highlightLineNumber(target);
            break;
        }
        target = target.parentElement;
    }
}

/**
 * 対応する行番号をハイライトする
 * @param {Element} element ハイライト対象の要素
 */
function highlightLineNumber(element) {
    const lineInfo = window.scriptState.lineNumbers.find(line => line.element === element);
    if (!lineInfo) return;
    
    // 行番号ハイライトクラスをすべての要素から削除
    document.querySelectorAll('.script-line-number.current-line').forEach(el => {
        el.classList.remove('current-line');
    });
    
    // 該当する行番号にハイライトクラスを追加
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (lineNumbersCont) {
        const lineNumberElement = lineNumbersCont.children[lineInfo.lineNumber - 1];
        if (lineNumberElement) {
            lineNumberElement.classList.add('current-line');
        }
    }
    
    if (lineNumbersScene) {
        const sceneLineNumberElement = lineNumbersScene.children[lineInfo.lineNumber - 1];
        if (sceneLineNumberElement) {
            sceneLineNumberElement.classList.add('current-line');
        }
    }
}

/**
 * 選択テキスト情報を更新する
 */
function updateSelectionInfo() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const text = range.toString();
    
    // 選択情報を更新
    window.scriptState.selection = {
        text: text,
        range: range,
        element: range.commonAncestorContainer.nodeType === 3 ?
                range.commonAncestorContainer.parentElement :
                range.commonAncestorContainer
    };
}

/**
 * エディタのキーダウンイベントを処理する
 * @param {KeyboardEvent} e キーイベント
 */
function handleEditorKeydown(e) {
    // 編集状態を記録
    if (!window.scriptState.edited && !e.ctrlKey && !e.metaKey && !e.altKey) {
        window.scriptState.edited = true;
    }
    
    // キーに応じた処理
    switch (e.key) {
        case 'Enter':
            // Enter キーの処理
            handleEnterKey(e);
            break;
        case 'Tab':
            // Tab キーの処理
            handleTabKey(e);
            break;
        case 'Backspace':
        case 'Delete':
            // 削除キーの処理
            handleDeleteKey(e);
            break;
    }
}

/**
 * Enter キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleEnterKey(e) {
    // 現在アクティブな要素を取得
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    
    // 柱、ト書き、セリフ要素内でのEnterキーの処理
    if (activeElement && activeElement.contentEditable === 'true') {
        let targetElement = null;
        
        // 親要素を検索して対象となる要素を特定
        let element = activeElement;
        while (element && element.id !== 'scriptEditArea') {
            if (element.classList.contains('scriptarea-togaki') ||
                element.classList.contains('scriptarea-serifu') ||
                element.classList.contains('script-serifu-content')) {
                targetElement = element;
                break;
            }
            element = element.parentElement;
        }
        
        if (targetElement) {
            // ト書きでのEnterキー
            if (targetElement.classList.contains('scriptarea-togaki')) {
                e.preventDefault();
                // 現在位置に新しいト書き要素を挿入
                insertTogakiAtCursor();
                return;
            }
            
            // セリフ内容でのEnterキー
            if (targetElement.classList.contains('script-serifu-content')) {
                // デフォルトの改行動作を許可（複数行セリフの場合）
                return;
            }
            
            // セリフでのEnterキー
            if (targetElement.classList.contains('scriptarea-serifu')) {
                e.preventDefault();
                // 同じ登場人物名で新しいセリフを追加
                const characterName = targetElement.querySelector('.script-serifu-name')?.textContent || '';
                insertSerifuWithName(characterName);
                return;
            }
        }
    }
}

/**
 * Tab キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleTabKey(e) {
    e.preventDefault();
    
    // 現在のアクティブ要素
    const activeElement = document.activeElement;
    
    // 台本編集エリア内でのTabキー
    if (activeElement && activeElement.contentEditable === 'true') {
        // シフトキーが押されている場合は逆順に移動
        if (e.shiftKey) {
            moveToPreviousEditableElement();
        } else {
            moveToNextEditableElement();
        }
    }
}

/**
 * 削除キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleDeleteKey(e) {
    // 削除対象の要素を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 空のト書きやセリフ要素を削除
    if (range.collapsed) {
        const element = range.startContainer.nodeType === 3 ?
                       range.startContainer.parentElement :
                       range.startContainer;
        
        let target = element;
        while (target && target.id !== 'scriptEditArea') {
            if (target.classList.contains('scriptarea-togaki') ||
                target.classList.contains('scriptarea-serifu')) {
                
                // 要素が空の場合は削除
                if (target.textContent.trim() === '' && 
                    (e.key === 'Delete' || e.key === 'Backspace')) {
                    e.preventDefault();
                    target.remove();
                    
                    // 行番号を再生成
                    generateLineNumbers();
                    return;
                }
            }
            target = target.parentElement;
        }
    }
}

/**
 * 次の編集可能要素に移動
 */
function moveToNextEditableElement() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === 3 ?
                          range.startContainer.parentElement :
                          range.startContainer;
    
    // 編集可能要素のセレクタ
    const editableSelectors = [
        '.script-hashira-location',
        '.script-hashira-time',
        '.scriptarea-hashira-hidden',
        '.scriptarea-togaki',
        '.script-serifu-name',
        '.script-serifu-content',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden'
    ];
    
    // 現在の要素以降のすべての編集可能要素を取得
    const editArea = document.getElementById('scriptEditArea');
    const allEditables = Array.from(editArea.querySelectorAll(editableSelectors.join(',')));
    
    // 現在の要素のインデックスを取得
    let currentIndex = -1;
    let targetElement = null;
    
    for (let i = 0; i < allEditables.length; i++) {
        if (allEditables[i].contains(currentElement) || currentElement.contains(allEditables[i])) {
            currentIndex = i;
            break;
        }
    }
    
    // 次の要素に移動
    if (currentIndex !== -1 && currentIndex < allEditables.length - 1) {
        targetElement = allEditables[currentIndex + 1];
    } else if (allEditables.length > 0) {
        // 最後の要素の場合は最初に戻る
        targetElement = allEditables[0];
    }
    
    // 対象要素にフォーカスを移動
    if (targetElement) {
        targetElement.focus();
        
        // カーソルを要素の先頭に設定
        const newRange = document.createRange();
        newRange.selectNodeContents(targetElement);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

/**
 * 前の編集可能要素に移動
 */
function moveToPreviousEditableElement() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === 3 ?
                          range.startContainer.parentElement :
                          range.startContainer;
    
    // 編集可能要素のセレクタ
    const editableSelectors = [
        '.script-hashira-location',
        '.script-hashira-time',
        '.scriptarea-hashira-hidden',
        '.scriptarea-togaki',
        '.script-serifu-name',
        '.script-serifu-content',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden'
    ];
    
    // 現在の要素以前のすべての編集可能要素を取得
    const editArea = document.getElementById('scriptEditArea');
    const allEditables = Array.from(editArea.querySelectorAll(editableSelectors.join(',')));
    
    // 現在の要素のインデックスを取得
    let currentIndex = -1;
    let targetElement = null;
    
    for (let i = 0; i < allEditables.length; i++) {
        if (allEditables[i].contains(currentElement) || currentElement.contains(allEditables[i])) {
            currentIndex = i;
            break;
        }
    }
    
    // 前の要素に移動
    if (currentIndex > 0) {
        targetElement = allEditables[currentIndex - 1];
    } else if (allEditables.length > 0) {
        // 最初の要素の場合は最後に移動
        targetElement = allEditables[allEditables.length - 1];
    }
    
    // 対象要素にフォーカスを移動
    if (targetElement) {
        targetElement.focus();
        
        // カーソルを要素の末尾に設定
        const newRange = document.createRange();
        newRange.selectNodeContents(targetElement);
        newRange.collapse(false);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

/**
 * 編集状態の監視を開始
 */
function startEditWatcher() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 変更の監視用にMutationObserverを設定
    const observer = new MutationObserver(function(mutations) {
        // 変更があった場合は編集状態をtrueに
        window.scriptState.edited = true;
        
        // 行番号を再生成
        generateLineNumbers();
        
        // シーン一覧を更新
        updateSceneList();
    });
    
    // 監視設定
    observer.observe(editArea, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
    });
}

/**
 * 自動保存を実行
 */
function autoSave() {
    // 編集状態がなければ何もしない
    if (!window.scriptState.edited || window.scriptState.isSaving) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // フォームデータを取得
        const formData = new FormData(document.getElementById('script-form'));
        
        // 自動保存フラグを追加
        formData.append('auto_save', '1');
        
        // Ajax送信
        fetch('index-edit-process.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 保存成功
                window.scriptState.edited = false;
                window.scriptState.lastSaved = new Date();
                console.log('自動保存が完了しました');
            } else {
                // 保存失敗
                console.error('自動保存エラー:', data.message);
            }
        })
        .catch(error => {
            console.error('自動保存エラー:', error);
        })
        .finally(() => {
            window.scriptState.isSaving = false;
        });
    } catch (error) {
        console.error('自動保存処理エラー:', error);
        window.scriptState.isSaving = false;
    }
}

/**
 * 台本内容をシリアライズする
 */
function serializeScriptContent() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return null;
    
    const scenes = editArea.querySelectorAll('.script-scene');
    const serializedScenes = [];
    
    scenes.forEach((scene, index) => {
        const sceneData = {
            scene_id: scene.querySelector('.script-hashira-id')?.textContent.trim() || `${index + 1}`.padStart(3, '0'),
            location: scene.querySelector('.script-hashira-location')?.textContent.trim() || '',
            time_setting: scene.querySelector('.script-hashira-time')?.textContent.trim() || '',
            hidden_description: scene.querySelector('.scriptarea-hashira-hidden')?.textContent.trim() || '',
            content: []
        };
        
        // シーン内のコンテンツ要素を取得
        const contentElements = scene.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        contentElements.forEach(element => {
            let contentItem = null;
            
            if (element.classList.contains('scriptarea-togaki')) {
                contentItem = {
                    type: 'togaki',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('scriptarea-serifu')) {
                contentItem = {
                    type: 'serifu',
                    character: element.querySelector('.script-serifu-name')?.textContent.trim() || '',
                    text: element.querySelector('.script-serifu-content')?.textContent.trim() || ''
                };
            } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                contentItem = {
                    type: 'hidden_togaki',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                contentItem = {
                    type: 'hidden_serifu',
                    character: element.querySelector('.script-serifu-name')?.textContent.trim() || '',
                    text: element.querySelector('.script-serifu-content')?.textContent.trim() || ''
                };
            } else if (element.classList.contains('time-progress')) {
                contentItem = {
                    type: 'time_progress',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('script-page-break')) {
                contentItem = {
                    type: 'page_break'
                };
            }
            
            if (contentItem) {
                sceneData.content.push(contentItem);
            }
        });
        
        serializedScenes.push(sceneData);
    });
    
    return {
        scenes: serializedScenes,
        meta: {
            display_mode: window.scriptState.displayMode,
            view_settings: window.scriptState.viewSettings,
            last_saved: new Date().toISOString()
        }
    };
}

/**
 * 上書き保存を実行
 */
function saveOverwrite() {
    if (window.scriptState.isSaving) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // タイトルを取得・設定
        const titleInput = document.getElementById('title');
        if (titleInput) {
            // タイトルが空の場合はデフォルト値を設定
            if (!titleInput.value) {
                const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
                titleInput.value = workTitle ? `${workTitle}台本` : '無題';
            }
        }
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('保存処理エラー:', error);
        alert('保存中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * 新しいバージョンとして保存
 */
function saveNewVersion() {
    if (window.scriptState.isSaving) return;
    
    // バージョン入力ダイアログを表示
    const newVersion = prompt('新しいバージョン名を入力してください（例: 第2稿）');
    if (!newVersion) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // 新規バージョンとして保存するフラグを追加
        const saveAsNewInput = document.createElement('input');
        saveAsNewInput.type = 'hidden';
        saveAsNewInput.name = 'save_as_new_version';
        saveAsNewInput.value = '1';
        document.getElementById('script-form').appendChild(saveAsNewInput);
        
        // タイトルを取得・設定
        const titleInput = document.getElementById('title');
        if (titleInput) {
            // タイトルが空の場合はデフォルト値を設定
            if (!titleInput.value) {
                const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
                titleInput.value = workTitle ? `${workTitle}台本` : '無題';
            }
        }
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('保存処理エラー:', error);
        alert('保存中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * 完成稿として保存
 */
function setFinalVersion() {
    if (window.scriptState.isSaving) return;
    
    // 確認ダイアログ
    const confirmed = confirm('現在の台本を完成稿として設定しますか？\n※完成稿として設定した後も編集は可能です');
    if (!confirmed) return;
    
    // 完成稿フラグを設定
    const isFinalInput = document.getElementById('is_final');
    if (isFinalInput) {
        isFinalInput.value = '1';
    }
    
    // 上書き保存実行
    saveOverwrite();
}

/**
 * 香盤情報を同期
 */
function syncKoubanInfo() {
    if (window.scriptState.isSaving) return;
    
    // 確認ダイアログ
    const confirmed = confirm('現在の台本の内容を香盤表に反映しますか？');
    if (!confirmed) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // 香盤同期フラグを追加
        const syncKoubanInput = document.createElement('input');
        syncKoubanInput.type = 'hidden';
        syncKoubanInput.name = 'sync_kouban';
        syncKoubanInput.value = '1';
        document.getElementById('script-form').appendChild(syncKoubanInput);
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('香盤同期エラー:', error);
        alert('香盤同期中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * テキストとして保存
 */
function saveAsText() {
    // テキスト形式に変換
    let textContent = '';
    const scenes = document.querySelectorAll('.script-scene');
    
    scenes.forEach(scene => {
        // 柱情報
        const hashiraId = scene.querySelector('.script-hashira-id')?.textContent.trim() || '';
        const location = scene.querySelector('.script-hashira-location')?.textContent.trim() || '';
        const time = scene.querySelector('.script-hashira-time')?.textContent.trim() || '';
        
        textContent += `${hashiraId} ${location} ${time}\n\n`;
        
        // シーン内容
        const contentElements = scene.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        contentElements.forEach(element => {
            if (element.classList.contains('scriptarea-togaki')) {
                // ト書き（タブ2つ）
                textContent += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('scriptarea-serifu')) {
                // セリフ（タブ1つ）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                textContent += `\t${name}　${content}\n`;
            } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                // 隠れト書き（タブ2つ）
                textContent += `\t\t(${element.textContent.trim()})\n`;
            } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                // 隠れセリフ（タブ1つ）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                textContent += `\t(${name}　${content})\n`;
            } else if (element.classList.contains('time-progress')) {
                // 時間経過
                textContent += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('script-page-break')) {
                // ページ区切り
                textContent += `\t\t==========\n`;
            }
        });
        
        // シーン区切り
        textContent += '\n\n';
    });
    
    // ファイル名を決定
    const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
    const version = document.getElementById('version')?.value || '1';
    const isFinal = document.getElementById('is_final')?.value === '1';
    
    const filename = workTitle ? 
        `${workTitle}台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.txt` : 
        `台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.txt`;
    
    // ダウンロード用のリンクを作成
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

/**
 * PDFとして保存
 */
function saveAsPDF() {
    // PDF保存設定ダイアログを表示
    showPDFSettingsDialog();
}

/**
 * PDF設定ダイアログを表示
 */
function showPDFSettingsDialog() {
    // モーダルダイアログ作成
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // モーダルコンテンツ
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // ダイアログヘッダー
    const header = document.createElement('h3');
    header.textContent = 'PDF保存設定';
    
    // 閉じるボタン
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 設定フォーム
    const form = document.createElement('div');
    form.className = 'pdf-settings-form';
    
    // 文字組設定
    const textModeGroup = createFormGroup('文字組:', 'text-mode', [
        { value: 'horizontal', text: '横書き', checked: true },
        { value: 'vertical', text: '縦書き' }
    ]);
    
    // レイアウト設定
    const layoutGroup = createFormGroup('レイアウト:', 'layout', [
        { value: 'a4-portrait', text: 'A4縦', checked: true },
        { value: 'b5-portrait', text: 'B5縦' },
        { value: 'script-portrait', text: '台本サイズ縦' },
        { value: 'a4-landscape', text: 'A4横' },
        { value: 'b5-landscape', text: 'B5横' },
        { value: 'script-landscape', text: '台本サイズ横' }
    ]);
    
    // 文字サイズ設定
    const fontSizeGroup = createFormGroup('文字サイズ:', 'font-size', [
        { value: 'small', text: '小さく(0.8em)' },
        { value: 'normal', text: '標準', checked: true },
        { value: 'large', text: '大きく(1.2em)' }
    ]);
    
    // 行間設定
    const lineHeightGroup = createFormGroup('行間:', 'line-height', [
        { value: 'narrow', text: '狭く(0.8em)' },
        { value: 'normal', text: '標準', checked: true },
        { value: 'wide', text: '広く(1.2em)' }
    ]);
    
    // 色設定
    const colorGroup = createFormGroup('色:', 'color', [
        { value: 'mono', text: 'モノクロ', checked: true },
        { value: 'color', text: 'カラー' }
    ]);
    
    // 書体設定
    const fontFamilyGroup = createFormGroup('書体:', 'font-family', [
        { value: 'mincho', text: '明朝', checked: true },
        { value: 'gothic', text: 'ゴシック' },
        { value: 'maru-gothic', text: '丸ゴシック' }
    ]);
    
    // ボタングループ
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    // 保存ボタン
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn-primary';
    saveButton.textContent = 'PDFを保存';
    saveButton.addEventListener('click', function() {
        // 設定値を取得
        const settings = {
            textMode: getSelectedRadioValue('text-mode'),
            layout: getSelectedRadioValue('layout'),
            fontSize: getSelectedRadioValue('font-size'),
            lineHeight: getSelectedRadioValue('line-height'),
            color: getSelectedRadioValue('color'),
            fontFamily: getSelectedRadioValue('font-family')
        };
        
        // PDF生成
        generatePDF(settings);
        
        // ダイアログを閉じる
        document.body.removeChild(modal);
    });
    
    // キャンセルボタン
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn-secondary';
    cancelButton.textContent = 'キャンセル';
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // ボタンをグループに追加
    buttonGroup.appendChild(saveButton);
    buttonGroup.appendChild(cancelButton);
    
    // フォームに各設定グループを追加
    form.appendChild(textModeGroup);
    form.appendChild(layoutGroup);
    form.appendChild(fontSizeGroup);
    form.appendChild(lineHeightGroup);
    form.appendChild(colorGroup);
    form.appendChild(fontFamilyGroup);
    
    // モーダルにコンテンツを追加
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modalContent.appendChild(buttonGroup);
    
    // モーダルをDOMに追加
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

/**
 * ラジオボタングループを作成
 * @param {string} label ラベル
 * @param {string} name 名前
 * @param {Array} options オプション
 * @returns {HTMLElement} フォームグループ要素
 */
function createFormGroup(label, name, options) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    group.appendChild(labelEl);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'radio-options';
    
    options.forEach(option => {
        const container = document.createElement('div');
        container.className = 'radio-option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        input.id = `${name}-${option.value}`;
        if (option.checked) {
            input.checked = true;
        }
        
        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${name}-${option.value}`;
        optionLabel.textContent = option.text;
        
        container.appendChild(input);
        container.appendChild(optionLabel);
        optionsContainer.appendChild(container);
    });
    
    group.appendChild(optionsContainer);
    return group;
}

/**
 * ラジオボタンの選択値を取得
 * @param {string} name ラジオボタン名
 * @returns {string} 選択値
 */
function getSelectedRadioValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

/**
 * PDFを生成
 * @param {Object} settings PDF設定
 */
function generatePDF(settings) {
    // jsPDFが必要なため、CDNから動的に読み込む
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = function() {
        // HTML2Canvasも読み込む
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script2.onload = function() {
            // PDFの実際の生成処理
            createPDFFromScript(settings);
        };
        document.head.appendChild(script2);
    };
    document.head.appendChild(script);
}

/**
 * 台本内容からPDFを生成
 * @param {Object} settings PDF設定
 */
function createPDFFromScript(settings) {
    // 設定に応じて用紙サイズを決定
    let orientation = 'portrait';
    let format = 'a4';
    
    if (settings.layout.includes('landscape')) {
        orientation = 'landscape';
    }
    
    if (settings.layout.includes('b5')) {
        format = 'b5';
    } else if (settings.layout.includes('script')) {
        // 台本サイズは少し特殊なサイズ（JIS B5 182mm×257mm）
        format = [182, 257];
    }
    
    // jsPDFインスタンス作成
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
        compress: true
    });
    
    // フォント設定
    let fontName = 'HeiseiMin-W3';  // 明朝体
    if (settings.fontFamily === 'gothic') {
        fontName = 'HeiseiKakuGo-W5';  // ゴシック体
    } else if (settings.fontFamily === 'maru-gothic') {
        fontName = 'HeiseiKakuGo-W5';  // 丸ゴシックの代わりにゴシック体
    }
    
    // フォントサイズ設定
    let fontSize = 10;  // 標準
    if (settings.fontSize === 'small') {
        fontSize = 8;
    } else if (settings.fontSize === 'large') {
        fontSize = 12;
    }
    
    // 行間設定
    let lineHeight = 1.5;  // 標準
    if (settings.lineHeight === 'narrow') {
        lineHeight = 1.2;
    } else if (settings.lineHeight === 'wide') {
        lineHeight = 1.8;
    }
    
    // カラー設定
    const useColor = settings.color === 'color';
    
    // ページサイズを取得
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // マージン設定
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // PDF生成元のHTMLコンテンツを用意（PDFエクスポート用のクローンを作成）
    const originalContent = document.getElementById('scriptEditArea');
    const clonedContent = originalContent.cloneNode(true);
    
    // クローンを非表示でドキュメントに追加
    clonedContent.style.position = 'absolute';
    clonedContent.style.left = '-9999px';
    
    // 縦書き設定
    if (settings.textMode === 'vertical') {
        clonedContent.style.writingMode = 'vertical-rl';
        clonedContent.style.textOrientation = 'upright';
    }
    
    // フォントサイズ設定
    if (settings.fontSize === 'small') {
        clonedContent.style.fontSize = '0.8em';
    } else if (settings.fontSize === 'large') {
        clonedContent.style.fontSize = '1.2em';
    }
    
    // 行間設定
    if (settings.lineHeight === 'narrow') {
        clonedContent.style.lineHeight = '0.8em';
    } else if (settings.lineHeight === 'wide') {
        clonedContent.style.lineHeight = '1.2em';
    }
    
    // モノクロ設定
    if (!useColor) {
        clonedContent.style.filter = 'grayscale(100%)';
    }
    
    // 非表示要素を処理
    const hiddenElements = clonedContent.querySelectorAll('.scriptarea-hashira-hidden, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden');
    hiddenElements.forEach(el => {
        if (window.scriptState.viewSettings.hiddenHashira ||
            window.scriptState.viewSettings.hiddenTogaki ||
            window.scriptState.viewSettings.hiddenChar) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    // ページ区切りを処理
    const pageBreaks = clonedContent.querySelectorAll('.script-page-break');
    pageBreaks.forEach(el => {
        if (window.scriptState.viewSettings.pageBreak) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    document.body.appendChild(clonedContent);
    
    // HTML2Canvasを使用してHTMLをキャプチャし、PDFに変換
    html2canvas(clonedContent, {
        scale: 2,  // 高解像度化
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        // PDFにキャンバスを追加
        const imgData = canvas.toDataURL('image/png');
        
        // ページ分割処理
        const contentHeight = canvas.height;
        const contentWidth = canvas.width;
        
        // 1ページあたりのピクセル数（A4縦の場合、1ページあたり約1123ピクセル）
        const pxPerPage = 1123 * (doc.internal.pageSize.getHeight() / 297);  // A4の高さは297mm
        
        // ページ数を計算
        const numPages = Math.ceil(contentHeight / pxPerPage);
        
        // 各ページをPDFに追加
        for (let i = 0; i < numPages; i++) {
            if (i > 0) {
                doc.addPage();
            }
            
            // キャンバスの範囲を計算
            const srcY = i * pxPerPage;
            const height = Math.min(pxPerPage, contentHeight - srcY);
            
            // キャンバスの一部をPDFに追加
            doc.addImage(
                canvas,
                'PNG',
                margin,
                margin,
                contentWidth,
                contentHeight * (contentWidth / canvas.width),
                null,
                'FAST',
                0
            );
        }
        
        // ファイル名を決定
        const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
        const version = document.getElementById('version')?.value || '1';
        const isFinal = document.getElementById('is_final')?.value === '1';
        
        const filename = workTitle ? 
            `${workTitle}台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.pdf` : 
            `台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.pdf`;
        
        // PDFを保存
        doc.save(filename);
        
        // クローンを削除
        document.body.removeChild(clonedContent);
    });
}

/**
 * 日付をフォーマット (YYYYMMDD)
 * @param {Date} date 日付
 * @returns {string} フォーマットされた日付
 */
function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

/**
 * 新しい台本を作成
 */
function createNewScript() {
    if (window.scriptState.edited) {
        const confirmed = confirm('変更内容が保存されていません。新規作成を続けますか？');
        if (!confirmed) return;
    }
    
    // 現在のURLから作品IDを取得
    const uri_path = window.location.pathname;
    const path_parts = uri_path.split('/');
    const work_id_index = path_parts.findIndex(part => part === 'work') + 1;
    
    if (work_id_index > 0 && work_id_index < path_parts.length) {
        const work_id = path_parts[work_id_index];
        
        // 新規作成ページにリダイレクト
        window.location.href = `/work/${work_id}/script/index-edit.php?t=${Date.now()}`;
    }
}

/**
 * バージョン選択モーダルを開く
 */
function openVersionModal() {
    const modal = document.getElementById('version-select-modal');
    const versionList = document.getElementById('version-list');
    
    if (!modal || !versionList) return;
    
    // バージョン一覧をクリア
    versionList.innerHTML = '';
    
    // ロード中表示
    const loadingItem = document.createElement('div');
    loadingItem.className = 'loading-item';
    loadingItem.textContent = 'バージョン情報を読み込んでいます...';
    versionList.appendChild(loadingItem);
    
    // モーダルを表示
    modal.style.display = 'block';
    
    // バージョン情報を取得
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    
    if (!scriptId || !workId) {
        versionList.innerHTML = '<div class="no-versions">台本情報が取得できませんでした。</div>';
        return;
    }
    
    // Ajax通信でバージョン一覧を取得
    fetch(`get_versions.php?script_id=${scriptId}&work_id=${workId}`)
        .then(response => response.json())
        .then(data => {
            // ロード中表示を削除
            versionList.innerHTML = '';
            
            if (!data || data.length === 0 || data.error) {
                versionList.innerHTML = '<div class="no-versions">バージョン情報がありません。</div>';
                return;
            }
            
            // バージョン一覧を表示
            data.forEach(version => {
                const versionItem = document.createElement('div');
                versionItem.className = 'version-item';
                
                const versionTitle = document.createElement('div');
                versionTitle.className = 'version-title';
                versionTitle.textContent = version.is_final == 1 ? '完成稿' : `第${version.version}稿`;
                
                const versionDate = document.createElement('div');
                versionDate.className = 'version-date';
                versionDate.textContent = new Date(version.updated_at).toLocaleString('ja-JP');
                
                versionItem.appendChild(versionTitle);
                versionItem.appendChild(versionDate);
                
                // クリックイベント
                versionItem.addEventListener('click', function() {
                    if (window.scriptState.edited) {
                        const confirmed = confirm('変更内容が保存されていません。このバージョンを開きますか？');
                        if (!confirmed) return;
                    }
                    
                    // リダイレクト
                    window.location.href = `index-edit.php?id=${version.script_id}&version=${version.version}`;
                });
                
                versionList.appendChild(versionItem);
            });
        })
        .catch(error => {
            console.error('バージョン情報取得エラー:', error);
            versionList.innerHTML = '<div class="no-versions">バージョン情報の取得に失敗しました。</div>';
        });
}

/**
 * 現在のバージョンを削除
 */
function deleteVersion() {
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    const version = document.getElementById('version')?.value || '1';
    
    if (!scriptId || !workId) {
        alert('台本情報が取得できませんでした。');
        return;
    }
    
    // 確認ダイアログ
    const confirmed = confirm(`現在のバージョン（第${version}稿）を削除しますか？\nこの操作は元に戻せません。`);
    if (!confirmed) return;
    
    // 削除リクエスト
    const formData = new FormData();
    formData.append('script_id', scriptId);
    formData.append('work_id', workId);
    formData.append('version', version);
    formData.append('csrf_token', document.querySelector('input[name="csrf_token"]')?.value || '');
    formData.append('action', 'delete_version');
    
    fetch('index-edit-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('バージョンを削除しました。');
            // 台本一覧ページにリダイレクト
            window.location.href = `index.php`;
        } else {
            alert(`削除に失敗しました: ${data.message || 'エラーが発生しました'}`);
        }
    })
    .catch(error => {
        console.error('削除エラー:', error);
        alert('削除処理中にエラーが発生しました。');
    });
}

/**
 * すべてのバージョンを削除
 */
function deleteAllVersions() {
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    
    if (!scriptId || !workId) {
        alert('台本情報が取得できませんでした。');
        return;
    }
    
    // 確認ダイアログ
    const confirmed = confirm('この台本のすべてのバージョンを削除しますか？\nこの操作は元に戻せません。');
    if (!confirmed) return;
    
    // 再確認
    const reconfirmed = confirm('本当に削除してよろしいですか？すべてのバージョンのデータが失われます。');
    if (!reconfirmed) return;
    
    // 削除リクエスト
    const formData = new FormData();
    formData.append('script_id', scriptId);
    formData.append('work_id', workId);
    formData.append('csrf_token', document.querySelector('input[name="csrf_token"]')?.value || '');
    formData.append('action', 'delete_all_versions');
    
    fetch('index-edit-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('すべてのバージョンを削除しました。');
            // 台本一覧ページにリダイレクト
            window.location.href = `index.php`;
        } else {
            alert(`削除に失敗しました: ${data.message || 'エラーが発生しました'}`);
        }
    })
    .catch(error => {
        console.error('削除エラー:', error);
        alert('削除処理中にエラーが発生しました。');
    });
}

/**
 * 編集モードを終了
 */
function exitEditMode() {
    if (window.scriptState.edited) {
        const confirmed = confirm('変更内容が保存されていません。編集を終了しますか？');
        if (!confirmed) return;
    }
    
    // 台本閲覧ページにリダイレクト
    window.location.href = 'index.php';
}
/* 台本編集機能 ↑ */

/* 台本要素操作 ↓ */
/**
 * 柱を挿入
 */
function insertHashira() {
    // 柱のHTML
    const hashiraHTML = `
    <div class="script-scene" data-scene-index="${window.scriptState.sceneCount}">
        <div class="scriptarea-hashira">
            <div class="script-hashira-id">${getNextSceneNumber()}</div>
            <div class="script-hashira-content">
                <div class="script-hashira-location-row">
                    <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                    <span class="script-hashira-time" contenteditable="true"></span>
                </div>
                <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
            </div>
        </div>
        <div class="scene-layout">
            <div class="scene-left">
                <!-- 左側エリア -->
            </div>
            <div class="scene-right">
                <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
            </div>
        </div>
    </div>
    `;
    
    // エディタエリア
    const editArea = document.getElementById('scriptEditArea');
    
    // カレントポジションがある場合はその位置に、なければ最後に追加
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        let currentElement = range.startContainer;
        
        // テキストノードの場合は親要素を取得
        if (currentElement.nodeType === 3) {
            currentElement = currentElement.parentElement;
        }
        
        // 現在のシーン要素を検索
        let sceneElement = currentElement;
        while (sceneElement && !sceneElement.classList.contains('script-scene')) {
            sceneElement = sceneElement.parentElement;
            if (sceneElement === editArea) {
                sceneElement = null;
                break;
            }
        }
        
        if (sceneElement) {
            // 現在のシーンの後に追加
            sceneElement.insertAdjacentHTML('afterend', hashiraHTML);
        } else {
            // 最後に追加
            editArea.insertAdjacentHTML('beforeend', hashiraHTML);
        }
    } else {
        // 最後に追加
        editArea.insertAdjacentHTML('beforeend', hashiraHTML);
    }
    
    // シーン数をインクリメント
    window.scriptState.sceneCount++;
    
    // 行番号を再生成
    generateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れ柱を挿入
 */
function insertHiddenHashira() {
    // 選択範囲から現在のシーンを取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 現在のシーン要素を検索
    const editArea = document.getElementById('scriptEditArea');
    let sceneElement = currentElement;
    while (sceneElement && !sceneElement.classList.contains('script-scene')) {
        sceneElement = sceneElement.parentElement;
        if (sceneElement === editArea) {
            sceneElement = null;
            break;
        }
    }
    
    if (!sceneElement) return;
    
    // シーン内の隠れ柱要素を取得
    const hiddenHashira = sceneElement.querySelector('.scriptarea-hashira-hidden');
    
    if (hiddenHashira) {
        // 隠れ柱要素が存在する場合は表示して編集モードにする
        hiddenHashira.style.display = 'block';
        hiddenHashira.focus();
        
        // 表示設定を更新
        window.scriptState.viewSettings.hiddenHashira = true;
        
        // メニュー表示を更新
        const viewToggle = document.querySelector('.view-toggle[data-view="hiddenHashira"]');
        if (viewToggle) {
            viewToggle.setAttribute('data-state', 'visible');
            viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        }
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * ト書きを挿入
 */
function insertTogaki() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // ト書きのHTML
    const togakiHTML = `<div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>`;
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', togakiHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', togakiHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = togakiHTML;
                }
            }
        }
        
        // 新しく追加したト書き要素にフォーカスを当てる
        const newTogaki = insertAfter ? 
                          insertAfter.nextElementSibling : 
                          sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newTogaki) {
            // テキスト全選択
            newTogaki.focus();
            const range = document.createRange();
            range.selectNodeContents(newTogaki);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * カーソル位置にト書きを挿入
 */
function insertTogakiAtCursor() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // ト書き要素を探す
    let togakiElement = currentElement;
    while (togakiElement && !togakiElement.classList.contains('scriptarea-togaki')) {
        togakiElement = togakiElement.parentElement;
    }
    
    if (!togakiElement) return;
    
    // ト書きのHTML
    const togakiHTML = `<div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>`;
    
    // ト書き要素の後に新しいト書きを挿入
    togakiElement.insertAdjacentHTML('afterend', togakiHTML);
    
    // 新しく追加したト書き要素にフォーカスを当てる
    const newTogaki = togakiElement.nextElementSibling;
    if (newTogaki) {
        // テキスト全選択
        newTogaki.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(newTogaki);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れト書きを挿入
 */
function insertHiddenTogaki() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 隠れト書きのHTML
    const hiddenTogakiHTML = `<div class="scriptarea-togaki-hidden" contenteditable="true">隠れト書きを入力...</div>`;
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', hiddenTogakiHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', hiddenTogakiHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = hiddenTogakiHTML;
                }
            }
        }
        
        // 新しく追加した隠れト書き要素にフォーカスを当てる
        const newHiddenTogaki = insertAfter ? 
                               insertAfter.nextElementSibling : 
                               sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newHiddenTogaki) {
            // テキスト全選択
            newHiddenTogaki.focus();
            const range = document.createRange();
            range.selectNodeContents(newHiddenTogaki);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 表示設定を更新
            window.scriptState.viewSettings.hiddenTogaki = true;
            
            // メニュー表示を更新
            const viewToggle = document.querySelector('.view-toggle[data-view="hiddenTogaki"]');
            if (viewToggle) {
                viewToggle.setAttribute('data-state', 'visible');
                viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
            }
            
            // 隠れト書きを表示
            document.querySelectorAll('.scriptarea-togaki-hidden').forEach(el => {
                el.style.display = 'block';
            });
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れ登場人物を挿入
 */
function insertHiddenChar() {
    alert('この機能は現在実装中です');
}

/**
 * セリフを挿入
 */
function insertSerifu() {
    // 登場人物選択モーダルを表示
    document.getElementById('character-select-modal').style.display = 'block';
}

/**
 * 指定した登場人物名でセリフを挿入
 * @param {string} characterName 登場人物名
 */
function insertCharacterName(characterName) {
    if (!characterName) return;
    
    // セリフのHTML
    const serifuHTML = `
    <div class="scriptarea-serifu">
        <div class="script-serifu-name" contenteditable="true">${characterName}</div>
        <div class="script-serifu-content" contenteditable="true">セリフを入力...</div>
    </div>
    `;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', serifuHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', serifuHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = serifuHTML;
                }
            }
        }
        
        // 新しく追加したセリフ要素にフォーカスを当てる
        const newSerifu = insertAfter ? 
                         insertAfter.nextElementSibling : 
                         sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newSerifu) {
            // セリフ内容部分にフォーカス
            const serifuContent = newSerifu.querySelector('.script-serifu-content');
            if (serifuContent) {
                serifuContent.focus();
                
                // テキスト全選択
                const range = document.createRange();
                range.selectNodeContents(serifuContent);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        
        // 登場人物リストに追加（最近使用した登場人物）
        if (!window.scriptState.characters.includes(characterName)) {
            window.scriptState.characters.unshift(characterName);
            
            // 最大10人まで保持
            if (window.scriptState.characters.length > 10) {
                window.scriptState.characters.pop();
            }
        } else {
            // すでに存在する場合は先頭に移動
            const index = window.scriptState.characters.indexOf(characterName);
            window.scriptState.characters.splice(index, 1);
            window.scriptState.characters.unshift(characterName);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 指定した登場人物名でセリフを追加
 * @param {string} characterName 登場人物名
 */
function insertSerifuWithName(characterName) {
    if (!characterName) return;
    
    // セリフのHTML
    const serifuHTML = `
    <div class="scriptarea-serifu">
        <div class="script-serifu-name" contenteditable="true">${characterName}</div>
        <div class="script-serifu-content" contenteditable="true">セリフを入力...</div>
    </div>
    `;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // セリフ要素を探す
    let serifuElement = currentElement;
    while (serifuElement && !serifuElement.classList.contains('scriptarea-serifu')) {
        serifuElement = serifuElement.parentElement;
    }
    
    if (!serifuElement) return;
    
    // セリフ要素の後に新しいセリフを挿入
    serifuElement.insertAdjacentHTML('afterend', serifuHTML);
    
    // 新しく追加したセリフ要素にフォーカスを当てる
    const newSerifu = serifuElement.nextElementSibling;
    if (newSerifu) {
        // セリフ内容部分にフォーカス
        const serifuContent = newSerifu.querySelector('.script-serifu-content');
        if (serifuContent) {
            serifuContent.focus();
            
            // テキスト全選択
            const newRange = document.createRange();
            newRange.selectNodeContents(serifuContent);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 時間経過マークを挿入
 */
function insertTimeProgress() {
    // 時間経過マークのHTML
    const timeProgressHTML = `<div class="scriptarea-togaki time-progress" contenteditable="true">　　×　　×　　×</div>`;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', timeProgressHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', timeProgressHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = timeProgressHTML;
                }
            }
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 編集記号を挿入
 * @param {string} mark 編集記号
 */
function insertEditMark(mark) {
    // マークが選択されていない場合
    if (!mark) return;
    
    // 選択範囲がある場合は置き換え
    const selection = window.getSelection();
    if (selection.rangeCount && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // 選択範囲を編集マークで置き換え
        const markSpan = document.createElement('span');
        markSpan.className = 'edit-mark';
        markSpan.textContent = mark;
        markSpan.style.fontStyle = 'italic';
        markSpan.style.fontSize = '0.8rem';
        markSpan.style.color = 'gray';
        
        range.deleteContents();
        range.insertNode(markSpan);
        
        // カーソルを編集マークの後ろに移動
        range.setStartAfter(markSpan);
        range.setEndAfter(markSpan);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // 選択範囲がなければカーソル位置に挿入
        const markSpan = document.createElement('span');
        markSpan.className = 'edit-mark';
        markSpan.textContent = mark;
        markSpan.style.fontStyle = 'italic';
        markSpan.style.fontSize = '0.8rem';
        markSpan.style.color = 'gray';
        
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.insertNode(markSpan);
            
            // カーソルを編集マークの後ろに移動
            range.setStartAfter(markSpan);
            range.setEndAfter(markSpan);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 画像を挿入
 */
function insertImage() {
    // ファイル選択ダイアログを作成
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // ファイル選択イベント
    input.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // FormDataオブジェクトを作成
            const formData = new FormData();
            formData.append('image', file);
            formData.append('work_id', window.formState.workId);
            formData.append('field_name', 'script');
            formData.append('csrf_token', window.formState.csrfToken);
            
            // 画像をアップロード
            fetch('/work/upload_work_image.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 画像挿入処理
                    insertImageAtCursor(data.image_url);
                } else {
                    alert('画像のアップロードに失敗しました: ' + (data.message || 'エラーが発生しました'));
                }
            })
            .catch(error => {
                console.error('画像アップロードエラー:', error);
                alert('画像のアップロードに失敗しました');
            });
        }
    });
    
    // ファイル選択ダイアログを表示
    input.click();
}

/**
 * カーソル位置に画像を挿入
 * @param {string} imageUrl 画像URL
 */
function insertImageAtCursor(imageUrl) {
    if (!imageUrl) return;
    
    // 画像要素のHTML
    const imgHTML = `<div class="script-image"><img src="${imageUrl}" alt="台本画像" style="max-width: 100%;"></div>`;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        // シーンの左側エリアか右側エリアかを判定
        if (element.classList.contains('scene-left')) {
            // 左側エリアに挿入する場合
            element.insertAdjacentHTML('beforeend', imgHTML);
            return;
        }
        
        if (element.classList.contains('scene-right')) {
            // 右側エリアに挿入する場合（行要素として）
            if (element.childElementCount > 0) {
                // カーソル位置が特定できていれば、その要素の前に挿入
                if (insertAfter) {
                    insertAfter.insertAdjacentHTML('afterend', imgHTML);
                } else {
                    // そうでなければ最初の要素の前に挿入
                    element.firstElementChild.insertAdjacentHTML('beforebegin', imgHTML);
                }
            } else {
                // scene-rightが空の場合は内部に追加
                element.innerHTML = imgHTML;
            }
            return;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', imgHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', imgHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = imgHTML;
                }
            } else {
                // scene-leftの子要素として追加
                const sceneLeft = sceneElement.querySelector('.scene-left');
                if (sceneLeft) {
                    sceneLeft.insertAdjacentHTML('beforeend', imgHTML);
                }
            }
        }
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * ページ区切りを挿入
 */
function insertPageBreak() {
    // ページ区切りのHTML
    const pageBreakHTML = `<div class="script-page-break">＝＝＝＝＝ページ区切り＝＝＝＝＝</div>`;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', pageBreakHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', pageBreakHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = pageBreakHTML;
                }
            }
        }
        
        // 表示設定を更新
        window.scriptState.viewSettings.pageBreak = true;
        
        // メニュー表示を更新
        const viewToggle = document.querySelector('.view-toggle[data-view="pageBreak"]');
        if (viewToggle) {
            viewToggle.setAttribute('data-state', 'visible');
            viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        }
        
        // ページ区切りを表示
        document.querySelectorAll('.script-page-break').forEach(el => {
            el.style.display = 'block';
        });
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * リンクを挿入
 */
function insertLink() {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // リンク先URLを入力
    const url = prompt('リンク先URLを入力してください', 'https://');
    if (!url) return;
    
    // リンク要素を作成
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.textContent = selectedText || url;
    
    // 選択範囲を置き換え
    range.deleteContents();
    range.insertNode(link);
    
    // カーソルをリンクの後ろに移動
    range.setStartAfter(link);
    range.setEndAfter(link);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 縦書きテキストボックスを挿入
 */
function insertTextboxVertical() {
    insertTextbox(true);
}

/**
 * 横書きテキストボックスを挿入
 */
function insertTextboxHorizontal() {
    insertTextbox(false);
}

/**
 * テキストボックスを挿入
 * @param {boolean} isVertical 縦書きかどうか
 */
function insertTextbox(isVertical) {
    // テキストボックスのHTML
    const className = isVertical ? 'script-textbox-vertical' : 'script-textbox-horizontal';
    const textboxHTML = `
    <div class="${className}" style="position: absolute; left: 100px; top: 100px; width: 200px; height: 200px; border: 2px solid black; padding: 10px; background-color: white; z-index: 100;" contenteditable="true">
        テキストを入力...
    </div>
    `;
    
    // 編集エリアに追加
    const editArea = document.getElementById('scriptEditArea');
    editArea.insertAdjacentHTML('beforeend', textboxHTML);
    
    // 最後に追加したテキストボックスを取得
    const textbox = editArea.lastElementChild;
    
    // テキストボックスをドラッグ可能にする
    makeTextboxDraggable(textbox);
    
    // テキストボックスをリサイズ可能にする
    makeTextboxResizable(textbox);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * テキストボックスをドラッグ可能にする
 * @param {HTMLElement} textbox テキストボックス要素
 */
function makeTextboxDraggable(textbox) {
    let isDragging = false;
    let offsetX, offsetY;
    
    // マウスダウンイベント
    textbox.addEventListener('mousedown', function(e) {
        // コンテンツの編集中はドラッグを開始しない
        if (e.target === textbox) {
            isDragging = true;
            offsetX = e.clientX - textbox.getBoundingClientRect().left;
            offsetY = e.clientY - textbox.getBoundingClientRect().top;
            
            // 最前面に表示
            textbox.style.zIndex = 100;
            
            // 他のテキストボックスのzインデックスを下げる
            document.querySelectorAll('.script-textbox-vertical, .script-textbox-horizontal').forEach(box => {
                if (box !== textbox) {
                    box.style.zIndex = 99;
                }
            });
            
            e.preventDefault();
        }
    });
    
    // マウスムーブイベント
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const editArea = document.getElementById('scriptEditArea');
            const editAreaRect = editArea.getBoundingClientRect();
            
            // 編集エリア内での位置を計算
            const left = e.clientX - offsetX - editAreaRect.left;
            const top = e.clientY - offsetY - editAreaRect.top;
            
            // 位置を更新
            textbox.style.left = `${left}px`;
            textbox.style.top = `${top}px`;
            
            e.preventDefault();
        }
    });
    
    // マウスアップイベント
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

/**
 * テキストボックスをリサイズ可能にする
 * @param {HTMLElement} textbox テキストボックス要素
 */
function makeTextboxResizable(textbox) {
    // リサイズハンドルを追加
    const handles = [
        { class: 'nw', cursor: 'nw-resize' },
        { class: 'ne', cursor: 'ne-resize' },
        { class: 'sw', cursor: 'sw-resize' },
        { class: 'se', cursor: 'se-resize' }
    ];
    
    handles.forEach(handle => {
        const handleEl = document.createElement('div');
        handleEl.className = `resize-handle ${handle.class}`;
        handleEl.style.position = 'absolute';
        handleEl.style.width = '10px';
        handleEl.style.height = '10px';
        handleEl.style.backgroundColor = '#007bff';
        handleEl.style.cursor = handle.cursor;
        
        // ハンドルの位置を設定
        switch (handle.class) {
            case 'nw':
                handleEl.style.top = '-5px';
                handleEl.style.left = '-5px';
                break;
            case 'ne':
                handleEl.style.top = '-5px';
                handleEl.style.right = '-5px';
                break;
            case 'sw':
                handleEl.style.bottom = '-5px';
                handleEl.style.left = '-5px';
                break;
            case 'se':
                handleEl.style.bottom = '-5px';
                handleEl.style.right = '-5px';
                break;
        }
        
        textbox.appendChild(handleEl);
        
        // リサイズイベント
        let isResizing = false;
        let startX, startY;
        let startWidth, startHeight;
        let startLeft, startTop;
        
        handleEl.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(textbox).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(textbox).height, 10);
            startLeft = parseInt(document.defaultView.getComputedStyle(textbox).left, 10);
            startTop = parseInt(document.defaultView.getComputedStyle(textbox).top, 10);
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            // 縦横比を維持するかどうか
            const keepRatio = e.shiftKey;
            const ratio = startWidth / startHeight;
            
            // 移動量を計算
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // 新しいサイズと位置を計算
            let newWidth, newHeight, newLeft, newTop;
            
            switch (handle.class) {
                case 'nw':
                    newWidth = startWidth - dx;
                    newHeight = startHeight - dy;
                    newLeft = startLeft + dx;
                    newTop = startTop + dy;
                    
                    if (keepRatio) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / ratio;
                            newTop = startTop + (startWidth - newWidth) / ratio;
                        } else {
                            newWidth = newHeight * ratio;
                            newLeft = startLeft + (startHeight - newHeight) * ratio;
                        }
                    }
                    break;
                case 'ne':
                    newWidth = startWidth + dx;
                    newHeight = startHeight - dy;
                    newLeft = startLeft;
                    newTop = startTop + dy;
                    
                    if (keepRatio) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / ratio;
                            newTop = startTop + (startWidth - newWidth) / ratio;
                        } else {
                            newWidth = newHeight * ratio;
                        }
                    }
                    break;
                case 'sw':
                    newWidth = startWidth - dx;
                    newHeight = startHeight + dy;
                    newLeft = startLeft + dx;
                    newTop = startTop;
                    
                    if (keepRatio) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / ratio;
                        } else {
                            newWidth = newHeight * ratio;
                            newLeft = startLeft + (startHeight - newHeight) * ratio;
                        }
                    }
                    break;
                case 'se':
                    newWidth = startWidth + dx;
                    newHeight = startHeight + dy;
                    newLeft = startLeft;
                    newTop = startTop;
                    
                    if (keepRatio) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / ratio;
                        } else {
                            newWidth = newHeight * ratio;
                        }
                    }
                    break;
            }
            
            // 最小サイズを制限
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // サイズと位置を更新
            textbox.style.width = `${newWidth}px`;
            textbox.style.height = `${newHeight}px`;
            textbox.style.left = `${newLeft}px`;
            textbox.style.top = `${newTop}px`;
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', function() {
            isResizing = false;
        });
    });
    
    // Deleteキーでテキストボックスを削除
    textbox.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' && !textbox.textContent.trim()) {
            textbox.remove();
            
            // 編集状態を更新
            window.scriptState.edited = true;
        }
    });
}

/**
 * カット割りを指定
 */
function insertCutMark() {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // カット割りのHTML
    const cutMarkHTML = `<br class="cut-wari">`;
    
    // 選択範囲にカット割りを挿入
    const fragment = range.extractContents();
    
    // テキストノードを処理
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    
    // HTML内容を取得し、カット割りを挿入
    const html = tempDiv.innerHTML;
    const newHTML = html + cutMarkHTML;
    
    // 新しいHTML内容を挿入
    range.insertNode(document.createTextNode(newHTML));
    
    // 表示設定を更新
    window.scriptState.viewSettings.cut = true;
    
    // メニュー表示を更新
    const viewToggle = document.querySelector('.view-toggle[data-view="cut"]');
    if (viewToggle) {
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
    }
    
    // カット割りを表示
    document.querySelectorAll('.cut-wari').forEach(el => {
        el.style.display = 'block';
    });
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 次のシーン番号を取得
 * @returns {string} シーン番号
 */
function getNextSceneNumber() {
    const scenes = document.querySelectorAll('.script-scene');
    
    if (scenes.length === 0) {
        return '001';
    }
    
    // 最後のシーンの番号を取得
    const lastScene = scenes[scenes.length - 1];
    const lastSceneNumber = lastScene.querySelector('.script-hashira-id')?.textContent.trim() || '';
    
    // 番号部分を抽出
    const match = lastSceneNumber.match(/\d+/);
    if (match) {
        const num = parseInt(match[0], 10);
        return (num + 1).toString().padStart(3, '0');
    }
    
    return '001';
}

/**
 * 登場人物リストを読み込む
 */
function loadCharacterList() {
    // APIでキャラクターリストを取得（必要に応じて実装）
}

/**
 * 表示設定を適用
 */
function applyViewSettings() {
    // 隠れ柱表示/非表示
    if (window.scriptState.viewSettings.hiddenHashira) {
        document.querySelectorAll('.scriptarea-hashira-hidden').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.scriptarea-hashira-hidden').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 隠れト書き表示/非表示
    if (window.scriptState.viewSettings.hiddenTogaki) {
        document.querySelectorAll('.scriptarea-togaki-hidden').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.scriptarea-togaki-hidden').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 隠れ登場人物表示/非表示
    if (window.scriptState.viewSettings.hiddenChar) {
        document.querySelectorAll('.scriptarea-serifu-hidden').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.scriptarea-serifu-hidden').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 編集記号表示/非表示
    if (window.scriptState.viewSettings.editMark) {
        document.querySelectorAll('.edit-mark').forEach(el => {
            el.style.display = 'inline';
        });
    } else {
        document.querySelectorAll('.edit-mark').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // ページ区切り表示/非表示
    if (window.scriptState.viewSettings.pageBreak) {
        document.querySelectorAll('.script-page-break').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.script-page-break').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 柱・ト書き・セリフの背景色表示/非表示
    if (window.scriptState.viewSettings.structure) {
        document.querySelector('.scriptarea-hashira')?.classList.add('show-structure');
        document.querySelectorAll('.scriptarea-togaki').forEach(el => {
            el.classList.add('show-structure');
        });
        document.querySelectorAll('.scriptarea-serifu').forEach(el => {
            el.classList.add('show-structure');
        });
    } else {
        document.querySelector('.scriptarea-hashira')?.classList.remove('show-structure');
        document.querySelectorAll('.scriptarea-togaki').forEach(el => {
            el.classList.remove('show-structure');
        });
        document.querySelectorAll('.scriptarea-serifu').forEach(el => {
            el.classList.remove('show-structure');
        });
    }
    
    // 香盤情報表示/非表示
    if (window.scriptState.viewSettings.kouban) {
        document.querySelectorAll('[data-kouban-type]').forEach(el => {
            const koubanType = el.getAttribute('data-kouban-type');
            el.classList.add(`kouban-${koubanType}`);
        });
    } else {
        document.querySelectorAll('[data-kouban-type]').forEach(el => {
            const koubanType = el.getAttribute('data-kouban-type');
            el.classList.remove(`kouban-${koubanType}`);
        });
    }
    
    // カット割表示/非表示
    if (window.scriptState.viewSettings.cut) {
        document.querySelectorAll('.cut-wari').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.cut-wari').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 行番号表示/非表示
    if (window.scriptState.viewSettings.lineNumber) {
        document.getElementById('scriptLineNumbersScene').style.display = 'block';
    } else {
        document.getElementById('scriptLineNumbersScene').style.display = 'none';
    }
    
    // しおり表示/非表示
    if (window.scriptState.viewSettings.bookmark) {
        document.querySelectorAll('.script-bookmark').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.script-bookmark').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // 表示モード（縦書き/横書き）
    if (window.scriptState.displayMode === 'vertical') {
        document.getElementById('scriptEditArea').classList.add('vertical-mode');
    } else {
        document.getElementById('scriptEditArea').classList.remove('vertical-mode');
    }
}

/**
 * 表示設定を切り替え
 * @param {string} viewType 表示タイプ
 * @param {boolean} visible 表示するかどうか
 */
function toggleViewSetting(viewType, visible) {
    // 特殊処理（縦書きモード）
    if (viewType === 'verticalMode') {
        window.scriptState.displayMode = visible ? 'vertical' : 'horizontal';
        applyViewSettings();
        return;
    }
    
    // 通常の表示設定
    if (window.scriptState.viewSettings.hasOwnProperty(viewType)) {
        window.scriptState.viewSettings[viewType] = visible;
        applyViewSettings();
    }
}

/**
 * ユーザー設定を読み込む
 */
function loadUserSettings() {
    // LocalStorageから設定を読み込む（必要に応じて実装）
}

/**
 * テキスト形式を適用
 * @param {string} format 形式
 */
function applyTextFormat(format) {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // 範囲を取得
    const range = selection.getRangeAt(0);
    
    // 形式に応じた処理
    switch (format) {
        case 'bold':
            document.execCommand('bold', false, null);
            break;
        case 'italic':
            document.execCommand('italic', false, null);
            break;
        case 'underline':
            document.execCommand('underline', false, null);
            break;
        case 'strikethrough':
            document.execCommand('strikeThrough', false, null);
            break;
        case 'subscript':
            document.execCommand('subscript', false, null);
            break;
        case 'superscript':
            document.execCommand('superscript', false, null);
            break;
        case 'box':
            // 囲みスタイル
            if (range.collapsed) return;
            
            const boxSpan = document.createElement('span');
            boxSpan.style.border = '1px solid black';
            boxSpan.style.padding = '0 2px';
            
            const fragment = range.extractContents();
            boxSpan.appendChild(fragment);
            range.insertNode(boxSpan);
            
            // カーソルを後ろに移動
            range.setStartAfter(boxSpan);
            range.setEndAfter(boxSpan);
            selection.removeAllRanges();
            selection.addRange(range);
            break;
        case 'color':
            // 色を選択
            const color = prompt('色を入力してください（例: red, #ff0000）', 'red');
            if (color) {
                document.execCommand('foreColor', false, color);
            }
            break;
        case 'highlight':
            // 蛍光色を選択
            const bgColor = prompt('背景色を入力してください（例: yellow, #ffff00）', 'yellow');
            if (bgColor) {
                document.execCommand('hiliteColor', false, bgColor);
            }
            break;
        case 'pattern':
            // 網掛けスタイル
            if (range.collapsed) return;
            
            const patternSpan = document.createElement('span');
            patternSpan.style.backgroundColor = '#f0f0f0';
            patternSpan.style.backgroundImage = 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)';
            patternSpan.style.backgroundSize = '4px 4px';
            
            const patternFragment = range.extractContents();
            patternSpan.appendChild(patternFragment);
            range.insertNode(patternSpan);
            
            // カーソルを後ろに移動
            range.setStartAfter(patternSpan);
            range.setEndAfter(patternSpan);
            selection.removeAllRanges();
            selection.addRange(range);
            break;
        case 'fontSmall':
            // 小さい文字
            if (range.collapsed) return;
            
            const smallSpan = document.createElement('span');
            smallSpan.style.fontSize = '0.8em';
            
            const smallFragment = range.extractContents();
            smallSpan.appendChild(smallFragment);
            range.insertNode(smallSpan);
            
            // カーソルを後ろに移動
            range.setStartAfter(smallSpan);
            range.setEndAfter(smallSpan);
            selection.removeAllRanges();
            selection.addRange(range);
            break;
        case 'fontMedium':
            // 中くらいの文字
            if (range.collapsed) return;
            
            const mediumSpan = document.createElement('span');
            mediumSpan.style.fontSize = '1.2em';
            
            const mediumFragment = range.extractContents();
            mediumSpan.appendChild(mediumFragment);
            range.insertNode(mediumSpan);
            
            // カーソルを後ろに移動
            range.setStartAfter(mediumSpan);
            range.setEndAfter(mediumSpan);
            selection.removeAllRanges();
            selection.addRange(range);
            break;
        case 'fontLarge':
            // 大きい文字
            if (range.collapsed) return;
            
            const largeSpan = document.createElement('span');
            largeSpan.style.fontSize = '1.5em';
            
            const largeFragment = range.extractContents();
            largeSpan.appendChild(largeFragment);
            range.insertNode(largeSpan);
            
            // カーソルを後ろに移動
            range.setStartAfter(largeSpan);
            range.setEndAfter(largeSpan);
            selection.removeAllRanges();
            selection.addRange(range);
            break;
        case 'alignLeft':
            document.execCommand('justifyLeft', false, null);
            break;
        case 'alignCenter':
            document.execCommand('justifyCenter', false, null);
            break;
        case 'alignRight':
            document.execCommand('justifyRight', false, null);
            break;
        case 'alignJustify':
            document.execCommand('justifyFull', false, null);
            break;
        case 'bulletList':
            document.execCommand('insertUnorderedList', false, null);
            break;
        case 'numberList':
            document.execCommand('insertOrderedList', false, null);
            break;
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * ルビを挿入
 */
function insertRuby() {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        alert('ルビを付けるテキストを選択してください');
        return;
    }
    
    // 選択テキストを取得
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // ルビテキストを入力
    const rubyText = prompt('ルビを入力してください', '');
    if (rubyText === null) return;
    
    // ルビ要素を作成
    const ruby = document.createElement('ruby');
    ruby.textContent = selectedText;
    
    const rt = document.createElement('rt');
    rt.textContent = rubyText;
    ruby.appendChild(rt);
    
    // 選択範囲を置き換え
    range.deleteContents();
    range.insertNode(ruby);
    
    // カーソルをルビの後ろに移動
    range.setStartAfter(ruby);
    range.setEndAfter(ruby);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 特殊文字を挿入
 * @param {string} char 特殊文字
 */
function insertSpecialChar(char) {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // 特殊文字を挿入
    document.execCommand('insertText', false, char);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * セリフを連結
 */
function joinSerifu() {
    alert('この機能は現在実装中です');
}

/**
 * 選択テキストをコピー
 */
function copySelection() {
    document.execCommand('copy');
}

/**
 * クリップボードの内容を貼り付け
 */
function pasteContent() {
    document.execCommand('paste');
}

/**
 * 操作を元に戻す
 */
function undoAction() {
    document.execCommand('undo');
}

/**
 * 操作をやり直す
 */
function redoAction() {
    document.execCommand('redo');
}

/**
 * スペルチェックと文章校正
 */
function checkSpelling() {
    alert('この機能は現在実装中です');
}

/**
 * 文字数をカウント
 */
function countCharacters() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // テキスト全体を取得
    const text = editArea.textContent || '';
    
    // 文字数（空白含む）
    const charCount = text.length;
    
    // 文字数（空白除く）
    const charCountNoSpace = text.replace(/\s+/g, '').length;
    
    // 段落数（ト書き、セリフなど）
    const paragraphCount = document.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden').length;
    
    // シーン数
    const sceneCount = document.querySelectorAll('.script-scene').length;
    
    // カット数
    const cutCount = document.querySelectorAll('.cut-wari').length;
    
    // 結果を表示
    alert(`
文字数（空白含む）: ${charCount}
文字数（空白除く）: ${charCountNoSpace}
段落数: ${paragraphCount}
シーン数: ${sceneCount}
カット数: ${cutCount}
    `);
}

/**
 * 禁止用語・注意用語チェック
 */
function checkProhibitedWords() {
    alert('この機能は現在実装中です');
}

/**
 * 台本内容をテキスト形式に変換
 */
function getPlainText() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return '';
    
    let plainText = '';
    
    // シーンごとに処理
    const scenes = editArea.querySelectorAll('.script-scene');
    scenes.forEach(scene => {
        // 柱情報
        const hashiraId = scene.querySelector('.script-hashira-id')?.textContent.trim() || '';
        const location = scene.querySelector('.script-hashira-location')?.textContent.trim() || '';
        const time = scene.querySelector('.script-hashira-time')?.textContent.trim() || '';
        
        plainText += `${hashiraId} ${location} ${time}\n\n`;
        
        // シーン内容
        const contentElements = scene.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        contentElements.forEach(element => {
            if (element.classList.contains('scriptarea-togaki')) {
                // ト書き（タブ2つ）
                plainText += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('scriptarea-serifu')) {
                // セリフ（タブ1つ）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                plainText += `\t${name}　${content}\n`;
            } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                // 隠れト書き（タブ2つ＋括弧）
                plainText += `\t\t(${element.textContent.trim()})\n`;
            } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                // 隠れセリフ（タブ1つ＋括弧）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                plainText += `\t(${name}　${content})\n`;
            } else if (element.classList.contains('time-progress')) {
                // 時間経過
                plainText += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('script-page-break')) {
                // ページ区切り
                plainText += `\t\t==========\n`;
            }
        });
        
        // シーン区切り
        plainText += '\n\n';
    });
    
    return plainText;
}
/* 台本要素操作 ↑ */

/* 香盤情報連携 ↓ */
/**
 * 香盤情報を登録
 * @param {string} koubanType 香盤タイプ
 */
function registerKoubanInfo(koubanType) {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        alert('香盤情報を登録するテキストを選択してください');
        return;
    }
    
    // 選択テキストを取得
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) {
        alert('香盤情報を登録するテキストを選択してください');
        return;
    }
    
    // 香盤タイプがallの場合は選択ダイアログを表示
    if (koubanType === 'all') {
        // 香盤情報モーダルを表示
        const modal = document.getElementById('kouban-select-modal');
        if (modal) {
            modal.style.display = 'block';
        }
        return;
    }
    
    // 香盤情報登録ダイアログを表示
    const koubanName = prompt('香盤登録名称を入力してください（例: 白雪姫のりんご）', selectedText);
    if (!koubanName) return;
    
    // 英数字での香盤登録名称を入力
    const koubanNameEn = prompt('香盤登録名称（半角英数字）を入力してください（例: apple-of-princess）', getEnglishName(koubanName));
    if (!koubanNameEn) return;
    
    // 香盤情報を適用
    const currentSceneElement = findCurrentScene(range.startContainer);
    if (!currentSceneElement) {
        alert('シーン情報が取得できませんでした');
        return;
    }
    
    // シーン番号を取得
    const sceneId = currentSceneElement.querySelector('.script-hashira-id')?.textContent.trim() || '';
    
    // 選択範囲にスパンを追加して香盤情報を付与
    const span = document.createElement('span');
    span.className = `kouban-${koubanType}`;
    span.setAttribute('data-kouban-type', koubanType);
    span.setAttribute('data-kouban-name', koubanName);
    span.setAttribute('data-kouban-name-en', koubanNameEn);
    span.setAttribute('data-scene-id', sceneId);
    
    // 範囲内容を取得
    const fragment = range.extractContents();
    span.appendChild(fragment);
    
    // スパンを挿入
    range.insertNode(span);
    
    // 香盤情報が表示されるようにする
    window.scriptState.viewSettings.kouban = true;
    
    // メニュー表示を更新
    const viewToggle = document.querySelector('.view-toggle[data-view="kouban"]');
    if (viewToggle) {
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
    }
    
    // 表示設定を適用
    applyViewSettings();
    
    // 編集状態を更新
    window.scriptState.edited = true;
    
    // 成功メッセージ
    alert(`「${koubanName}」を${getKoubanTypeName(koubanType)}として登録しました`);
}

/**
 * 香盤タイプ名を取得
 * @param {string} koubanType 香盤タイプ
 * @returns {string} 香盤タイプ名
 */
function getKoubanTypeName(koubanType) {
    const typeNames = {
        'character': '登場人物',
        'prop': '小道具',
        'device': '大道具・装置・劇中車両等',
        'costume': '衣裳',
        'makeup': 'メイク',
        'effect': '効果',
        'place1': '場所１',
        'place2': '場所２',
        'place3': '場所３',
        'time': '時間帯',
        'other': 'その他'
    };
    
    return typeNames[koubanType] || koubanType;
}

/**
 * 日本語名から英語名を生成
 * @param {string} japaneseName 日本語名
 * @returns {string} 英語名
 */
function getEnglishName(japaneseName) {
    // 日本語を英語に変換するロジック（簡易版）
    // 空白を削除
    const nameTrimmed = japaneseName.replace(/\s+/g, '');
    
    // ランダムなIDを生成
    const randomId = Math.random().toString(36).substring(2, 10);
    
    // 簡易的な変換（本番ではより高度な変換が必要かもしれません）
    return `item-${randomId}`;
}

/**
 * 香盤情報を適用
 * @param {string} koubanType 香盤タイプ
 * @param {string} description 詳細情報
 */
function applyKoubanInfo(koubanType, description) {
    // 選択範囲を取得
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        alert('香盤情報を適用するテキストを選択してください');
        return;
    }
    
    // 選択テキストを取得
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) {
        alert('香盤情報を適用するテキストを選択してください');
        return;
    }
    
    // 香盤登録名称を入力
    const koubanName = prompt('香盤登録名称を入力してください（例: 白雪姫のりんご）', selectedText);
    if (!koubanName) return;
    
    // 英数字での香盤登録名称を入力
    const koubanNameEn = prompt('香盤登録名称（半角英数字）を入力してください（例: apple-of-princess）', getEnglishName(koubanName));
    if (!koubanNameEn) return;
    
    // 香盤情報を適用
    const currentSceneElement = findCurrentScene(range.startContainer);
    if (!currentSceneElement) {
        alert('シーン情報が取得できませんでした');
        return;
    }
    
    // シーン番号を取得
    const sceneId = currentSceneElement.querySelector('.script-hashira-id')?.textContent.trim() || '';
    
    // 選択範囲にスパンを追加して香盤情報を付与
    const span = document.createElement('span');
    span.className = `kouban-${koubanType}`;
    span.setAttribute('data-kouban-type', koubanType);
    span.setAttribute('data-kouban-name', koubanName);
    span.setAttribute('data-kouban-name-en', koubanNameEn);
    span.setAttribute('data-scene-id', sceneId);
    if (description) {
        span.setAttribute('data-kouban-desc', description);
    }
    
    // 範囲内容を取得
    const fragment = range.extractContents();
    span.appendChild(fragment);
    
    // スパンを挿入
    range.insertNode(span);
    
    // 香盤情報が表示されるようにする
    window.scriptState.viewSettings.kouban = true;
    
    // メニュー表示を更新
    const viewToggle = document.querySelector('.view-toggle[data-view="kouban"]');
    if (viewToggle) {
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
    }
    
    // 表示設定を適用
    applyViewSettings();
    
    // 編集状態を更新
    window.scriptState.edited = true;
    
    // 成功メッセージ
    alert(`「${koubanName}」を${getKoubanTypeName(koubanType)}として登録しました`);
}

/**
 * 現在のシーン要素を検索
 * @param {Node} node 検索開始ノード
 * @returns {Element} シーン要素
 */
function findCurrentScene(node) {
    // テキストノードの場合は親要素を取得
    let element = node.nodeType === 3 ? node.parentElement : node;
    
    // シーン要素を検索
    while (element && !element.classList.contains('script-scene')) {
        element = element.parentElement;
    }
    
    return element;
}
/* 香盤情報連携 ↑ */

/* 図形描画 ↓ */
/**
 * 図形を描画
 * @param {string} shapeType 図形タイプ
 */
function drawShape(shapeType) {
    // 図形タイプごとの初期サイズを設定
    const shapeSizes = {
        'rect': { width: 100, height: 80 },
        'circle': { width: 80, height: 80 },
        'ellipse': { width: 120, height: 80 },
        'triangle': { width: 100, height: 80 },
        'line': { width: 100, height: 2 },
        'arrow': { width: 100, height: 20 },
        'bubble': { width: 150, height: 100 }
    };
    
    // 図形のHTML
    const size = shapeSizes[shapeType] || { width: 100, height: 100 };
    
    // 図形のスタイル
    let shapeStyle;
    
    switch (shapeType) {
        case 'rect':
            shapeStyle = `
                width: ${size.width}px;
                height: ${size.height}px;
                border: 2px solid black;
                background-color: white;
            `;
            break;
        case 'circle':
            shapeStyle = `
                width: ${size.width}px;
                height: ${size.height}px;
                border: 2px solid black;
                border-radius: 50%;
                background-color: white;
            `;
            break;
        case 'ellipse':
            shapeStyle = `
                width: ${size.width}px;
                height: ${size.height}px;
                border: 2px solid black;
                border-radius: 50%;
                background-color: white;
            `;
            break;
        case 'triangle':
            shapeStyle = `
                width: 0;
                height: 0;
                border-left: ${size.width / 2}px solid transparent;
                border-right: ${size.width / 2}px solid transparent;
                border-bottom: ${size.height}px solid black;
                background-color: transparent;
            `;
            break;
        case 'line':
            shapeStyle = `
                width: ${size.width}px;
                height: ${size.height}px;
                background-color: black;
            `;
            break;
        case 'arrow':
            // 矢印は複雑なので別途処理
            drawArrow();
            return;
        case 'bubble':
            // 吹き出しも複雑なので別途処理
            drawBubble();
            return;
        default:
            shapeStyle = `
                width: ${size.width}px;
                height: ${size.height}px;
                border: 2px solid black;
                background-color: white;
            `;
    }
    
    // 図形要素を作成
    const shapeDiv = document.createElement('div');
    shapeDiv.className = `script-shape script-shape-${shapeType}`;
    shapeDiv.style.cssText = `
        position: absolute;
        left: 100px;
        top: 100px;
        ${shapeStyle}
        z-index: 90;
    `;
    
    // 図形データを保存
    const shapeData = {
        type: shapeType,
        left: 100,
        top: 100,
        width: size.width,
        height: size.height,
        style: shapeStyle
    };
    
    // 図形リストに追加
    window.scriptState.shapes.push(shapeData);
    
    // 編集エリアに図形を追加
    const editArea = document.getElementById('scriptEditArea');
    editArea.appendChild(shapeDiv);
    
    // 図形をドラッグ可能にする
    makeShapeDraggable(shapeDiv);
    
    // 図形をリサイズ可能にする
    makeShapeResizable(shapeDiv);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 矢印を描画
 */
function drawArrow() {
    // SVG要素を作成
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 100 20");
    
    // 線を描画
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "10");
    line.setAttribute("x2", "90");
    line.setAttribute("y2", "10");
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    
    // 矢印の頭を描画
    const arrow = document.createElementNS(svgNS, "polygon");
    arrow.setAttribute("points", "90,5 90,15 100,10");
    arrow.setAttribute("fill", "black");
    
    // SVGに要素を追加
    svg.appendChild(line);
    svg.appendChild(arrow);
    
    // コンテナを作成
    const container = document.createElement("div");
    container.className = "script-shape script-shape-arrow";
    container.style.cssText = `
        position: absolute;
        left: 100px;
        top: 100px;
        width: 100px;
        height: 20px;
        z-index: 90;
    `;
    
    // SVGをコンテナに追加
    container.appendChild(svg);
    
    // 編集エリアに図形を追加
    const editArea = document.getElementById('scriptEditArea');
    editArea.appendChild(container);
    
    // 図形をドラッグ可能にする
    makeShapeDraggable(container);
    
    // 図形をリサイズ可能にする
    makeShapeResizable(container, true); // 矢印の場合は水平方向のみリサイズ
    
    // 図形データを保存
    const shapeData = {
        type: 'arrow',
        left: 100,
        top: 100,
        width: 100,
        height: 20
    };
    
    // 図形リストに追加
    window.scriptState.shapes.push(shapeData);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 吹き出しを描画
 */
function drawBubble() {
    // SVG要素を作成
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "150");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", "0 0 150 100");
    
    // 吹き出しの本体を描画
    const bubble = document.createElementNS(svgNS, "rect");
    bubble.setAttribute("x", "0");
    bubble.setAttribute("y", "0");
    bubble.setAttribute("width", "130");
    bubble.setAttribute("height", "80");
    bubble.setAttribute("rx", "15");
    bubble.setAttribute("ry", "15");
    bubble.setAttribute("fill", "white");
    bubble.setAttribute("stroke", "black");
    bubble.setAttribute("stroke-width", "2");
    
    // 吹き出しの尻尾を描画
    const tail = document.createElementNS(svgNS, "path");
    tail.setAttribute("d", "M130,40 L150,60 L130,60 Z");
    tail.setAttribute("fill", "white");
    tail.setAttribute("stroke", "black");
    tail.setAttribute("stroke-width", "2");
    
    // テキスト要素を追加
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "65");
    text.setAttribute("y", "45");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "sans-serif");
    text.setAttribute("font-size", "14");
    text.textContent = "テキスト";
    
    // SVGに要素を追加
    svg.appendChild(bubble);
    svg.appendChild(tail);
    svg.appendChild(text);
    
    // コンテナを作成
    const container = document.createElement("div");
    container.className = "script-shape script-shape-bubble";
    container.style.cssText = `
        position: absolute;
        left: 100px;
        top: 100px;
        width: 150px;
        height: 100px;
        z-index: 90;
    `;
    
    // SVGをコンテナに追加
    container.appendChild(svg);
    
    // 編集エリアに図形を追加
    const editArea = document.getElementById('scriptEditArea');
    editArea.appendChild(container);
    
    // 図形をドラッグ可能にする
    makeShapeDraggable(container);
    
    // 図形をリサイズ可能にする
    makeShapeResizable(container);
    
    // 図形データを保存
    const shapeData = {
        type: 'bubble',
        left: 100,
        top: 100,
        width: 150,
        height: 100
    };
    
    // 図形リストに追加
    window.scriptState.shapes.push(shapeData);
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 図形をドラッグ可能にする
 * @param {HTMLElement} shape 図形要素
 */
function makeShapeDraggable(shape) {
    let isDragging = false;
    let offsetX, offsetY;
    
    // マウスダウンイベント
    shape.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - shape.getBoundingClientRect().left;
        offsetY = e.clientY - shape.getBoundingClientRect().top;
        
        // 最前面に表示
        shape.style.zIndex = 100;
        
        // 他の図形のzインデックスを下げる
        document.querySelectorAll('.script-shape').forEach(s => {
            if (s !== shape) {
                s.style.zIndex = 90;
            }
        });
        
        e.preventDefault();
    });
    
    // マウスムーブイベント
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const editArea = document.getElementById('scriptEditArea');
            const editAreaRect = editArea.getBoundingClientRect();
            
            // 編集エリア内での位置を計算
            const left = e.clientX - offsetX - editAreaRect.left;
            const top = e.clientY - offsetY - editAreaRect.top;
            
            // 位置を更新
            shape.style.left = `${left}px`;
            shape.style.top = `${top}px`;
            
            e.preventDefault();
        }
    });
    
    // マウスアップイベント
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Deleteキーで図形を削除
    shape.addEventListener('keydown', function(e) {
        if (e.key === 'Delete') {
            shape.remove();
        }
    });
}  // <- makeShapeDraggable関数の閉じ括弧

/**
 * script.js - 台本・登場人物機能のためのJavaScriptファイル
 * dakos.jp 映像制作支援サイト
 * ファイルパス: /js/script.js
 */

/* 初期設定 ↓ */
document.addEventListener('DOMContentLoaded', function() {
    // グローバル変数の初期化
    initializeGlobalVariables();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 台本エディタの初期設定（エディタページの場合のみ）
    if (document.getElementById('scriptEditArea')) {
        initializeScriptEditor();
    }
    
    // 登場人物テーブルの初期設定（登場人物ページの場合のみ）
    if (document.getElementById('characters-table')) {
        initializeCharacterTable();
    }
});

/**
 * グローバル変数の初期化
 */
function initializeGlobalVariables() {
    // 台本の状態を保持するグローバル変数
    window.scriptState = {
        edited: false,                    // 編集されたかどうか
        currentScene: 0,                  // 現在選択中のシーン番号
        sceneCount: 0,                    // シーン数
        displayMode: 'horizontal',        // 表示モード（horizontal/vertical）
        viewSettings: {                   // 表示設定
            hiddenHashira: false,         // 隠れ柱表示
            hiddenTogaki: false,          // 隠れト書き表示
            hiddenChar: false,            // 隠れ登場人物表示
            editMark: false,              // 編集記号表示
            pageBreak: false,             // ページ区切り表示
            structure: false,             // 柱・ト書き・セリフ表示
            kouban: false,                // 香盤情報表示
            cut: false,                   // カット割表示
            lineNumber: false,            // 行番号表示
            bookmark: false               // しおり表示
        },
        selection: {                      // 選択中のテキスト情報
            text: '',                     // 選択テキスト
            range: null,                  // 選択範囲
            element: null                 // 選択要素
        },
        lineNumbers: [],                  // 行番号情報
        sceneLineNumbers: {},             // シーンごとの行番号
        characters: [],                   // 登場人物リスト（最近使用順）
        shapes: [],                       // 図形描画データ
        bookmarks: [],                    // しおり情報
        undoStack: [],                    // 元に戻す用スタック
        redoStack: [],                    // やり直し用スタック
        isSaving: false,                  // 保存中かどうか
        lastSaved: new Date(),            // 最終保存日時
        maxUndoSteps: 50                  // 最大Undo回数
    };
    
    // フォーム関連のグローバル変数
    window.formState = {
        scriptId: document.querySelector('input[name="script_id"]') ? 
                 document.querySelector('input[name="script_id"]').value : '',
        workId: document.querySelector('input[name="work_id"]') ? 
               document.querySelector('input[name="work_id"]').value : '',
        editMode: document.querySelector('input[name="edit_mode"]') ? 
                 document.querySelector('input[name="edit_mode"]').value === '1' : false,
        csrfToken: document.querySelector('input[name="csrf_token"]') ? 
                  document.querySelector('input[name="csrf_token"]').value : ''
    };
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 台本編集画面のイベントリスナー
    if (document.getElementById('scriptEditArea')) {
        setupScriptEditorListeners();
    }
    
    // 台本閲覧画面のイベントリスナー
    if (document.getElementById('scriptViewArea')) {
        setupScriptViewerListeners();
    }
    
    // 登場人物テーブルのイベントリスナー
    if (document.getElementById('characters-table')) {
        setupCharacterTableListeners();
    }
    
    // 画面離脱時の警告
    window.addEventListener('beforeunload', function(e) {
        if (window.scriptState && window.scriptState.edited) {
            const message = '変更が保存されていません。本当にページを離れますか？';
            e.returnValue = message;
            return message;
        }
    });
}
/* 初期設定 ↑ */

/* 台本エディタ初期化 ↓ */
/**
 * 台本エディタの初期化
 */
function initializeScriptEditor() {
    console.log('台本エディタを初期化しています...');
    
    // エディタ要素の取得
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 初期シーン数をカウントし設定
    const scenes = editArea.querySelectorAll('.script-scene');
    window.scriptState.sceneCount = scenes.length;
    
    // シーン一覧を更新
    updateSceneList();
    
    // 行番号を生成
    generateLineNumbers();
    
    // 編集状態の監視を開始
    startEditWatcher();
    
    // 登場人物リストを読み込み
    loadCharacterList();
    
    // 表示設定の初期値を適用
    applyViewSettings();
    
    // ユーザー設定を読み込み
    loadUserSettings();
    
    // 自動保存の設定（5分ごと）
    setInterval(function() {
        if (window.scriptState.edited && !window.scriptState.isSaving) {
            autoSave();
        }
    }, 5 * 60 * 1000); // 5分
    
    console.log('台本エディタの初期化が完了しました');
}

/**
 * 台本エディタのイベントリスナー設定
 */
function setupScriptEditorListeners() {
    // メニューバーのイベントリスナー
    setupMenuListeners();
    
    // ツールバーのイベントリスナー
    setupToolbarListeners();
    
    // エディタ本体のイベントリスナー
    setupEditorListeners();
    
    // サイドバーのイベントリスナー
    setupSidebarListeners();
    
    // モーダルダイアログのイベントリスナー
    setupModalListeners();
    
    // キーボードショートカットの設定
    setupKeyboardShortcuts();
}

/**
 * メニューバーのイベントリスナー設定
 */
function setupMenuListeners() {
    // ファイルメニュー
    document.getElementById('menuNewFile')?.addEventListener('click', createNewScript);
    document.getElementById('menuOpenVersion')?.addEventListener('click', openVersionModal);
    document.getElementById('menuDeleteVersion')?.addEventListener('click', deleteVersion);
    document.getElementById('menuDeleteAll')?.addEventListener('click', deleteAllVersions);
    document.getElementById('menuExitEdit')?.addEventListener('click', exitEditMode);
    
    // 保存メニュー
    document.getElementById('menuSaveOverwrite')?.addEventListener('click', saveOverwrite);
    document.getElementById('menuSaveVersion')?.addEventListener('click', saveNewVersion);
    document.getElementById('menuSetFinal')?.addEventListener('click', setFinalVersion);
    document.getElementById('menuSyncKouban')?.addEventListener('click', syncKoubanInfo);
    document.getElementById('menuSaveText')?.addEventListener('click', saveAsText);
    document.getElementById('menuSavePDF')?.addEventListener('click', saveAsPDF);
    
    // 挿入メニュー
    document.getElementById('menuInsertHashira')?.addEventListener('click', insertHashira);
    document.getElementById('menuInsertHiddenHashira')?.addEventListener('click', insertHiddenHashira);
    document.getElementById('menuInsertTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('menuInsertHiddenTogaki')?.addEventListener('click', insertHiddenTogaki);
    document.getElementById('menuInsertHiddenChar')?.addEventListener('click', insertHiddenChar);
    document.getElementById('menuInsertSerifu')?.addEventListener('click', insertSerifu);
    
    // 特殊記号のサブメニュー項目のイベントリスナー
    document.querySelectorAll('#menuInsertSpecialMark .script-submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            if (action === 'insertTimeProgress') {
                insertTimeProgress();
            }
        });
    });
    
    // 編集記号のサブメニュー項目のイベントリスナー
    document.querySelectorAll('#menuInsertEditMark .script-submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            const mark = this.getAttribute('data-mark');
            insertEditMark(mark);
        });
    });
    
    document.getElementById('menuInsertImage')?.addEventListener('click', insertImage);
    document.getElementById('menuInsertPageBreak')?.addEventListener('click', insertPageBreak);
    document.getElementById('menuInsertLink')?.addEventListener('click', insertLink);
    document.getElementById('menuInsertTextboxV')?.addEventListener('click', insertTextboxVertical);
    document.getElementById('menuInsertTextboxH')?.addEventListener('click', insertTextboxHorizontal);
    document.getElementById('menuInsertCut')?.addEventListener('click', insertCutMark);
    
    // 香盤情報メニュー
    document.getElementById('menuKoubanAll')?.addEventListener('click', () => registerKoubanInfo('all'));
    document.getElementById('menuKoubanChar')?.addEventListener('click', () => registerKoubanInfo('character'));
    document.getElementById('menuKoubanProp')?.addEventListener('click', () => registerKoubanInfo('prop'));
    document.getElementById('menuKoubanDevice')?.addEventListener('click', () => registerKoubanInfo('device'));
    document.getElementById('menuKoubanCostume')?.addEventListener('click', () => registerKoubanInfo('costume'));
    document.getElementById('menuKoubanMakeup')?.addEventListener('click', () => registerKoubanInfo('makeup'));
    document.getElementById('menuKoubanEffect')?.addEventListener('click', () => registerKoubanInfo('effect'));
    document.getElementById('menuKoubanPlace1')?.addEventListener('click', () => registerKoubanInfo('place1'));
    document.getElementById('menuKoubanPlace2')?.addEventListener('click', () => registerKoubanInfo('place2'));
    document.getElementById('menuKoubanPlace3')?.addEventListener('click', () => registerKoubanInfo('place3'));
    document.getElementById('menuKoubanTime')?.addEventListener('click', () => registerKoubanInfo('time'));
    document.getElementById('menuKoubanOther')?.addEventListener('click', () => registerKoubanInfo('other'));
    
    // 描画メニュー
    document.getElementById('menuDrawRect')?.addEventListener('click', () => drawShape('rect'));
    document.getElementById('menuDrawCircle')?.addEventListener('click', () => drawShape('circle'));
    document.getElementById('menuDrawEllipse')?.addEventListener('click', () => drawShape('ellipse'));
    document.getElementById('menuDrawTriangle')?.addEventListener('click', () => drawShape('triangle'));
    document.getElementById('menuDrawLine')?.addEventListener('click', () => drawShape('line'));
    document.getElementById('menuDrawArrow')?.addEventListener('click', () => drawShape('arrow'));
    document.getElementById('menuDrawBubble')?.addEventListener('click', () => drawShape('bubble'));
    
    // 表示メニュー
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            const currentState = this.getAttribute('data-state');
            const newState = currentState === 'hidden' ? 'visible' : 'hidden';
            
            // 表示状態を更新
            this.setAttribute('data-state', newState);
            
            // メニュー表示を更新
            if (newState === 'visible') {
                this.textContent = this.textContent.replace('表示', '非表示');
            } else {
                this.textContent = this.textContent.replace('非表示', '表示');
            }
            
            // 表示設定を適用
            toggleViewSetting(viewType, newState === 'visible');
        });
    });
    
    // 校閲メニュー
    document.getElementById('menuCheckSpelling')?.addEventListener('click', checkSpelling);
    document.getElementById('menuCountChars')?.addEventListener('click', countCharacters);
    document.getElementById('menuCheckProhibited')?.addEventListener('click', checkProhibitedWords);
}

/**
 * ツールバーのイベントリスナー設定
 */
function setupToolbarListeners() {
    // 保存ボタン
    document.getElementById('toolbarSaveBtn')?.addEventListener('click', saveOverwrite);
    
    // 要素挿入ボタン
    document.getElementById('toolHashira')?.addEventListener('click', insertHashira);
    document.getElementById('toolTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('toolSerifu')?.addEventListener('click', insertSerifu);
    
    // 元に戻す/やり直しボタン
    document.getElementById('toolUndo')?.addEventListener('click', undoAction);
    document.getElementById('toolRedo')?.addEventListener('click', redoAction);
    
    // コピー/ペーストボタン
    document.getElementById('toolCopy')?.addEventListener('click', copySelection);
    document.getElementById('toolPaste')?.addEventListener('click', pasteContent);
    
    // テキスト装飾ボタン
    document.getElementById('toolBold')?.addEventListener('click', () => applyTextFormat('bold'));
    document.getElementById('toolItalic')?.addEventListener('click', () => applyTextFormat('italic'));
    document.getElementById('toolUnderline')?.addEventListener('click', () => applyTextFormat('underline'));
    document.getElementById('toolStrike')?.addEventListener('click', () => applyTextFormat('strikethrough'));
    
    document.getElementById('toolSubscript')?.addEventListener('click', () => applyTextFormat('subscript'));
    document.getElementById('toolSuperscript')?.addEventListener('click', () => applyTextFormat('superscript'));
    document.getElementById('toolBox')?.addEventListener('click', () => applyTextFormat('box'));
    document.getElementById('toolColor')?.addEventListener('click', () => applyTextFormat('color'));
    document.getElementById('toolHighlight')?.addEventListener('click', () => applyTextFormat('highlight'));
    document.getElementById('toolPattern')?.addEventListener('click', () => applyTextFormat('pattern'));
    
    // ルビ/リンクボタン
    document.getElementById('toolRuby')?.addEventListener('click', insertRuby);
    document.getElementById('toolLink')?.addEventListener('click', insertLink);
    
    // 文字サイズボタン
    document.getElementById('toolFontSmall')?.addEventListener('click', () => applyTextFormat('fontSmall'));
    document.getElementById('toolFontMedium')?.addEventListener('click', () => applyTextFormat('fontMedium'));
    document.getElementById('toolFontLarge')?.addEventListener('click', () => applyTextFormat('fontLarge'));
    
    // テキスト配置ボタン
    document.getElementById('toolAlignLeft')?.addEventListener('click', () => applyTextFormat('alignLeft'));
    document.getElementById('toolAlignCenter')?.addEventListener('click', () => applyTextFormat('alignCenter'));
    document.getElementById('toolAlignRight')?.addEventListener('click', () => applyTextFormat('alignRight'));
    document.getElementById('toolAlignJustify')?.addEventListener('click', () => applyTextFormat('alignJustify'));
    
    // 特殊文字ボタン
    document.getElementById('toolEllipsis')?.addEventListener('click', () => insertSpecialChar('…'));
    document.getElementById('toolDash')?.addEventListener('click', () => insertSpecialChar('―'));
    
    // リスト/数字リストボタン
    document.getElementById('toolBulletList')?.addEventListener('click', () => applyTextFormat('bulletList'));
    document.getElementById('toolNumberList')?.addEventListener('click', () => applyTextFormat('numberList'));
    
    // セリフ連結ボタン
    document.getElementById('toolJoinSerifu')?.addEventListener('click', joinSerifu);
    
    // 画像挿入ボタン
    document.getElementById('toolImage')?.addEventListener('click', insertImage);
}

/**
 * エディタ本体のイベントリスナー設定
 */
function setupEditorListeners() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 編集エリアの変更イベント
    editArea.addEventListener('input', function() {
        window.scriptState.edited = true;
        generateLineNumbers();
    });
    
    // クリックイベント（要素選択など）
    editArea.addEventListener('click', function(e) {
        // 選択中の行ハイライト
        highlightCurrentLine(e.target);
        
        // 編集箇所までスクロール
        syncLineNumbersScroll();
    });
    
    // キーダウンイベント（特殊キー処理）
    editArea.addEventListener('keydown', function(e) {
        handleEditorKeydown(e);
    });
    
    // セレクションイベント（選択テキスト管理）
    editArea.addEventListener('mouseup', updateSelectionInfo);
    editArea.addEventListener('keyup', updateSelectionInfo);
    
    // コンテキストメニュー（右クリックメニュー）
    editArea.addEventListener('contextmenu', showContextMenu);
    
    // ドラッグアンドドロップイベント（画像や図形）
    editArea.addEventListener('dragover', handleDragOver);
    editArea.addEventListener('drop', handleDrop);
    
    // フォーカスイベント（行ハイライト）
    editArea.addEventListener('focus', function() {
        // フォーカス時の処理
    });
    
    // ブラー（フォーカス喪失）イベント
    editArea.addEventListener('blur', function() {
        // フォーカス喪失時の処理
    });
    
    // スクロールイベント（行番号同期）
    editArea.addEventListener('scroll', function() {
        syncLineNumbersScroll();
    });
}

/**
 * サイドバーのイベントリスナー設定
 */
function setupSidebarListeners() {
    // シーン一覧のクリックイベント
    document.querySelectorAll('.script-sidebar-scene').forEach(sceneItem => {
        sceneItem.addEventListener('click', function() {
            const sceneIndex = this.getAttribute('data-scene');
            jumpToScene(parseInt(sceneIndex));
        });
    });
}

/**
 * モーダルダイアログのイベントリスナー設定
 */
function setupModalListeners() {
    // 閉じるボタン
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // 登場人物選択モーダル
    setupCharacterSelectionModal();
    
    // 香盤情報モーダル
    setupKoubanModal();
    
    // バージョン選択モーダル
    setupVersionModal();
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // 修飾キーの判定（MacとWindowsで異なる）
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        
        // ショートカットキーの処理
        if (ctrlKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    if (e.shiftKey) {
                        // Ctrl+Shift+S: バージョン保存
                        e.preventDefault();
                        saveNewVersion();
                    } else {
                        // Ctrl+S: 上書き保存
                        e.preventDefault();
                        saveOverwrite();
                    }
                    break;
                case 'n':
                    if (e.shiftKey) {
                        // Ctrl+Shift+N: バージョンを開く
                        e.preventDefault();
                        openVersionModal();
                    } else {
                        // Ctrl+N: 新規作成
                        e.preventDefault();
                        createNewScript();
                    }
                    break;
                case 'h':
                    if (e.shiftKey) {
                        // Ctrl+Shift+H: 隠れ柱挿入
                        e.preventDefault();
                        insertHiddenHashira();
                    } else {
                        // Ctrl+H: 柱挿入
                        e.preventDefault();
                        insertHashira();
                    }
                    break;
                case 't':
                    if (e.shiftKey) {
                        // Ctrl+Shift+T: 隠れト書き挿入
                        e.preventDefault();
                        insertHiddenTogaki();
                    } else {
                        // Ctrl+T: ト書き挿入
                        e.preventDefault();
                        insertTogaki();
                    }
                    break;
                case 'l':
                    // Ctrl+L: セリフ挿入
                    e.preventDefault();
                    insertSerifu();
                    break;
                case 'z':
                    if (e.shiftKey) {
                        // Ctrl+Shift+Z: やり直し
                        e.preventDefault();
                        redoAction();
                    } else {
                        // Ctrl+Z: 元に戻す
                        e.preventDefault();
                        undoAction();
                    }
                    break;
                case 'y':
                    // Ctrl+Y: やり直し
                    e.preventDefault();
                    redoAction();
                    break;
            }
        }
    });
}

/**
 * 登場人物選択モーダルの設定
 */
function setupCharacterSelectionModal() {
    const modal = document.getElementById('character-select-modal');
    if (!modal) return;
    
    // 登場人物クリックイベント
    document.querySelectorAll('.character-item').forEach(item => {
        item.addEventListener('click', function() {
            const characterName = this.getAttribute('data-name');
            insertCharacterName(characterName);
            modal.style.display = 'none';
        });
    });
    
    // 新規登場人物追加ボタン
    document.getElementById('add-character-btn')?.addEventListener('click', function() {
        const input = document.getElementById('custom-character');
        const name = input.value.trim();
        if (name) {
            insertCharacterName(name);
            modal.style.display = 'none';
            input.value = '';
        }
    });
}

/**
 * 香盤情報モーダルの設定
 */
function setupKoubanModal() {
    const modal = document.getElementById('kouban-select-modal');
    if (!modal) return;
    
    // 香盤情報適用ボタン
    document.getElementById('apply-kouban-btn')?.addEventListener('click', function() {
        const koubanType = document.getElementById('kouban-type').value;
        const koubanDesc = document.getElementById('kouban-desc').value;
        
        applyKoubanInfo(koubanType, koubanDesc);
        modal.style.display = 'none';
    });
}

/**
 * バージョン選択モーダルの設定
 */
function setupVersionModal() {
    const modal = document.getElementById('version-select-modal');
    if (!modal) return;
    
    // バージョン一覧読み込みとイベント設定は実行時に動的に行う
}
/* 台本エディタ初期化 ↑ */

/* 台本編集機能 ↓ */
/**
 * 指定されたシーンにジャンプする
 * @param {number} sceneIndex シーンインデックス
 */
function jumpToScene(sceneIndex) {
    const scenes = document.querySelectorAll('.script-scene');
    if (sceneIndex >= 0 && sceneIndex < scenes.length) {
        // 現在のシーンインデックスを更新
        window.scriptState.currentScene = sceneIndex;
        
        // シーン要素にスクロール
        scenes[sceneIndex].scrollIntoView({ behavior: 'smooth' });
        
        // サイドバーのハイライト更新
        document.querySelectorAll('.script-sidebar-scene').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.script-sidebar-scene[data-scene="${sceneIndex}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

/**
 * シーン一覧を更新する
 */
function updateSceneList() {
    const sidebarList = document.getElementById('script-scene-list');
    const scenes = document.querySelectorAll('.script-scene');
    
    if (!sidebarList) return;
    
    // 既存の内容をクリア
    sidebarList.innerHTML = '';
    
    // シーン一覧を再構築
    scenes.forEach((scene, index) => {
        const hashiraId = scene.querySelector('.script-hashira-id')?.textContent.trim() || '';
        const location = scene.querySelector('.script-hashira-location')?.textContent.trim() || '';
        
        const sceneItem = document.createElement('div');
        sceneItem.className = 'script-sidebar-scene';
        sceneItem.setAttribute('data-scene', index);
        
        // しおりがある場合はアイコンを表示
        if (hasBookmark(index)) {
            const bookmarkIcon = document.createElement('span');
            bookmarkIcon.className = 'sidebar-bookmark';
            sceneItem.appendChild(bookmarkIcon);
        }
        
        sceneItem.appendChild(document.createTextNode(`#${hashiraId} ${location}`));
        
        // クリックイベントを設定
        sceneItem.addEventListener('click', function() {
            jumpToScene(index);
        });
        
        sidebarList.appendChild(sceneItem);
    });
    
    // 現在のシーンをハイライト
    const currentScene = window.scriptState.currentScene;
    const activeItem = sidebarList.querySelector(`.script-sidebar-scene[data-scene="${currentScene}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

/**
 * 行番号を生成する
 */
function generateLineNumbers() {
    const editArea = document.getElementById('scriptEditArea');
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (!editArea || !lineNumbersCont || !lineNumbersScene) return;
    
    // 行番号エリアをクリア
    lineNumbersCont.innerHTML = '';
    lineNumbersScene.innerHTML = '';
    
    // 行番号情報を初期化
    window.scriptState.lineNumbers = [];
    window.scriptState.sceneLineNumbers = {};
    
    let lineCount = 1;
    let currentSceneIndex = 0;
    let sceneLineCount = 1;
    
    // 編集エリア内の要素を走査して行番号を生成
    const elements = editArea.querySelectorAll('.scriptarea-hashira, .scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .script-page-break, .time-progress');
    
    elements.forEach((element, index) => {
        // シーン開始を検出
        if (element.classList.contains('scriptarea-hashira')) {
            // 新しいシーンの開始
            const sceneElement = element.closest('.script-scene');
            if (sceneElement) {
                currentSceneIndex = Array.from(document.querySelectorAll('.script-scene')).indexOf(sceneElement);
                sceneLineCount = 1;
                
                // シーンごとの行番号オブジェクトを初期化
                if (!window.scriptState.sceneLineNumbers[currentSceneIndex]) {
                    window.scriptState.sceneLineNumbers[currentSceneIndex] = [];
                }
            }
        }
        
        // 行番号を生成
        const lineItemCont = document.createElement('div');
        lineItemCont.className = 'script-line-number';
        lineItemCont.textContent = lineCount;
        lineItemCont.setAttribute('data-element-index', index);
        
        const lineItemScene = document.createElement('div');
        lineItemScene.className = 'script-line-number';
        lineItemScene.textContent = sceneLineCount;
        lineItemScene.setAttribute('data-element-index', index);
        
        // シーン開始行の場合、クラスを追加
        if (sceneLineCount === 1) {
            lineItemScene.classList.add('scene-start-number');
        }
        
        // しおりが設定されている場合はアイコンを表示
        if (isLineBookmarked(lineCount)) {
            const bookmark = document.createElement('div');
            bookmark.className = 'script-bookmark';
            bookmark.setAttribute('data-line', lineCount);
            bookmark.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
            
            // しおり番号を表示
            const bookmarkData = getBookmarkByLine(lineCount);
            if (bookmarkData) {
                const bookmarkNumber = document.createElement('span');
                bookmarkNumber.className = 'script-bookmark-number';
                bookmarkNumber.textContent = bookmarkData.number;
                bookmark.appendChild(bookmarkNumber);
            }
            
            // クリックイベントを設定
            bookmark.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleBookmark(lineCount);
            });
            
            lineItemCont.appendChild(bookmark);
        }
        
        // 行番号コンテナに追加
        lineNumbersCont.appendChild(lineItemCont);
        lineNumbersScene.appendChild(lineItemScene);
        
        // 行番号情報を保存
        window.scriptState.lineNumbers.push({
            lineNumber: lineCount,
            sceneIndex: currentSceneIndex,
            sceneLineNumber: sceneLineCount,
            element: element
        });

        
        // シーンごとの行番号情報も保存
        if (window.scriptState.sceneLineNumbers[currentSceneIndex]) {
            window.scriptState.sceneLineNumbers[currentSceneIndex].push({
                lineNumber: lineCount,
                sceneLineNumber: sceneLineCount,
                element: element
            });
        }
        
        // 行番号をインクリメント
        lineCount++;
        sceneLineCount++;
    });
}

/**
 * 行番号エリアとエディタエリアのスクロール位置を同期する
 */
function syncLineNumbersScroll() {
    const editArea = document.getElementById('scriptEditArea');
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (!editArea || !lineNumbersCont || !lineNumbersScene) return;
    
    lineNumbersCont.scrollTop = editArea.scrollTop;
    lineNumbersScene.scrollTop = editArea.scrollTop;
}

/**
 * 現在の行をハイライトする
 * @param {Element} targetElement ハイライト対象の要素
 */
function highlightCurrentLine(targetElement) {
    // ハイライトクラスをすべての要素から削除
    document.querySelectorAll('.current-line').forEach(el => {
        el.classList.remove('current-line');
    });
    
    // 対象要素が編集対象要素の場合、ハイライトクラスを追加
    const highlightElements = [
        '.scriptarea-hashira',
        '.scriptarea-togaki',
        '.scriptarea-serifu',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden',
        '.script-hashira-location',
        '.script-hashira-time',
        '.script-serifu-name',
        '.script-serifu-content'
    ];
    
    let target = targetElement;
    while (target && target.id !== 'scriptEditArea') {
        const selector = highlightElements.find(sel => target.matches(sel));
        if (selector) {
            target.classList.add('current-line');
            
            // 対応する行番号もハイライト
            highlightLineNumber(target);
            break;
        }
        target = target.parentElement;
    }
}

/**
 * 対応する行番号をハイライトする
 * @param {Element} element ハイライト対象の要素
 */
function highlightLineNumber(element) {
    const lineInfo = window.scriptState.lineNumbers.find(line => line.element === element);
    if (!lineInfo) return;
    
    // 行番号ハイライトクラスをすべての要素から削除
    document.querySelectorAll('.script-line-number.current-line').forEach(el => {
        el.classList.remove('current-line');
    });
    
    // 該当する行番号にハイライトクラスを追加
    const lineNumbersCont = document.getElementById('scriptLineNumbersContinuous');
    const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
    
    if (lineNumbersCont) {
        const lineNumberElement = lineNumbersCont.children[lineInfo.lineNumber - 1];
        if (lineNumberElement) {
            lineNumberElement.classList.add('current-line');
        }
    }
    
    if (lineNumbersScene) {
        const sceneLineNumberElement = lineNumbersScene.children[lineInfo.lineNumber - 1];
        if (sceneLineNumberElement) {
            sceneLineNumberElement.classList.add('current-line');
        }
    }
}

/**
 * 選択テキスト情報を更新する
 */
function updateSelectionInfo() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const text = range.toString();
    
    // 選択情報を更新
    window.scriptState.selection = {
        text: text,
        range: range,
        element: range.commonAncestorContainer.nodeType === 3 ?
                range.commonAncestorContainer.parentElement :
                range.commonAncestorContainer
    };
}

/**
 * エディタのキーダウンイベントを処理する
 * @param {KeyboardEvent} e キーイベント
 */
function handleEditorKeydown(e) {
    // 編集状態を記録
    if (!window.scriptState.edited && !e.ctrlKey && !e.metaKey && !e.altKey) {
        window.scriptState.edited = true;
    }
    
    // キーに応じた処理
    switch (e.key) {
        case 'Enter':
            // Enter キーの処理
            handleEnterKey(e);
            break;
        case 'Tab':
            // Tab キーの処理
            handleTabKey(e);
            break;
        case 'Backspace':
        case 'Delete':
            // 削除キーの処理
            handleDeleteKey(e);
            break;
    }
}

/**
 * Enter キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleEnterKey(e) {
    // 現在アクティブな要素を取得
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    
    // 柱、ト書き、セリフ要素内でのEnterキーの処理
    if (activeElement && activeElement.contentEditable === 'true') {
        let targetElement = null;
        
        // 親要素を検索して対象となる要素を特定
        let element = activeElement;
        while (element && element.id !== 'scriptEditArea') {
            if (element.classList.contains('scriptarea-togaki') ||
                element.classList.contains('scriptarea-serifu') ||
                element.classList.contains('script-serifu-content')) {
                targetElement = element;
                break;
            }
            element = element.parentElement;
        }
        
        if (targetElement) {
            // ト書きでのEnterキー
            if (targetElement.classList.contains('scriptarea-togaki')) {
                e.preventDefault();
                // 現在位置に新しいト書き要素を挿入
                insertTogakiAtCursor();
                return;
            }
            
            // セリフ内容でのEnterキー
            if (targetElement.classList.contains('script-serifu-content')) {
                // デフォルトの改行動作を許可（複数行セリフの場合）
                return;
            }
            
            // セリフでのEnterキー
            if (targetElement.classList.contains('scriptarea-serifu')) {
                e.preventDefault();
                // 同じ登場人物名で新しいセリフを追加
                const characterName = targetElement.querySelector('.script-serifu-name')?.textContent || '';
                insertSerifuWithName(characterName);
                return;
            }
        }
    }
}

/**
 * Tab キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleTabKey(e) {
    e.preventDefault();
    
    // 現在のアクティブ要素
    const activeElement = document.activeElement;
    
    // 台本編集エリア内でのTabキー
    if (activeElement && activeElement.contentEditable === 'true') {
        // シフトキーが押されている場合は逆順に移動
        if (e.shiftKey) {
            moveToPreviousEditableElement();
        } else {
            moveToNextEditableElement();
        }
    }
}

/**
 * 削除キーの処理
 * @param {KeyboardEvent} e キーイベント
 */
function handleDeleteKey(e) {
    // 削除対象の要素を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 空のト書きやセリフ要素を削除
    if (range.collapsed) {
        const element = range.startContainer.nodeType === 3 ?
                       range.startContainer.parentElement :
                       range.startContainer;
        
        let target = element;
        while (target && target.id !== 'scriptEditArea') {
            if (target.classList.contains('scriptarea-togaki') ||
                target.classList.contains('scriptarea-serifu')) {
                
                // 要素が空の場合は削除
                if (target.textContent.trim() === '' && 
                    (e.key === 'Delete' || e.key === 'Backspace')) {
                    e.preventDefault();
                    target.remove();
                    
                    // 行番号を再生成
                    generateLineNumbers();
                    return;
                }
            }
            target = target.parentElement;
        }
    }
}

/**
 * 次の編集可能要素に移動
 */
function moveToNextEditableElement() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === 3 ?
                          range.startContainer.parentElement :
                          range.startContainer;
    
    // 編集可能要素のセレクタ
    const editableSelectors = [
        '.script-hashira-location',
        '.script-hashira-time',
        '.scriptarea-hashira-hidden',
        '.scriptarea-togaki',
        '.script-serifu-name',
        '.script-serifu-content',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden'
    ];
    
    // 現在の要素以降のすべての編集可能要素を取得
    const editArea = document.getElementById('scriptEditArea');
    const allEditables = Array.from(editArea.querySelectorAll(editableSelectors.join(',')));
    
    // 現在の要素のインデックスを取得
    let currentIndex = -1;
    let targetElement = null;
    
    for (let i = 0; i < allEditables.length; i++) {
        if (allEditables[i].contains(currentElement) || currentElement.contains(allEditables[i])) {
            currentIndex = i;
            break;
        }
    }
    
    // 次の要素に移動
    if (currentIndex !== -1 && currentIndex < allEditables.length - 1) {
        targetElement = allEditables[currentIndex + 1];
    } else if (allEditables.length > 0) {
        // 最後の要素の場合は最初に戻る
        targetElement = allEditables[0];
    }
    
    // 対象要素にフォーカスを移動
    if (targetElement) {
        targetElement.focus();
        
        // カーソルを要素の先頭に設定
        const newRange = document.createRange();
        newRange.selectNodeContents(targetElement);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

/**
 * 前の編集可能要素に移動
 */
function moveToPreviousEditableElement() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === 3 ?
                          range.startContainer.parentElement :
                          range.startContainer;
    
    // 編集可能要素のセレクタ
    const editableSelectors = [
        '.script-hashira-location',
        '.script-hashira-time',
        '.scriptarea-hashira-hidden',
        '.scriptarea-togaki',
        '.script-serifu-name',
        '.script-serifu-content',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu-hidden'
    ];
    
    // 現在の要素以前のすべての編集可能要素を取得
    const editArea = document.getElementById('scriptEditArea');
    const allEditables = Array.from(editArea.querySelectorAll(editableSelectors.join(',')));
    
    // 現在の要素のインデックスを取得
    let currentIndex = -1;
    let targetElement = null;
    
    for (let i = 0; i < allEditables.length; i++) {
        if (allEditables[i].contains(currentElement) || currentElement.contains(allEditables[i])) {
            currentIndex = i;
            break;
        }
    }
    
    // 前の要素に移動
    if (currentIndex > 0) {
        targetElement = allEditables[currentIndex - 1];
    } else if (allEditables.length > 0) {
        // 最初の要素の場合は最後に移動
        targetElement = allEditables[allEditables.length - 1];
    }
    
    // 対象要素にフォーカスを移動
    if (targetElement) {
        targetElement.focus();
        
        // カーソルを要素の末尾に設定
        const newRange = document.createRange();
        newRange.selectNodeContents(targetElement);
        newRange.collapse(false);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

/**
 * 編集状態の監視を開始
 */
function startEditWatcher() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 変更の監視用にMutationObserverを設定
    const observer = new MutationObserver(function(mutations) {
        // 変更があった場合は編集状態をtrueに
        window.scriptState.edited = true;
        
        // 行番号を再生成
        generateLineNumbers();
        
        // シーン一覧を更新
        updateSceneList();
    });
    
    // 監視設定
    observer.observe(editArea, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
    });
}

/**
 * 自動保存を実行
 */
function autoSave() {
    // 編集状態がなければ何もしない
    if (!window.scriptState.edited || window.scriptState.isSaving) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {

        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // フォームデータを取得
        const formData = new FormData(document.getElementById('script-form'));
        
        // 自動保存フラグを追加
        formData.append('auto_save', '1');
        
        // Ajax送信
        fetch('index-edit-process.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 保存成功
                window.scriptState.edited = false;
                window.scriptState.lastSaved = new Date();
                console.log('自動保存が完了しました');
            } else {
                // 保存失敗
                console.error('自動保存エラー:', data.message);
            }
        })
        .catch(error => {
            console.error('自動保存エラー:', error);
        })
        .finally(() => {
            window.scriptState.isSaving = false;
        });
    } catch (error) {
        console.error('自動保存処理エラー:', error);
        window.scriptState.isSaving = false;
    }
}

/**
 * 台本内容をシリアライズする
 */
function serializeScriptContent() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return null;
    
    const scenes = editArea.querySelectorAll('.script-scene');
    const serializedScenes = [];
    
    scenes.forEach((scene, index) => {
        const sceneData = {
            scene_id: scene.querySelector('.script-hashira-id')?.textContent.trim() || `${index + 1}`.padStart(3, '0'),
            location: scene.querySelector('.script-hashira-location')?.textContent.trim() || '',
            time_setting: scene.querySelector('.script-hashira-time')?.textContent.trim() || '',
            hidden_description: scene.querySelector('.scriptarea-hashira-hidden')?.textContent.trim() || '',
            content: []
        };
        
        // シーン内のコンテンツ要素を取得
        const contentElements = scene.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        contentElements.forEach(element => {
            let contentItem = null;
            
            if (element.classList.contains('scriptarea-togaki')) {
                contentItem = {
                    type: 'togaki',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('scriptarea-serifu')) {
                contentItem = {
                    type: 'serifu',
                    character: element.querySelector('.script-serifu-name')?.textContent.trim() || '',
                    text: element.querySelector('.script-serifu-content')?.textContent.trim() || ''
                };
            } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                contentItem = {
                    type: 'hidden_togaki',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                contentItem = {
                    type: 'hidden_serifu',
                    character: element.querySelector('.script-serifu-name')?.textContent.trim() || '',
                    text: element.querySelector('.script-serifu-content')?.textContent.trim() || ''
                };
            } else if (element.classList.contains('time-progress')) {
                contentItem = {
                    type: 'time_progress',
                    text: element.textContent.trim()
                };
            } else if (element.classList.contains('script-page-break')) {
                contentItem = {
                    type: 'page_break'
                };
            }
            
            if (contentItem) {
                sceneData.content.push(contentItem);
            }
        });
        
        serializedScenes.push(sceneData);
    });
    
    return {
        scenes: serializedScenes,
        meta: {
            display_mode: window.scriptState.displayMode,
            view_settings: window.scriptState.viewSettings,
            last_saved: new Date().toISOString()
        }
    };
}

/**
 * 上書き保存を実行
 */
function saveOverwrite() {
    if (window.scriptState.isSaving) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // タイトルを取得・設定
        const titleInput = document.getElementById('title');
        if (titleInput) {
            // タイトルが空の場合はデフォルト値を設定
            if (!titleInput.value) {
                const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
                titleInput.value = workTitle ? `${workTitle}台本` : '無題';
            }
        }
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('保存処理エラー:', error);
        alert('保存中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * 新しいバージョンとして保存
 */
function saveNewVersion() {
    if (window.scriptState.isSaving) return;
    
    // バージョン入力ダイアログを表示
    const newVersion = prompt('新しいバージョン名を入力してください（例: 第2稿）');
    if (!newVersion) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // 新規バージョンとして保存するフラグを追加
        const saveAsNewInput = document.createElement('input');
        saveAsNewInput.type = 'hidden';
        saveAsNewInput.name = 'save_as_new_version';
        saveAsNewInput.value = '1';
        document.getElementById('script-form').appendChild(saveAsNewInput);
        
        // タイトルを取得・設定
        const titleInput = document.getElementById('title');
        if (titleInput) {
            // タイトルが空の場合はデフォルト値を設定
            if (!titleInput.value) {
                const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
                titleInput.value = workTitle ? `${workTitle}台本` : '無題';
            }
        }
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('保存処理エラー:', error);
        alert('保存中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * 完成稿として保存
 */
function setFinalVersion() {
    if (window.scriptState.isSaving) return;
    
    // 確認ダイアログ
    const confirmed = confirm('現在の台本を完成稿として設定しますか？\n※完成稿として設定した後も編集は可能です');
    if (!confirmed) return;
    
    // 完成稿フラグを設定
    const isFinalInput = document.getElementById('is_final');
    if (isFinalInput) {
        isFinalInput.value = '1';
    }
    
    // 上書き保存実行
    saveOverwrite();
}

/**
 * 香盤情報を同期
 */
function syncKoubanInfo() {
    if (window.scriptState.isSaving) return;
    
    // 確認ダイアログ
    const confirmed = confirm('現在の台本の内容を香盤表に反映しますか？');
    if (!confirmed) return;
    
    // 保存中状態に設定
    window.scriptState.isSaving = true;
    
    try {
        // 台本内容をJSONにシリアライズ
        const scriptContent = serializeScriptContent();
        
        // 台本フォームの隠しフィールドに設定
        document.getElementById('script_content').value = JSON.stringify(scriptContent);
        
        // 香盤同期フラグを追加
        const syncKoubanInput = document.createElement('input');
        syncKoubanInput.type = 'hidden';
        syncKoubanInput.name = 'sync_kouban';
        syncKoubanInput.value = '1';
        document.getElementById('script-form').appendChild(syncKoubanInput);
        
        // フォームを送信
        document.getElementById('script-form').submit();
    } catch (error) {
        console.error('香盤同期エラー:', error);
        alert('香盤同期中にエラーが発生しました。もう一度お試しください。');
        window.scriptState.isSaving = false;
    }
}

/**
 * テキストとして保存
 */
function saveAsText() {
    // テキスト形式に変換
    let textContent = '';
    const scenes = document.querySelectorAll('.script-scene');
    
    scenes.forEach(scene => {
        // 柱情報
        const hashiraId = scene.querySelector('.script-hashira-id')?.textContent.trim() || '';
        const location = scene.querySelector('.script-hashira-location')?.textContent.trim() || '';
        const time = scene.querySelector('.script-hashira-time')?.textContent.trim() || '';
        
        textContent += `${hashiraId} ${location} ${time}\n\n`;
        
        // シーン内容
        const contentElements = scene.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        contentElements.forEach(element => {
            if (element.classList.contains('scriptarea-togaki')) {
                // ト書き（タブ2つ）
                textContent += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('scriptarea-serifu')) {
                // セリフ（タブ1つ）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                textContent += `\t${name}　${content}\n`;
            } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                // 隠れト書き（タブ2つ）
                textContent += `\t\t(${element.textContent.trim()})\n`;
            } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                // 隠れセリフ（タブ1つ）
                const name = element.querySelector('.script-serifu-name')?.textContent.trim() || '';
                const content = element.querySelector('.script-serifu-content')?.textContent.trim() || '';
                textContent += `\t(${name}　${content})\n`;
            } else if (element.classList.contains('time-progress')) {
                // 時間経過
                textContent += `\t\t${element.textContent.trim()}\n`;
            } else if (element.classList.contains('script-page-break')) {
                // ページ区切り
                textContent += `\t\t==========\n`;
            }
        });
        
        // シーン区切り
        textContent += '\n\n';
    });
    
    // ファイル名を決定
    const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
    const version = document.getElementById('version')?.value || '1';
    const isFinal = document.getElementById('is_final')?.value === '1';
    
    const filename = workTitle ? 
        `${workTitle}台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.txt` : 
        `台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.txt`;
    
    // ダウンロード用のリンクを作成
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

/**
 * PDFとして保存
 */
function saveAsPDF() {
    // PDF保存設定ダイアログを表示
    showPDFSettingsDialog();
}

/**
 * PDF設定ダイアログを表示
 */
function showPDFSettingsDialog() {
    // モーダルダイアログ作成
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // モーダルコンテンツ
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // ダイアログヘッダー
    const header = document.createElement('h3');
    header.textContent = 'PDF保存設定';
    
    // 閉じるボタン
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 設定フォーム
    const form = document.createElement('div');
    form.className = 'pdf-settings-form';
    
    // 文字組設定
    const textModeGroup = createFormGroup('文字組:', 'text-mode', [
        { value: 'horizontal', text: '横書き', checked: true },
        { value: 'vertical', text: '縦書き' }
    ]);
    
    // レイアウト設定
    const layoutGroup = createFormGroup('レイアウト:', 'layout', [
        { value: 'a4-portrait', text: 'A4縦', checked: true },
        { value: 'b5-portrait', text: 'B5縦' },
        { value: 'script-portrait', text: '台本サイズ縦' },
        { value: 'a4-landscape', text: 'A4横' },
        { value: 'b5-landscape', text: 'B5横' },
        { value: 'script-landscape', text: '台本サイズ横' }
    ]);
    
    // 文字サイズ設定
    const fontSizeGroup = createFormGroup('文字サイズ:', 'font-size', [
        { value: 'small', text: '小さく(0.8em)' },
        { value: 'normal', text: '標準', checked: true },
        { value: 'large', text: '大きく(1.2em)' }
    ]);
    
    // 行間設定
    const lineHeightGroup = createFormGroup('行間:', 'line-height', [
        { value: 'narrow', text: '狭く(0.8em)' },
        { value: 'normal', text: '標準', checked: true },
        { value: 'wide', text: '広く(1.2em)' }
    ]);
    
    // 色設定
    const colorGroup = createFormGroup('色:', 'color', [
        { value: 'mono', text: 'モノクロ', checked: true },
        { value: 'color', text: 'カラー' }
    ]);
    
    // 書体設定
    const fontFamilyGroup = createFormGroup('書体:', 'font-family', [
        { value: 'mincho', text: '明朝', checked: true },
        { value: 'gothic', text: 'ゴシック' },
        { value: 'maru-gothic', text: '丸ゴシック' }
    ]);
    
    // ボタングループ
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    // 保存ボタン
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn-primary';
    saveButton.textContent = 'PDFを保存';
    saveButton.addEventListener('click', function() {
        // 設定値を取得
        const settings = {
            textMode: getSelectedRadioValue('text-mode'),
            layout: getSelectedRadioValue('layout'),
            fontSize: getSelectedRadioValue('font-size'),
            lineHeight: getSelectedRadioValue('line-height'),
            color: getSelectedRadioValue('color'),
            fontFamily: getSelectedRadioValue('font-family')
        };
        
        // PDF生成
        generatePDF(settings);
        
        // ダイアログを閉じる
        document.body.removeChild(modal);
    });
    
    // キャンセルボタン
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn-secondary';
    cancelButton.textContent = 'キャンセル';
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // ボタンをグループに追加
    buttonGroup.appendChild(saveButton);
    buttonGroup.appendChild(cancelButton);
    
    // フォームに各設定グループを追加
    form.appendChild(textModeGroup);
    form.appendChild(layoutGroup);
    form.appendChild(fontSizeGroup);
    form.appendChild(lineHeightGroup);
    form.appendChild(colorGroup);
    form.appendChild(fontFamilyGroup);
    
    // モーダルにコンテンツを追加
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modalContent.appendChild(buttonGroup);
    
    // モーダルをDOMに追加
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

/**
 * ラジオボタングループを作成
 * @param {string} label ラベル
 * @param {string} name 名前
 * @param {Array} options オプション
 * @returns {HTMLElement} フォームグループ要素
 */
function createFormGroup(label, name, options) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    group.appendChild(labelEl);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'radio-options';
    
    options.forEach(option => {
        const container = document.createElement('div');
        container.className = 'radio-option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        input.id = `${name}-${option.value}`;
        if (option.checked) {
            input.checked = true;
        }
        
        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${name}-${option.value}`;
        optionLabel.textContent = option.text;
        
        container.appendChild(input);
        container.appendChild(optionLabel);
        optionsContainer.appendChild(container);
    });
    
    group.appendChild(optionsContainer);
    return group;
}

/**
 * ラジオボタンの選択値を取得
 * @param {string} name ラジオボタン名
 * @returns {string} 選択値
 */
function getSelectedRadioValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

/**
 * PDFを生成
 * @param {Object} settings PDF設定
 */
function generatePDF(settings) {
    // jsPDFが必要なため、CDNから動的に読み込む
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = function() {
        // HTML2Canvasも読み込む
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script2.onload = function() {
            // PDFの実際の生成処理
            createPDFFromScript(settings);
        };
        document.head.appendChild(script2);
    };
    document.head.appendChild(script);
}

/**
 * 台本内容からPDFを生成
 * @param {Object} settings PDF設定
 */
function createPDFFromScript(settings) {
    // 設定に応じて用紙サイズを決定
    let orientation = 'portrait';
    let format = 'a4';
    
    if (settings.layout.includes('landscape')) {
        orientation = 'landscape';
    }
    
    if (settings.layout.includes('b5')) {
        format = 'b5';
    } else if (settings.layout.includes('script')) {
        // 台本サイズは少し特殊なサイズ（JIS B5 182mm×257mm）
        format = [182, 257];
    }
    
    // jsPDFインスタンス作成
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
        compress: true
    });
    
    // フォント設定
    let fontName = 'HeiseiMin-W3';  // 明朝体
    if (settings.fontFamily === 'gothic') {
        fontName = 'HeiseiKakuGo-W5';  // ゴシック体
    } else if (settings.fontFamily === 'maru-gothic') {
        fontName = 'HeiseiKakuGo-W5';  // 丸ゴシックの代わりにゴシック体
    }
    
    // フォントサイズ設定
    let fontSize = 10;  // 標準
    if (settings.fontSize === 'small') {
        fontSize = 8;
    } else if (settings.fontSize === 'large') {
        fontSize = 12;
    }
    
    // 行間設定
    let lineHeight = 1.5;  // 標準
    if (settings.lineHeight === 'narrow') {
        lineHeight = 1.2;
    } else if (settings.lineHeight === 'wide') {
        lineHeight = 1.8;
    }
    
    // カラー設定
    const useColor = settings.color === 'color';
    
    // ページサイズを取得
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // マージン設定
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // PDF生成元のHTMLコンテンツを用意（PDFエクスポート用のクローンを作成）
    const originalContent = document.getElementById('scriptEditArea');
    const clonedContent = originalContent.cloneNode(true);
    
    // クローンを非表示でドキュメントに追加
    clonedContent.style.position = 'absolute';
    clonedContent.style.left = '-9999px';
    
    // 縦書き設定
    if (settings.textMode === 'vertical') {
        clonedContent.style.writingMode = 'vertical-rl';
        clonedContent.style.textOrientation = 'upright';
    }
    
    // フォントサイズ設定
    if (settings.fontSize === 'small') {
        clonedContent.style.fontSize = '0.8em';
    } else if (settings.fontSize === 'large') {
        clonedContent.style.fontSize = '1.2em';
    }
    
    // 行間設定
    if (settings.lineHeight === 'narrow') {
        clonedContent.style.lineHeight = '0.8em';
    } else if (settings.lineHeight === 'wide') {
        clonedContent.style.lineHeight = '1.2em';
    }
    
    // モノクロ設定
    if (!useColor) {
        clonedContent.style.filter = 'grayscale(100%)';
    }
    
    // 非表示要素を処理
    const hiddenElements = clonedContent.querySelectorAll('.scriptarea-hashira-hidden, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden');
    hiddenElements.forEach(el => {
        if (window.scriptState.viewSettings.hiddenHashira ||
            window.scriptState.viewSettings.hiddenTogaki ||
            window.scriptState.viewSettings.hiddenChar) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    // ページ区切りを処理
    const pageBreaks = clonedContent.querySelectorAll('.script-page-break');
    pageBreaks.forEach(el => {
        if (window.scriptState.viewSettings.pageBreak) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    document.body.appendChild(clonedContent);
    
    // HTML2Canvasを使用してHTMLをキャプチャし、PDFに変換
    html2canvas(clonedContent, {
        scale: 2,  // 高解像度化
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        // PDFにキャンバスを追加
        const imgData = canvas.toDataURL('image/png');
        
        // ページ分割処理
        const contentHeight = canvas.height;
        const contentWidth = canvas.width;
        
        // 1ページあたりのピクセル数（A4縦の場合、1ページあたり約1123ピクセル）
        const pxPerPage = 1123 * (doc.internal.pageSize.getHeight() / 297);  // A4の高さは297mm
        
        // ページ数を計算
        const numPages = Math.ceil(contentHeight / pxPerPage);
        
        // 各ページをPDFに追加
        for (let i = 0; i < numPages; i++) {
            if (i > 0) {
                doc.addPage();
            }
            
            // キャンバスの範囲を計算
            const srcY = i * pxPerPage;
            const height = Math.min(pxPerPage, contentHeight - srcY);
            
            // キャンバスの一部をPDFに追加
            doc.addImage(
                canvas,
                'PNG',
                margin,
                margin,
                contentWidth,
                contentHeight * (contentWidth / canvas.width),
                null,
                'FAST',
                0
            );
        }
        
        // ファイル名を決定
        const workTitle = document.querySelector('.header-titlename-main')?.textContent || '';
        const version = document.getElementById('version')?.value || '1';
        const isFinal = document.getElementById('is_final')?.value === '1';
        
        const filename = workTitle ? 
            `${workTitle}台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.pdf` : 
            `台本_${isFinal ? '完成稿' : '第' + version + '稿'}_${formatDate(new Date())}.pdf`;
        
        // PDFを保存
        doc.save(filename);
        
        // クローンを削除
        document.body.removeChild(clonedContent);
    });
}

/**
 * 日付をフォーマット (YYYYMMDD)
 * @param {Date} date 日付
 * @returns {string} フォーマットされた日付
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * 新しい台本を作成
 */
function createNewScript() {
    if (window.scriptState.edited) {
        const confirmed = confirm('変更内容が保存されていません。新規作成を続けますか？');
        if (!confirmed) return;
    }
    
    // 現在のURLから作品IDを取得
    const uri_path = window.location.pathname;
    const path_parts = uri_path.split('/');
    const work_id_index = path_parts.findIndex(part => part === 'work') + 1;
    
    if (work_id_index > 0 && work_id_index < path_parts.length) {
        const work_id = path_parts[work_id_index];
        
        // 新規作成ページにリダイレクト
        window.location.href = `/work/${work_id}/script/index-edit.php?t=${Date.now()}`;
    }
}

/**
 * バージョン選択モーダルを開く
 */
function openVersionModal() {
    const modal = document.getElementById('version-select-modal');
    const versionList = document.getElementById('version-list');
    
    if (!modal || !versionList) return;
    
    // バージョン一覧をクリア
    versionList.innerHTML = '';
    
    // ロード中表示
    const loadingItem = document.createElement('div');
    loadingItem.className = 'loading-item';
    loadingItem.textContent = 'バージョン情報を読み込んでいます...';
    versionList.appendChild(loadingItem);
    
    // モーダルを表示
    modal.style.display = 'block';
    
    // バージョン情報を取得
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    
    if (!scriptId || !workId) {
        versionList.innerHTML = '<div class="no-versions">台本情報が取得できませんでした。</div>';
        return;
    }
    
    // Ajax通信でバージョン一覧を取得
    fetch(`get_versions.php?script_id=${scriptId}&work_id=${workId}`)
        .then(response => response.json())
        .then(data => {
            // ロード中表示を削除
            versionList.innerHTML = '';
            
            if (!data || data.length === 0 || data.error) {
                versionList.innerHTML = '<div class="no-versions">バージョン情報がありません。</div>';
                return;
            }
            
            // バージョン一覧を表示
            data.forEach(version => {
                const versionItem = document.createElement('div');
                versionItem.className = 'version-item';
                
                const versionTitle = document.createElement('div');
                versionTitle.className = 'version-title';
                versionTitle.textContent = version.is_final == 1 ? '完成稿' : `第${version.version}稿`;
                
                const versionDate = document.createElement('div');
                versionDate.className = 'version-date';
                versionDate.textContent = new Date(version.updated_at).toLocaleString('ja-JP');
                
                versionItem.appendChild(versionTitle);
                versionItem.appendChild(versionDate);
                
                // クリックイベント
                versionItem.addEventListener('click', function() {
                    if (window.scriptState.edited) {
                        const confirmed = confirm('変更内容が保存されていません。このバージョンを開きますか？');
                        if (!confirmed) return;
                    }
                    
                    // リダイレクト
                    window.location.href = `index-edit.php?id=${version.script_id}&version=${version.version}`;
                });
                
                versionList.appendChild(versionItem);
            });
        })
        .catch(error => {
            console.error('バージョン情報取得エラー:', error);
            versionList.innerHTML = '<div class="no-versions">バージョン情報の取得に失敗しました。</div>';
        });
}

/**
 * 現在のバージョンを削除
 */
function deleteVersion() {
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    const version = document.getElementById('version')?.value || '1';
    
    if (!scriptId || !workId) {
        alert('台本情報が取得できませんでした。');
        return;
    }
    
    // 確認ダイアログ
    const confirmed = confirm(`現在のバージョン（第${version}稿）を削除しますか？\nこの操作は元に戻せません。`);
    if (!confirmed) return;
    
    // 削除リクエスト
    const formData = new FormData();
    formData.append('script_id', scriptId);
    formData.append('work_id', workId);
    formData.append('version', version);
    formData.append('csrf_token', document.querySelector('input[name="csrf_token"]')?.value || '');
    formData.append('action', 'delete_version');
    
    fetch('index-edit-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('バージョンを削除しました。');
            // 台本一覧ページにリダイレクト
            window.location.href = `index.php`;
        } else {
            alert(`削除に失敗しました: ${data.message || 'エラーが発生しました'}`);
        }
    })
    .catch(error => {
        console.error('削除エラー:', error);
        alert('削除処理中にエラーが発生しました。');
    });
}

/**
 * すべてのバージョンを削除
 */
function deleteAllVersions() {
    const scriptId = document.querySelector('input[name="script_id"]')?.value || '';
    const workId = document.querySelector('input[name="work_id"]')?.value || '';
    
    if (!scriptId || !workId) {
        alert('台本情報が取得できませんでした。');
        return;
    }
    
    // 確認ダイアログ
    const confirmed = confirm('この台本のすべてのバージョンを削除しますか？\nこの操作は元に戻せません。');
    if (!confirmed) return;
    
    // 再確認
    const reconfirmed = confirm('本当に削除してよろしいですか？すべてのバージョンのデータが失われます。');
    if (!reconfirmed) return;
    
    // 削除リクエスト
    const formData = new FormData();
    formData.append('script_id', scriptId);
    formData.append('work_id', workId);
    formData.append('csrf_token', document.querySelector('input[name="csrf_token"]')?.value || '');
    formData.append('action', 'delete_all_versions');
    
    fetch('index-edit-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('すべてのバージョンを削除しました。');
            // 台本一覧ページにリダイレクト
            window.location.href = `index.php`;
        } else {
            alert(`削除に失敗しました: ${data.message || 'エラーが発生しました'}`);
        }
    })
    .catch(error => {
        console.error('削除エラー:', error);
        alert('削除処理中にエラーが発生しました。');
    });
}

/**
 * 編集モードを終了
 */
function exitEditMode() {
    if (window.scriptState.edited) {
        const confirmed = confirm('変更内容が保存されていません。編集を終了しますか？');
        if (!confirmed) return;
    }
    
    // 台本閲覧ページにリダイレクト
    window.location.href = 'index.php';
}
/* 台本編集機能 ↑ */

/* 台本要素操作 ↓ */
/**
 * 柱を挿入
 */
function insertHashira() {
    // 柱のHTML
    const hashiraHTML = `
    <div class="script-scene" data-scene-index="${window.scriptState.sceneCount}">
        <div class="scriptarea-hashira">
            <div class="script-hashira-id">${getNextSceneNumber()}</div>
            <div class="script-hashira-content">
                <div class="script-hashira-location-row">
                    <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                    <span class="script-hashira-time" contenteditable="true"></span>
                </div>
                <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
            </div>
        </div>
        <div class="scene-layout">
            <div class="scene-left">
                <!-- 左側エリア -->
            </div>
            <div class="scene-right">
                <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
            </div>
        </div>
    </div>
    `;
    
    // エディタエリア
    const editArea = document.getElementById('scriptEditArea');
    
    // カレントポジションがある場合はその位置に、なければ最後に追加
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        let currentElement = range.startContainer;
        
        // テキストノードの場合は親要素を取得
        if (currentElement.nodeType === 3) {
            currentElement = currentElement.parentElement;
        }
        
        // 現在のシーン要素を検索
        let sceneElement = currentElement;
        while (sceneElement && !sceneElement.classList.contains('script-scene')) {
            sceneElement = sceneElement.parentElement;
            if (sceneElement === editArea) {
                sceneElement = null;
                break;
            }
        }
        
        if (sceneElement) {
            // 現在のシーンの後に追加
            sceneElement.insertAdjacentHTML('afterend', hashiraHTML);
        } else {
            // 最後に追加
            editArea.insertAdjacentHTML('beforeend', hashiraHTML);
        }
    } else {
        // 最後に追加
        editArea.insertAdjacentHTML('beforeend', hashiraHTML);
    }
    
    // シーン数をインクリメント
    window.scriptState.sceneCount++;
    
    // 行番号を再生成
    generateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れ柱を挿入
 */
function insertHiddenHashira() {
    // 選択範囲から現在のシーンを取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 現在のシーン要素を検索
    const editArea = document.getElementById('scriptEditArea');
    let sceneElement = currentElement;
    while (sceneElement && !sceneElement.classList.contains('script-scene')) {
        sceneElement = sceneElement.parentElement;
        if (sceneElement === editArea) {
            sceneElement = null;
            break;
        }
    }
    
    if (!sceneElement) return;
    
    // シーン内の隠れ柱要素を取得
    const hiddenHashira = sceneElement.querySelector('.scriptarea-hashira-hidden');
    
    if (hiddenHashira) {
        // 隠れ柱要素が存在する場合は表示して編集モードにする
        hiddenHashira.style.display = 'block';
        hiddenHashira.focus();
        
        // 表示設定を更新
        window.scriptState.viewSettings.hiddenHashira = true;
        
        // メニュー表示を更新
        const viewToggle = document.querySelector('.view-toggle[data-view="hiddenHashira"]');
        if (viewToggle) {
            viewToggle.setAttribute('data-state', 'visible');
            viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        }
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * ト書きを挿入
 */
function insertTogaki() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // ト書きのHTML
    const togakiHTML = `<div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>`;
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', togakiHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', togakiHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = togakiHTML;
                }
            }
        }
        
        // 新しく追加したト書き要素にフォーカスを当てる
        const newTogaki = insertAfter ? 
                          insertAfter.nextElementSibling : 
                          sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newTogaki) {
            // テキスト全選択
            newTogaki.focus();
            const range = document.createRange();
            range.selectNodeContents(newTogaki);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * カーソル位置にト書きを挿入
 */
function insertTogakiAtCursor() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // ト書き要素を探す
    let togakiElement = currentElement;
    while (togakiElement && !togakiElement.classList.contains('scriptarea-togaki')) {
        togakiElement = togakiElement.parentElement;
    }
    
    if (!togakiElement) return;
    
    // ト書きのHTML
    const togakiHTML = `<div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>`;
    
    // ト書き要素の後に新しいト書きを挿入
    togakiElement.insertAdjacentHTML('afterend', togakiHTML);
    
    // 新しく追加したト書き要素にフォーカスを当てる
    const newTogaki = togakiElement.nextElementSibling;
    if (newTogaki) {
        // テキスト全選択
        newTogaki.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(newTogaki);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れト書きを挿入
 */
function insertHiddenTogaki() {
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 隠れト書きのHTML
    const hiddenTogakiHTML = `<div class="scriptarea-togaki-hidden" contenteditable="true">隠れト書きを入力...</div>`;
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', hiddenTogakiHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', hiddenTogakiHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = hiddenTogakiHTML;
                }
            }
        }
        
        // 新しく追加した隠れト書き要素にフォーカスを当てる
        const newHiddenTogaki = insertAfter ? 
                               insertAfter.nextElementSibling : 
                               sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newHiddenTogaki) {
            // テキスト全選択
            newHiddenTogaki.focus();
            const range = document.createRange();
            range.selectNodeContents(newHiddenTogaki);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 表示設定を更新
            window.scriptState.viewSettings.hiddenTogaki = true;
            
            // メニュー表示を更新
            const viewToggle = document.querySelector('.view-toggle[data-view="hiddenTogaki"]');
            if (viewToggle) {
                viewToggle.setAttribute('data-state', 'visible');
                viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
            }
            
            // 隠れト書きを表示
            document.querySelectorAll('.scriptarea-togaki-hidden').forEach(el => {
                el.style.display = 'block';
            });
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 隠れ登場人物を挿入
 */
function insertHiddenChar() {
    alert('この機能は現在実装中です');
}

/**
 * セリフを挿入
 */
function insertSerifu() {
    // 登場人物選択モーダルを表示
    document.getElementById('character-select-modal').style.display = 'block';
}

/**
 * 指定した登場人物名でセリフを挿入
 * @param {string} characterName 登場人物名
 */
function insertCharacterName(characterName) {
    if (!characterName) return;
    
    // セリフのHTML
    const serifuHTML = `
    <div class="scriptarea-serifu">
        <div class="script-serifu-name" contenteditable="true">${characterName}</div>
        <div class="script-serifu-content" contenteditable="true">セリフを入力...</div>
    </div>
    `;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', serifuHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', serifuHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = serifuHTML;
                }
            }
        }
        
        // 新しく追加したセリフ要素にフォーカスを当てる
        const newSerifu = insertAfter ? 
                         insertAfter.nextElementSibling : 
                         sceneElement.querySelector('.scene-right').firstElementChild;
        
        if (newSerifu) {
            // セリフ内容部分にフォーカス
            const serifuContent = newSerifu.querySelector('.script-serifu-content');
            if (serifuContent) {
                serifuContent.focus();
                
                // テキスト全選択
                const range = document.createRange();
                range.selectNodeContents(serifuContent);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        
        // 登場人物リストに追加（最近使用した登場人物）
        if (!window.scriptState.characters.includes(characterName)) {
            window.scriptState.characters.unshift(characterName);
            
            // 最大10人まで保持
            if (window.scriptState.characters.length > 10) {
                window.scriptState.characters.pop();
            }
        } else {
            // すでに存在する場合は先頭に移動
            const index = window.scriptState.characters.indexOf(characterName);
            window.scriptState.characters.splice(index, 1);
            window.scriptState.characters.unshift(characterName);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 指定した登場人物名でセリフを追加
 * @param {string} characterName 登場人物名
 */
function insertSerifuWithName(characterName) {
    if (!characterName) return;
    
    // セリフのHTML
    const serifuHTML = `
    <div class="scriptarea-serifu">
        <div class="script-serifu-name" contenteditable="true">${characterName}</div>
        <div class="script-serifu-content" contenteditable="true">セリフを入力...</div>
    </div>
    `;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // セリフ要素を探す
    let serifuElement = currentElement;
    while (serifuElement && !serifuElement.classList.contains('scriptarea-serifu')) {
        serifuElement = serifuElement.parentElement;
    }
    
    if (!serifuElement) return;
    
    // セリフ要素の後に新しいセリフを挿入
    serifuElement.insertAdjacentHTML('afterend', serifuHTML);
    
    // 新しく追加したセリフ要素にフォーカスを当てる
    const newSerifu = serifuElement.nextElementSibling;
    if (newSerifu) {
        // セリフ内容部分にフォーカス
        const serifuContent = newSerifu.querySelector('.script-serifu-content');
        if (serifuContent) {
            serifuContent.focus();
            
            // テキスト全選択
            const newRange = document.createRange();
            newRange.selectNodeContents(serifuContent);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 時間経過マークを挿入
 */
function insertTimeProgress() {
    // 時間経過マークのHTML
    const timeProgressHTML = `<div class="scriptarea-togaki time-progress" contenteditable="true">　　×　　×　　×</div>`;
    
    // 現在選択中の位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === 3) {
        currentElement = currentElement.parentElement;
    }
    
    // 挿入位置を特定
    let insertAfter = null;
    
    // 親要素をたどってシーン内の最適な挿入位置を探す
    let element = currentElement;
    while (element && !element.classList.contains('script-scene')) {
        if (element.classList.contains('scriptarea-togaki') || 
            element.classList.contains('scriptarea-serifu') ||
            element.classList.contains('scriptarea-togaki-hidden') ||
            element.classList.contains('scriptarea-serifu-hidden') ||
            element.classList.contains('time-progress') ||
            element.classList.contains('script-page-break')) {
            insertAfter = element;
            break;
        }
        
        if (element.classList.contains('scene-right')) {
            // scene-rightの場合は、最初の子要素の前に挿入
            break;
        }
        
        element = element.parentElement;
    }
    
    // シーン要素を取得
    const sceneElement = element?.closest('.script-scene');
    
    if (sceneElement) {
        if (insertAfter) {
            // 要素の後に追加
            insertAfter.insertAdjacentHTML('afterend', timeProgressHTML);
        } else {
            // scene-rightの最初の子要素として追加
            const sceneRight = sceneElement.querySelector('.scene-right');
            if (sceneRight) {
                if (sceneRight.childElementCount > 0) {
                    // 最初の子要素の前に挿入
                    sceneRight.firstElementChild.insertAdjacentHTML('beforebegin', timeProgressHTML);
                } else {
                    // scene-rightが空の場合は内部に追加
                    sceneRight.innerHTML = timeProgressHTML;
                }
            }
        }
    }
    
    // 行番号を再生成
    generateLineNumbers();
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 編集記号を挿入
 * @param {string} mark 編集記号
 */
function insertEditMark(mark) {
    // マークが選択されていない場合
    if (!mark) return;
    
    // 選択範囲がある場合は置き換え
    const selection = window.getSelection();
    if (selection.rangeCount && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // 選択範囲を編集マークで置き換え
        const markSpan = document.createElement('span');
        markSpan.className = 'edit-mark';
        markSpan.textContent = mark;
        markSpan.style.fontStyle = 'italic';
        markSpan.style.fontSize = '0.8rem';
        markSpan.style.color = 'gray';
        
        range.deleteContents();
        range.insertNode(markSpan);
        
        // カーソルを編集マークの後ろに移動
        range.setStartAfter(markSpan);
        range.setEndAfter(markSpan);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // 選択範囲がなければカーソル位置に挿入
        const markSpan = document.createElement('span');
        markSpan.className = 'edit-mark';
        markSpan.textContent = mark;
        markSpan.style.fontStyle = 'italic';
        markSpan.style.fontSize = '0.8rem';
        markSpan.style.color = 'gray';
        
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.insertNode(markSpan);
            
            // カーソルを編集マークの後ろに移動
            range.setStartAfter(markSpan);
            range.setEndAfter(markSpan);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    // 編集状態を更新
    window.scriptState.edited = true;
}

/**
 * 画像を挿入
 */
function insertImage() {
    // ファイル選択ダイアログを作成
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // ファイル選択時の処理
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) { // 5MB制限
            alert('ファイルサイズは5MB以下にしてください');
            return;
        }
        
        // FormDataオブジェクト作成
        const formData = new FormData();
        formData.append('image', file);
        formData.append('work_id', work_id);
        formData.append('field_name', 'script_image');
        formData.append('csrf_token', csrf_token);
        
        // アップロード処理
        fetch('/work/upload_work_image.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 画像要素を作成
                const imgElem = document.createElement('img');
                imgElem.src = data.image_url;
                imgElem.style.maxWidth = '100%';
                imgElem.classList.add('script-inserted-image');
                
                // 現在のカーソル位置に画像を挿入
                insertAtCursor(imgElem);
            } else {
                alert('画像のアップロードに失敗しました: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('画像のアップロード中にエラーが発生しました');
        });
    };
    
    // ファイル選択ダイアログを表示
    input.click();
}

/**
 * カーソル位置にHTML要素を挿入
 */
function insertAtCursor(element) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(element);
    
    // カーソルを挿入した要素の後ろに移動
    range.setStartAfter(element);
    range.setEndAfter(element);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * カット割り指定を挿入
 */
function insertCutMark() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const br = document.createElement('br');
    br.className = 'cut-wari';
    
    // カット割りを挿入
    range.deleteContents();
    range.insertNode(br);
    
    // カーソルを要素の後ろに移動
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // イベント発火（変更を検知）
    editArea.dispatchEvent(new Event('input'));
}

/**
 * テキストボックス (縦書き) を挿入
 */
function insertTextboxVertical() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // テキストボックス要素を作成
    const textbox = document.createElement('div');
    textbox.className = 'script-textbox-vertical';
    textbox.contentEditable = 'true';
    textbox.style.position = 'absolute';
    textbox.style.left = '50px';
    textbox.style.top = '50px';
    textbox.style.width = '200px';
    textbox.style.height = '300px';
    textbox.style.border = '2px solid black';
    textbox.style.padding = '10px';
    textbox.style.backgroundColor = 'white';
    textbox.style.color = 'black';
    textbox.style.zIndex = '100';
    textbox.dataset.type = 'textbox-vertical';
    textbox.innerHTML = '縦書きテキストを入力';
    
    // リサイズハンドルを追加
    addResizeHandles(textbox);
    
    // ドラッグ機能を追加
    makeElementDraggable(textbox);
    
    // テキストボックスを挿入
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(textbox);
    
    // イベント発火（変更を検知）
    editArea.dispatchEvent(new Event('input'));
}

/**
 * テキストボックス (横書き) を挿入
 */
function insertTextboxHorizontal() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // テキストボックス要素を作成
    const textbox = document.createElement('div');
    textbox.className = 'script-textbox-horizontal';
    textbox.contentEditable = 'true';
    textbox.style.position = 'absolute';
    textbox.style.left = '50px';
    textbox.style.top = '50px';
    textbox.style.width = '300px';
    textbox.style.height = '200px';
    textbox.style.border = '2px solid black';
    textbox.style.padding = '10px';
    textbox.style.backgroundColor = 'white';
    textbox.style.color = 'black';
    textbox.style.zIndex = '100';
    textbox.dataset.type = 'textbox-horizontal';
    textbox.innerHTML = '横書きテキストを入力';
    
    // リサイズハンドルを追加
    addResizeHandles(textbox);
    
    // ドラッグ機能を追加
    makeElementDraggable(textbox);
    
    // テキストボックスを挿入
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(textbox);
    
    // イベント発火（変更を検知）
    editArea.dispatchEvent(new Event('input'));
}

/**
 * 要素にリサイズハンドルを追加
 */
function addResizeHandles(element) {
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${pos}`;
        handle.style.position = 'absolute';
        handle.style.width = '10px';
        handle.style.height = '10px';
        handle.style.backgroundColor = '#007bff';
        handle.style.borderRadius = '50%';
        handle.style.zIndex = '200';
        
        // ハンドルの位置を設定
        switch(pos) {
            case 'nw': 
                handle.style.top = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'nw-resize';
                break;
            case 'n':
                handle.style.top = '-5px';
                handle.style.left = 'calc(50% - 5px)';
                handle.style.cursor = 'n-resize';
                break;
            case 'ne':
                handle.style.top = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'ne-resize';
                break;
            case 'e':
                handle.style.top = 'calc(50% - 5px)';
                handle.style.right = '-5px';
                handle.style.cursor = 'e-resize';
                break;
            case 'se':
                handle.style.bottom = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'se-resize';
                break;
            case 's':
                handle.style.bottom = '-5px';
                handle.style.left = 'calc(50% - 5px)';
                handle.style.cursor = 's-resize';
                break;
            case 'sw':
                handle.style.bottom = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'sw-resize';
                break;
            case 'w':
                handle.style.top = 'calc(50% - 5px)';
                handle.style.left = '-5px';
                handle.style.cursor = 'w-resize';
                break;
        }
        
        // リサイズ機能を追加
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(getComputedStyle(element).width, 10);
            const startHeight = parseInt(getComputedStyle(element).height, 10);
            const startLeft = parseInt(getComputedStyle(element).left, 10);
            const startTop = parseInt(getComputedStyle(element).top, 10);
            
            const isShiftKeyPressed = e.shiftKey;
            const aspectRatio = startWidth / startHeight;
            
            function handleMouseMove(e) {
                let newWidth, newHeight, newLeft, newTop;
                
                switch(pos) {
                    case 'nw':
                        newWidth = startWidth - (e.clientX - startX);
                        newHeight = startHeight - (e.clientY - startY);
                        
                        if (isShiftKeyPressed || e.shiftKey) {
                            // アスペクト比を維持
                            if (newWidth / newHeight > aspectRatio) {
                                newWidth = newHeight * aspectRatio;
                            } else {
                                newHeight = newWidth / aspectRatio;
                            }
                        }
                        
                        element.style.width = `${newWidth}px`;
                        element.style.height = `${newHeight}px`;
                        element.style.left = `${startLeft + startWidth - newWidth}px`;
                        element.style.top = `${startTop + startHeight - newHeight}px`;
                        break;
                    case 'n':
                        newHeight = startHeight - (e.clientY - startY);
                        element.style.height = `${newHeight}px`;
                        element.style.top = `${startTop + startHeight - newHeight}px`;
                        break;
                    case 'ne':
                        newWidth = startWidth + (e.clientX - startX);
                        newHeight = startHeight - (e.clientY - startY);
                        
                        if (isShiftKeyPressed || e.shiftKey) {
                            // アスペクト比を維持
                            if (newWidth / newHeight > aspectRatio) {
                                newWidth = newHeight * aspectRatio;
                            } else {
                                newHeight = newWidth / aspectRatio;
                            }
                        }
                        
                        element.style.width = `${newWidth}px`;
                        element.style.height = `${newHeight}px`;
                        element.style.top = `${startTop + startHeight - newHeight}px`;
                        break;
                    case 'e':
                        newWidth = startWidth + (e.clientX - startX);
                        element.style.width = `${newWidth}px`;
                        break;
                    case 'se':
                        newWidth = startWidth + (e.clientX - startX);
                        newHeight = startHeight + (e.clientY - startY);
                        
                        if (isShiftKeyPressed || e.shiftKey) {
                            // アスペクト比を維持
                            if (newWidth / newHeight > aspectRatio) {
                                newWidth = newHeight * aspectRatio;
                            } else {
                                newHeight = newWidth / aspectRatio;
                            }
                        }
                        
                        element.style.width = `${newWidth}px`;
                        element.style.height = `${newHeight}px`;
                        break;
                    case 's':
                        newHeight = startHeight + (e.clientY - startY);
                        element.style.height = `${newHeight}px`;
                        break;
                    case 'sw':
                        newWidth = startWidth - (e.clientX - startX);
                        newHeight = startHeight + (e.clientY - startY);
                        
                        if (isShiftKeyPressed || e.shiftKey) {
                            // アスペクト比を維持
                            if (newWidth / newHeight > aspectRatio) {
                                newWidth = newHeight * aspectRatio;
                            } else {
                                newHeight = newWidth / aspectRatio;
                            }
                        }
                        
                        element.style.width = `${newWidth}px`;
                        element.style.height = `${newHeight}px`;
                        element.style.left = `${startLeft + startWidth - newWidth}px`;
                        break;
                    case 'w':
                        newWidth = startWidth - (e.clientX - startX);
                        element.style.width = `${newWidth}px`;
                        element.style.left = `${startLeft + startWidth - newWidth}px`;
                        break;
                }
            }
            
            function handleMouseUp() {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        element.appendChild(handle);
    });
}

/**
 * 要素をドラッグ可能にする
 */
function makeElementDraggable(element) {
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    
    element.addEventListener('mousedown', function(e) {
        // リサイズハンドル上のクリックを無視
        if (e.target.className.includes('resize-handle')) return;
        
        e.preventDefault();
        
        // フォーカスを設定（最前面に）
        const allDraggables = document.querySelectorAll('[data-type^="textbox-"], [data-type^="shape-"]');
        allDraggables.forEach(el => {
            el.style.zIndex = '100';
        });
        element.style.zIndex = '101';
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = parseInt(getComputedStyle(element).left, 10);
        const startTop = parseInt(getComputedStyle(element).top, 10);
        
        function handleMouseMove(e) {
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }
        
        function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    // 削除イベント（Deleteキー）
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Delete') {
            element.remove();
        }
    });
}

/**
 * 図形を描画する関数
 */
function drawShape(type) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 図形要素を作成
    const shape = document.createElement('div');
    shape.style.position = 'absolute';
    shape.style.left = '50px';
    shape.style.top = '50px';
    shape.style.border = '2px solid black';
    shape.style.backgroundColor = 'transparent';
    shape.style.zIndex = '100';
    shape.dataset.type = `shape-${type}`;
    
    switch(type) {
        case 'rect':
            shape.style.width = '100px';
            shape.style.height = '100px';
            break;
        case 'circle':
            shape.style.width = '100px';
            shape.style.height = '100px';
            shape.style.borderRadius = '50%';
            break;
        case 'ellipse':
            shape.style.width = '150px';
            shape.style.height = '100px';
            shape.style.borderRadius = '50%';
            break;
        case 'triangle':
            shape.style.width = '100px';
            shape.style.height = '100px';
            shape.style.backgroundColor = 'transparent';
            shape.style.border = 'none';
            shape.style.overflow = 'hidden';
            
            const triangleInner = document.createElement('div');
            triangleInner.style.width = '0';
            triangleInner.style.height = '0';
            triangleInner.style.borderLeft = '50px solid transparent';
            triangleInner.style.borderRight = '50px solid transparent';
            triangleInner.style.borderBottom = '100px solid black';
            triangleInner.style.position = 'absolute';
            triangleInner.style.top = '0';
            triangleInner.style.left = '0';
            
            shape.appendChild(triangleInner);
            break;
        case 'line':
            shape.style.width = '100px';
            shape.style.height = '2px';
            shape.style.backgroundColor = 'black';
            shape.style.border = 'none';
            break;
        case 'arrow':
            shape.style.position = 'relative';
            shape.style.width = '100px';
            shape.style.height = '2px';
            shape.style.backgroundColor = 'black';
            shape.style.border = 'none';
            
            const arrowHead = document.createElement('div');
            arrowHead.style.position = 'absolute';
            arrowHead.style.right = '-10px';
            arrowHead.style.top = '-5px';
            arrowHead.style.width = '0';
            arrowHead.style.height = '0';
            arrowHead.style.borderTop = '6px solid transparent';
            arrowHead.style.borderBottom = '6px solid transparent';
            arrowHead.style.borderLeft = '10px solid black';
            
            shape.appendChild(arrowHead);
            break;
        case 'bubble':
            shape.style.width = '150px';
            shape.style.height = '100px';
            shape.style.borderRadius = '20px';
            shape.style.position = 'relative';
            
            const bubble = document.createElement('div');
            bubble.style.position = 'absolute';
            bubble.style.bottom = '-20px';
            bubble.style.left = '20px';
            bubble.style.width = '0';
            bubble.style.height = '0';
            bubble.style.borderLeft = '10px solid transparent';
            bubble.style.borderRight = '10px solid transparent';
            bubble.style.borderTop = '20px solid black';
            
            shape.appendChild(bubble);
            break;
    }
    
    // リサイズハンドルを追加
    addResizeHandles(shape);
    
    // ドラッグ機能を追加
    makeElementDraggable(shape);
    
    // 図形を編集エリアに追加
    editArea.appendChild(shape);
    
    // イベント発火（変更を検知）
    editArea.dispatchEvent(new Event('input'));
}

/**
 * 全台本コンテンツをJSONオブジェクトに変換
 */
function scriptToJson() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return null;
    
    const title = document.getElementById('title').value || '';
    const version = parseInt(document.getElementById('version').value || 1, 10);
    const isFinal = document.getElementById('is_final').value === '1';
    
    // シーンごとにデータを収集
    const sceneElements = editArea.querySelectorAll('.script-scene');
    const scenes = [];
    
    sceneElements.forEach((sceneElem, sceneIndex) => {
        const hashiraElem = sceneElem.querySelector('.scriptarea-hashira');
        
        // シーン情報を取得
        const sceneId = hashiraElem ? hashiraElem.querySelector('.script-hashira-id').innerText : `${sceneIndex + 1}`.padStart(3, '0');
        const location = hashiraElem ? hashiraElem.querySelector('.script-hashira-location').innerText : '';
        const timeSetting = hashiraElem ? hashiraElem.querySelector('.script-hashira-time').innerText : '';
        const hiddenDescription = hashiraElem ? hashiraElem.querySelector('.scriptarea-hashira-hidden').innerText : '';
        
        // シーンのコンテンツ（ト書き、セリフなど）を取得
        const contentElems = sceneElem.querySelectorAll(':scope > .scriptarea-togaki, :scope > .scriptarea-serifu, :scope > .scriptarea-togaki-hidden, :scope > .scriptarea-serifu-hidden, :scope > .time-progress, :scope > .script-page-break');
        
        const content = [];
        contentElems.forEach(elem => {
            if (elem.classList.contains('scriptarea-togaki')) {
                content.push({
                    type: 'togaki',
                    text: elem.innerText
                });
            } else if (elem.classList.contains('scriptarea-togaki-hidden')) {
                content.push({
                    type: 'hidden_togaki',
                    text: elem.innerText
                });
            } else if (elem.classList.contains('scriptarea-serifu')) {
                const nameElem = elem.querySelector('.script-serifu-name');
                const contentElem = elem.querySelector('.script-serifu-content');
                
                content.push({
                    type: 'serifu',
                    character: nameElem ? nameElem.innerText.trim() : '',
                    text: contentElem ? contentElem.innerText : ''
                });
            } else if (elem.classList.contains('scriptarea-serifu-hidden')) {
                const nameElem = elem.querySelector('.script-serifu-name');
                const contentElem = elem.querySelector('.script-serifu-content');
                
                content.push({
                    type: 'hidden_serifu',
                    character: nameElem ? nameElem.innerText.trim() : '',
                    text: contentElem ? contentElem.innerText : ''
                });
            } else if (elem.classList.contains('time-progress')) {
                content.push({
                    type: 'time_progress'
                });
            } else if (elem.classList.contains('script-page-break')) {
                content.push({
                    type: 'page_break'
                });
            }
        });
        
        // 左サイドエリアのコンテンツ（画像、テキストボックスなど）
        const leftContent = sceneElem.querySelector('.scene-left');
        
        // テキストボックスと図形を含む
        const textboxes = sceneElem.querySelectorAll('[data-type^="textbox-"], [data-type^="shape-"]');
        const drawObjects = [];
        
        textboxes.forEach(box => {
            const style = box.style;
            const type = box.dataset.type;
            
            drawObjects.push({
                type: type,
                content: type.startsWith('textbox-') ? box.innerHTML : '',
                style: {
                    width: style.width,
                    height: style.height,
                    left: style.left,
                    top: style.top,
                    borderRadius: style.borderRadius,
                    backgroundColor: style.backgroundColor,
                    border: style.border,
                    zIndex: style.zIndex
                }
            });
        });
        
        // シーンデータを追加
        scenes.push({
            scene_id: sceneId,
            location: location,
            time_setting: timeSetting,
            hidden_description: hiddenDescription,
            content: content,
            draw_objects: drawObjects
        });
    });
    
    // 香盤情報を収集
    const koubanInfo = {};
    const koubanElements = editArea.querySelectorAll('[data-kouban-type]');
    
    koubanElements.forEach(elem => {
        const koubanType = elem.dataset.koubanType;
        const koubanDesc = elem.dataset.koubanDesc || '';
        const text = elem.innerText;
        
        if (!koubanInfo[koubanType]) {
            koubanInfo[koubanType] = [];
        }
        
        koubanInfo[koubanType].push({
            text: text,
            description: koubanDesc
        });
    });
    
    return {
        title: title,
        version: version,
        is_final: isFinal,
        scenes: scenes,
        kouban_info: koubanInfo,
        updated_at: new Date().toISOString()
    };
}

/**
 * 台本を保存（上書き保存）
 */
function saveScript(asNewVersion = false) {
    const form = document.getElementById('script-form');
    const scriptContent = document.getElementById('script_content');
    
    if (!form || !scriptContent) {
        console.error('フォーム要素が見つかりません');
        return;
    }
    
    // 台本データをJSON形式に変換
    const scriptData = scriptToJson();
    if (!scriptData) {
        alert('台本データの取得に失敗しました');
        return;
    }
    
    // JSONをフォームに設定
    scriptContent.value = JSON.stringify(scriptData);
    
    // バージョン保存フラグを設定
    if (asNewVersion) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'save_as_new_version';
        input.value = '1';
        form.appendChild(input);
    }
    
    // フォームを送信
    form.submit();
}

/**
 * 台本を香盤情報に反映
 */
function syncKouban() {
    const form = document.getElementById('script-form');
    const scriptContent = document.getElementById('script_content');
    
    if (!form || !scriptContent) {
        console.error('フォーム要素が見つかりません');
        return;
    }
    
    // 台本データをJSON形式に変換
    const scriptData = scriptToJson();
    if (!scriptData) {
        alert('台本データの取得に失敗しました');
        return;
    }
    
    // JSONをフォームに設定
    scriptContent.value = JSON.stringify(scriptData);
    
    // 香盤同期フラグを設定
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'sync_kouban';
    input.value = '1';
    form.appendChild(input);
    
    // フォームを送信
    form.submit();
}

/**
 * 台本をテキスト形式で保存
 */
function saveAsText() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    let textContent = '';
    const sceneElements = editArea.querySelectorAll('.script-scene');
    
    sceneElements.forEach(sceneElem => {
        // 柱情報
        const hashiraElem = sceneElem.querySelector('.scriptarea-hashira');
        if (hashiraElem) {
            const sceneId = hashiraElem.querySelector('.script-hashira-id').innerText;
            const location = hashiraElem.querySelector('.script-hashira-location').innerText;
            const timeSetting = hashiraElem.querySelector('.script-hashira-time').innerText;
            
            textContent += `${sceneId} ${location} ${timeSetting}\n`;
        }
        
        // シーンのコンテンツ（ト書き、セリフなど）
        const contentElems = sceneElem.querySelectorAll(':scope > .scriptarea-togaki, :scope > .scriptarea-serifu, :scope > .scriptarea-togaki-hidden, :scope > .scriptarea-serifu-hidden, :scope > .time-progress, :scope > .script-page-break');
        
        contentElems.forEach(elem => {
            if (elem.classList.contains('scriptarea-togaki')) {
                textContent += `\t\t${elem.innerText}\n`;
            } else if (elem.classList.contains('scriptarea-togaki-hidden')) {
                textContent += `\t\t【隠れト書き】${elem.innerText}\n`;
            } else if (elem.classList.contains('scriptarea-serifu')) {
                const nameElem = elem.querySelector('.script-serifu-name');
                const contentElem = elem.querySelector('.script-serifu-content');
                
                const name = nameElem ? nameElem.innerText.trim() : '';
                const content = contentElem ? contentElem.innerText : '';
                
                textContent += `\t${name}　${content}\n`;
            } else if (elem.classList.contains('scriptarea-serifu-hidden')) {
                const nameElem = elem.querySelector('.script-serifu-name');
                const contentElem = elem.querySelector('.script-serifu-content');
                
                const name = nameElem ? nameElem.innerText.trim() : '';
                const content = contentElem ? contentElem.innerText : '';
                
                textContent += `\t【隠れセリフ】${name}　${content}\n`;
            } else if (elem.classList.contains('time-progress')) {
                textContent += `\t\t　　×　　×　　×\n`;
            } else if (elem.classList.contains('script-page-break')) {
                textContent += `\t\t＝＝＝＝＝ページ区切り＝＝＝＝＝\n`;
            }
        });
        
        // シーン間の区切り
        textContent += '\n';
    });
    
    // タイトルを取得
    const title = document.getElementById('title').value || '台本';
    
    // Blobを作成してダウンロード
    const blob = new Blob([textContent], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * 台本をPDF形式で保存
 */
function saveAsPDF() {
    alert('PDFエクスポート機能は現在実装中です。テキスト保存をご利用ください。');
    // TODO: jsPDFを使用したPDF出力機能の実装
}

/**
 * バージョン一覧を取得・表示
 */
function loadVersions() {
    const modal = document.getElementById('version-select-modal');
    const versionList = document.getElementById('version-list');
    
    if (!modal || !versionList) return;
    
    // 作品IDとスクリプトIDを取得
    const workId = document.querySelector('input[name="work_id"]').value;
    const scriptId = document.querySelector('input[name="script_id"]').value;
    
    // バージョン一覧を取得
    fetch(`get_versions.php?work_id=${workId}&script_id=${scriptId}`)
        .then(response => response.json())
        .then(data => {
            versionList.innerHTML = '';
            
            if (data.error) {
                versionList.innerHTML = `<div class="error">${data.error}</div>`;
                return;
            }
            
            if (data.length === 0) {
                versionList.innerHTML = '<div class="no-versions">バージョンがありません</div>';
                return;
            }
            
            // バージョン一覧を表示
            data.forEach(version => {
                const item = document.createElement('div');
                item.className = 'version-item';
                
                // バージョン名
                const versionName = version.is_final == 1 ? '完成稿' : `第${version.version}稿`;
                
                // 日付をフォーマット
                const createdDate = new Date(version.created_at);
                const formattedDate = `${createdDate.getFullYear()}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}/${createdDate.getDate().toString().padStart(2, '0')} ${createdDate.getHours().toString().padStart(2, '0')}:${createdDate.getMinutes().toString().padStart(2, '0')}`;
                
                item.innerHTML = `
                    <div class="version-title">${versionName}</div>
                    <div class="version-date">${formattedDate}</div>
                `;
                
                // クリックイベント
                item.addEventListener('click', () => {
                    window.location.href = `index-edit.php?id=${scriptId}&version=${version.version}`;
                });
                
                versionList.appendChild(item);
            });
            
            // モーダルを表示
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            versionList.innerHTML = '<div class="error">バージョン情報の取得に失敗しました</div>';
        });
}

/**
 * バージョンを削除
 */
function deleteVersion() {
    if (!confirm('現在のバージョンを削除しますか？この操作は元に戻せません。')) {
        return;
    }
    
    // TODO: 削除処理の実装
    alert('バージョン削除機能は現在実装中です');
}

/**
 * すべてのバージョンを削除
 */
function deleteAllVersions() {
    if (!confirm('この台本のすべてのバージョンを削除しますか？この操作は元に戻せません。')) {
        return;
    }
    
    // TODO: 削除処理の実装
    alert('すべてのバージョン削除機能は現在実装中です');
}

/**
 * 編集を終了して閲覧モードに戻る
 */
function exitEdit() {
    // 未保存の変更がある場合は確認
    if (hasUnsavedChanges) {
        if (!confirm('未保存の変更があります。保存せずに終了しますか？')) {
            return;
        }
    }
    
    // 閲覧モードに戻る
    window.location.href = 'index.php';
}

/**
 * 決定稿に指定
 */
function setFinal() {
    if (!confirm('現在のバージョンを決定稿に指定しますか？')) {
        return;
    }
    
    // 決定稿フラグをセット
    document.getElementById('is_final').value = '1';
    
    // 保存
    saveScript();
}

/**
 * 文字数カウント
 */
function countChars() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // テキストコンテンツを取得
    const text = editArea.innerText;
    
    // カウント結果
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // 段落数（ト書きとセリフの数）
    const paragraphCount = editArea.querySelectorAll('.scriptarea-togaki, .scriptarea-serifu').length;
    
    // シーン数
    const sceneCount = editArea.querySelectorAll('.script-scene').length;
    
    // カット数（カット割りの数+1）
    const cutMarkCount = editArea.querySelectorAll('.cut-wari').length;
    const cutCount = cutMarkCount + sceneCount; // 各シーンを1カットとしてカウント
    
    // 結果を表示
    alert(`文字数: ${charCount}\n単語数: ${wordCount}\n段落数: ${paragraphCount}\nシーン数: ${sceneCount}\nカット数: ${cutCount}`);
}

/**
 * 香盤情報を表示/非表示
 */
function toggleKoubanDisplay() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 表示状態を取得
    const koubanDisplay = document.querySelector('.view-toggle[data-view="kouban"]');
    const isHidden = koubanDisplay && koubanDisplay.dataset.state === 'hidden';
    
    // 表示状態を切り替え
    if (koubanDisplay) {
        if (isHidden) {
            koubanDisplay.dataset.state = 'visible';
            koubanDisplay.textContent = '香盤情報 非表示';
        } else {
            koubanDisplay.dataset.state = 'hidden';
            koubanDisplay.textContent = '香盤情報 表示';
        }
    }
    
    // 香盤情報要素のクラスを切り替え
    const koubanElements = editArea.querySelectorAll('[data-kouban-type]');
    
    koubanElements.forEach(elem => {
        const type = elem.dataset.koubanType;
        
        if (isHidden) {
            // 表示
            elem.classList.add(`kouban-${type}`);
        } else {
            // 非表示
            elem.classList.remove(`kouban-${type}`);
        }
    });
}

/**
 * 香盤情報を登録
 */
function registerKouban(type) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        alert('テキストが選択されていません');
        return;
    }
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (selectedText === '') {
        alert('テキストが選択されていません');
        return;
    }
    
    // 香盤情報登録ダイアログを表示
    const modal = document.getElementById('kouban-select-modal');
    const koubanType = document.getElementById('kouban-type');
    const koubanDesc = document.getElementById('kouban-desc');
    const applyBtn = document.getElementById('apply-kouban-btn');
    
    if (!modal || !koubanType || !koubanDesc || !applyBtn) {
        alert('香盤情報登録ダイアログが見つかりません');
        return;
    }
    
    // 選択された香盤タイプを設定
    koubanType.value = type;
    koubanDesc.value = '';
    
    // 適用ボタンのイベント
    const applyHandler = function() {
        const selectedType = koubanType.value;
        const description = koubanDesc.value;
        
        // 選択テキストに香盤情報を設定
        const span = document.createElement('span');
        span.dataset.koubanType = selectedType;
        span.dataset.koubanDesc = description;
        span.className = `kouban-${selectedType}`;
        span.textContent = selectedText;
        
        // 選択範囲を香盤情報で置き換え
        range.deleteContents();
        range.insertNode(span);
        
        // モーダルを閉じる
        modal.style.display = 'none';
        
        // イベントリスナーを削除
        applyBtn.removeEventListener('click', applyHandler);
    };
    
    // 適用ボタンにイベントを設定
    applyBtn.addEventListener('click', applyHandler);
    
    // モーダルを表示
    modal.style.display = 'block';
}

/**
 * 指定した要素の表示/非表示を切り替える
 */
function toggleElementDisplay(selector, displayState) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(elem => {
        if (displayState === 'visible') {
            elem.style.display = '';
        } else {
            elem.style.display = 'none';
        }
    });
}

/**
 * 表示メニューの状態を切り替える
 */
function toggleViewMenu(viewName, button) {
    const state = button.dataset.state;
    const newState = state === 'hidden' ? 'visible' : 'hidden';
    
    button.dataset.state = newState;
    
    // ボタンテキストを更新
    const text = button.textContent.replace(' 表示', '').replace(' 非表示', '');
    button.textContent = text + (newState === 'hidden' ? ' 表示' : ' 非表示');
    
    // 要素の表示/非表示を切り替え
    switch (viewName) {
        case 'hiddenHashira':
            toggleElementDisplay('.scriptarea-hashira-hidden', newState);
            break;
        case 'hiddenTogaki':
            toggleElementDisplay('.scriptarea-togaki-hidden', newState);
            break;
        case 'hiddenChar':
            toggleElementDisplay('.scriptarea-serifu-hidden', newState);
            break;
        case 'editMark':
            // 編集記号の表示/非表示
            // TODO: 実装
            break;
        case 'pageBreak':
            toggleElementDisplay('.script-page-break', newState);
            break;
        case 'structure':
            // 柱・ト書き・セリフの背景色表示
            const elements = document.querySelectorAll('.scriptarea-hashira, .scriptarea-togaki, .scriptarea-serifu');
            elements.forEach(elem => {
                if (newState === 'visible') {
                    elem.classList.add('structure-highlight');
                } else {
                    elem.classList.remove('structure-highlight');
                }
            });
            break;
        case 'kouban':
            // 香盤情報表示
            toggleKoubanDisplay();
            break;
        case 'cut':
            // カット割り表示
            toggleElementDisplay('.cut-wari', newState);
            break;
        case 'lineNumber':
            // 行番号表示
            const lineNumbers = document.getElementById('scriptLineNumbersContinuous');
            if (lineNumbers) {
                lineNumbers.style.display = newState === 'visible' ? 'block' : 'none';
            }
            break;
        case 'bookmark':
            // しおり表示
            toggleElementDisplay('.script-bookmark', newState);
            break;
        case 'verticalMode':
            // 縦書きモード
            const editArea = document.getElementById('scriptEditArea');
            if (editArea) {
                if (newState === 'vertical') {
                    editArea.classList.add('vertical-mode');
                    button.textContent = '横書きモード';
                    button.dataset.state = 'vertical';
                } else {
                    editArea.classList.remove('vertical-mode');
                    button.textContent = '縦書きモード';
                    button.dataset.state = 'horizontal';
                }
            }
            break;
    }
}

/**
 * 台本の初期化・新規作成
 */
function newScript() {
    if (hasUnsavedChanges) {
        if (!confirm('未保存の変更があります。保存せずに新規作成しますか？')) {
            return;
        }
    }
    
    // 閲覧モードに移動してから新規作成
    window.location.href = 'index-edit.php?t=' + new Date().getTime();
}

/**
 * 禁止用語・注意用語チェック
 */
function checkProhibitedWords() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // テキストコンテンツを取得
    const text = editArea.innerText;
    
    // 禁止用語リスト（例）
    const prohibitedWords = [
        'キチガイ', 'バカ', 'アホ', 'マヌケ', 'クソ', 'バカヤロウ', 'クソヤロウ',
        '障害者', '白痴', '知恵遅れ', 'めくら', 'つんぼ', 'おし', 'きちがい',
        '土人', '黒んぼ', 'チャンコロ', 'ジャップ', 'シナ人'
    ];
    
    // 注意用語リスト（例）
    const cautionWords = [
        '気違い', '馬鹿', '阿呆', '間抜け', '糞', '馬鹿野郎', '糞野郎',
        '障碍者', '盲', '聾', '唖', '知的障害', '精神障害',
        '土民', '黒人', '中国人', '日本人', '支那'
    ];
    
    // 禁止用語をチェック
    const foundProhibited = [];
    prohibitedWords.forEach(word => {
        if (text.includes(word)) {
            foundProhibited.push(word);
        }
    });
    
    // 注意用語をチェック
    const foundCaution = [];
    cautionWords.forEach(word => {
        if (text.includes(word)) {
            foundCaution.push(word);
        }
    });
    
    // 結果を表示
    let message = '';
    
    if (foundProhibited.length > 0) {
        message += '【禁止用語】\n' + foundProhibited.join(', ') + '\n\n';
    }
    
    if (foundCaution.length > 0) {
        message += '【注意用語】\n' + foundCaution.join(', ') + '\n\n';
    }
    
    if (message === '') {
        message = '禁止用語・注意用語は見つかりませんでした。';
    } else {
        message = '以下の禁止用語・注意用語が見つかりました：\n\n' + message;
        message += '放送・配信などのメディアで使用する場合は修正を検討してください。';
    }
    
    alert(message);
}

/**
 * スペルチェックと文章校正
 */
function checkSpelling() {
    // スペルチェック機能はブラウザの標準機能を使用
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('backColor', false, 'yellow');
    
    alert('簡易的なスペルチェックを実行しました。黄色でハイライトされた部分が誤字の可能性があります。');
}

/**
 * 編集記号を挿入
 */
function insertEditMark(mark) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 編集記号要素を作成
    const markElem = document.createElement('span');
    markElem.className = 'edit-mark';
    markElem.style.fontStyle = 'italic';
    markElem.style.fontSize = '0.8rem';
    markElem.style.color = 'gray';
    markElem.textContent = mark;
    
    // 編集記号を挿入
    range.deleteContents();
    range.insertNode(markElem);
    
    // カーソルを要素の後ろに移動
    range.setStartAfter(markElem);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // イベント発火（変更を検知）
    editArea.dispatchEvent(new Event('input'));
}

/**
 * 時間経過マークを挿入
 */
function insertTimeProgress() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 時間経過要素を作成
    const timeProgressElem = document.createElement('div');
    timeProgressElem.className = 'scriptarea-togaki time-progress';
    timeProgressElem.contentEditable = 'true';
    timeProgressElem.textContent = '　　×　　×　　×';
    
    // 現在の位置に挿入
    let currentNode = range.startContainer;
    
    // 適切な挿入位置を見つける（段落かシーンの末尾）
    while (currentNode && !currentNode.classList || !currentNode.classList.contains('script-scene')) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // シーン要素の最後に追加
        currentNode.appendChild(timeProgressElem);
        
        // カーソルを新しい要素の後に移動
        range.setStartAfter(timeProgressElem);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // イベント発火（変更を検知）
        editArea.dispatchEvent(new Event('input'));
    }
}

/**
 * ページ区切りを挿入
 */
function insertPageBreak() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // ページ区切り要素を作成
    const pageBreakElem = document.createElement('div');
    pageBreakElem.className = 'script-page-break';
    pageBreakElem.style.display = 'none'; // 初期状態では非表示
    pageBreakElem.textContent = '＝＝＝＝＝ページ区切り＝＝＝＝＝';
    
    // 現在の位置に挿入
    let currentNode = range.startContainer;
    
    // 適切な挿入位置を見つける（段落かシーンの末尾）
    while (currentNode && !currentNode.classList || !currentNode.classList.contains('script-scene')) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // シーン要素の最後に追加
        currentNode.appendChild(pageBreakElem);
        
        // カーソルを新しい要素の後に移動
        range.setStartAfter(pageBreakElem);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // イベント発火（変更を検知）
        editArea.dispatchEvent(new Event('input'));
    }
}

/**
 * リンクを挿入
 */
function insertLink() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // リンク先URLを取得
    const url = prompt('リンク先URLを入力してください:', 'https://');
    if (!url) return;
    
    // リンク要素を作成
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.textContent = selectedText || url;
    
    // リンクを挿入
    range.deleteContents();
    range.insertNode(link);
    
    // カーソルをリンクの後ろに移動
    range.setStartAfter(link);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * ルビを追加
 */
function addRuby() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) {
        alert('ルビを付けるテキストを選択してください');
        return;
    }
    
    // ルビテキストを取得
    const rubyText = prompt('ルビを入力してください:', '');
    if (rubyText === null) return; // キャンセル時
    
    // Ruby要素を作成
    const ruby = document.createElement('ruby');
    ruby.textContent = selectedText;
    
    const rt = document.createElement('rt');
    rt.textContent = rubyText;
    
    ruby.appendChild(rt);
    
    // ルビを挿入
    range.deleteContents();
    range.insertNode(ruby);
    
    // カーソルをルビの後ろに移動
    range.setStartAfter(ruby);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * セリフを連結（同時セリフ）
 */
function joinSerifu() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 選択範囲内のセリフ要素を取得
    const container = range.commonAncestorContainer;
    const serifuItems = container.querySelectorAll('.scriptarea-serifu');
    
    if (serifuItems.length < 2) {
        alert('連結するには2つ以上のセリフを選択してください');
        return;
    }
    
    // 新しい連結セリフ要素を作成
    const joinedSerifu = document.createElement('div');
    joinedSerifu.className = 'scriptarea-serifu joined-serifu';
    
    // セリフ要素を2列に配置
    joinedSerifu.style.display = 'flex';
    joinedSerifu.style.gap = '20px';
    
    // 選択されたセリフを連結
    serifuItems.forEach(serifu => {
        const clone = serifu.cloneNode(true);
        joinedSerifu.appendChild(clone);
        serifu.remove();
    });
    
    // 連結セリフを挿入
    const parent = range.startContainer.parentElement;
    while (parent && !parent.classList.contains('script-scene')) {
        parent = parent.parentElement;
    }
    
    if (parent) {
        parent.appendChild(joinedSerifu);
    }
}

/**
 * 特殊文字を挿入
 */
function insertSpecialChar(char) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // テキストノードを作成して挿入
    const textNode = document.createTextNode(char);
    range.deleteContents();
    range.insertNode(textNode);
    
    // カーソルを文字の後ろに移動
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

// 省略記号の挿入
function insertEllipsis() {
    insertSpecialChar('…');
}

// 長音記号の挿入
function insertDash() {
    insertSpecialChar('―');
}

/**
 * 検索機能
 */
function searchText(text, isCaseSensitive = false, isWholeWord = false) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea || !text) return null;
    
    // 検索オプション
    const options = {
        caseSensitive: isCaseSensitive,
        wholeWord: isWholeWord
    };
    
    // テキストを検索
    const range = new Range();
    const allText = editArea.textContent;
    
    // 大文字・小文字を区別しない場合
    let searchText = text;
    let fullText = allText;
    
    if (!options.caseSensitive) {
        searchText = text.toLowerCase();
        fullText = allText.toLowerCase();
    }
    
    // 検索開始位置
    let startPos = editArea.textContent.length;
    
    // 現在のカーソル位置があれば、その後ろから検索
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0);
        if (currentRange.startContainer === editArea || editArea.contains(currentRange.startContainer)) {
            startPos = currentRange.startOffset;
        }
    }
    
    // テキスト内の次の検索位置を探す
    const nextPos = fullText.indexOf(searchText, startPos);
    
    if (nextPos === -1) {
        // 見つからなかった場合は先頭から再検索
        const firstPos = fullText.indexOf(searchText);
        
        if (firstPos === -1) {
            return null; // テキストが見つからない
        }
        
        // 先頭から見つかった場合
        range.setStart(editArea, firstPos);
        range.setEnd(editArea, firstPos + searchText.length);
        
        return range;
    }
    
    // 見つかった場合
    range.setStart(editArea, nextPos);
    range.setEnd(editArea, nextPos + searchText.length);
    
    return range;
}

/**
 * すべての検索結果をハイライト
 */
function highlightAllMatches(text, isCaseSensitive = false, isWholeWord = false) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea || !text) return;
    
    // 以前のハイライトをクリア
    clearHighlights();
    
    // 検索オプション
    const options = {
        caseSensitive: isCaseSensitive,
        wholeWord: isWholeWord
    };
    
    // テキストを検索
    const allText = editArea.innerHTML;
    
    // 大文字・小文字を区別しない場合
    let searchText = text;
    
    if (!options.caseSensitive) {
        // 正規表現で大文字小文字を区別せずに検索
        const regex = new RegExp(escapeRegExp(searchText), 'gi');
        const highlighted = allText.replace(regex, match => `<span class="search-highlight">${match}</span>`);
        editArea.innerHTML = highlighted;
    } else {
        // 大文字小文字を区別して検索
        const regex = new RegExp(escapeRegExp(searchText), 'g');
        const highlighted = allText.replace(regex, match => `<span class="search-highlight">${match}</span>`);
        editArea.innerHTML = highlighted;
    }
}

/**
 * 正規表現用のエスケープ
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\        // 大文字');
}

/**
 * ハイライトをクリア
 */
function clearHighlights() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    const highlights = editArea.querySelectorAll('.search-highlight');
    
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        const text = document.createTextNode(highlight.textContent);
        parent.replaceChild(text, highlight);
    });
}

/**
 * テキスト置換
 */
function replaceText(searchText, replaceText, replaceAll = false, isCaseSensitive = false, isWholeWord = false) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea || !searchText) return;
    
    // 検索オプション
    const options = {
        caseSensitive: isCaseSensitive,
        wholeWord: isWholeWord
    };
    
    if (replaceAll) {
        // すべて置換
        const allText = editArea.innerHTML;
        let regex;
        
        if (options.caseSensitive) {
            regex = new RegExp(escapeRegExp(searchText), 'g');
        } else {
            regex = new RegExp(escapeRegExp(searchText), 'gi');
        }
        
        const replaced = allText.replace(regex, replaceText);
        editArea.innerHTML = replaced;
    } else {
        // 現在の選択範囲を置換
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        // 選択されたテキストが検索テキストと一致するか確認
        if (
            (options.caseSensitive && selectedText === searchText) ||
            (!options.caseSensitive && selectedText.toLowerCase() === searchText.toLowerCase())
        ) {
            range.deleteContents();
            range.insertNode(document.createTextNode(replaceText));
            
            // 次の検索結果を見つける
            const nextMatch = searchText(searchText, options.caseSensitive, options.wholeWord);
            if (nextMatch) {
                selection.removeAllRanges();
                selection.addRange(nextMatch);
            }
        } else {
            // 最初の検索結果を見つける
            const firstMatch = searchText(searchText, options.caseSensitive, options.wholeWord);
            if (firstMatch) {
                selection.removeAllRanges();
                selection.addRange(firstMatch);
            }
        }
    }
}

/**
 * 検索ボックスを表示
 */
function showSearchBox() {
    // 既存の検索ボックスがあれば削除
    const existingSearchBox = document.getElementById('script-search-box');
    if (existingSearchBox) {
        existingSearchBox.remove();
    }
    
    // 検索ボックスを作成
    const searchBox = document.createElement('div');
    searchBox.id = 'script-search-box';
    searchBox.className = 'script-search-box';
    searchBox.style.position = 'absolute';
    searchBox.style.top = '80px';
    searchBox.style.right = '10px';
    searchBox.style.backgroundColor = '#f0f0f0';
    searchBox.style.padding = '10px';
    searchBox.style.border = '1px solid #ccc';
    searchBox.style.borderRadius = '4px';
    searchBox.style.zIndex = '1000';
    
    searchBox.innerHTML = `
        <div style="display: flex; margin-bottom: 5px;">
            <input type="text" id="search-input" placeholder="検索..." style="flex: 1; margin-right: 5px; padding: 5px;">
            <button id="search-button" style="padding: 5px 10px;">検索</button>
        </div>
        <label style="display: block; margin-top: 5px;">
            <input type="checkbox" id="case-sensitive"> 大文字/小文字を区別
        </label>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <button id="search-prev" style="padding: 3px 8px;">前へ</button>
            <button id="search-next" style="padding: 3px 8px;">次へ</button>
            <button id="search-highlight-all" style="padding: 3px 8px;">すべて強調</button>
            <button id="search-close" style="padding: 3px 8px;">閉じる</button>
        </div>
    `;
    
    // 検索ボックスを追加
    document.body.appendChild(searchBox);
    
    // 検索入力フィールドにフォーカス
    const searchInput = document.getElementById('search-input');
    searchInput.focus();
    
    // イベントリスナーを設定
    document.getElementById('search-button').addEventListener('click', function() {
        const searchText = searchInput.value;
        const isCaseSensitive = document.getElementById('case-sensitive').checked;
        
        // 検索を実行
        const match = searchText(searchText, isCaseSensitive);
        if (match) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(match);
            match.startContainer.parentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else {
            alert('検索テキストが見つかりませんでした');
        }
    });
    
    document.getElementById('search-highlight-all').addEventListener('click', function() {
        const searchText = searchInput.value;
        const isCaseSensitive = document.getElementById('case-sensitive').checked;
        
        // すべての一致をハイライト
        highlightAllMatches(searchText, isCaseSensitive);
    });
    
    document.getElementById('search-close').addEventListener('click', function() {
        // ハイライトをクリア
        clearHighlights();
        // 検索ボックスを閉じる
        searchBox.remove();
    });
    
    // エンターキーで検索
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('search-button').click();
        }
    });
}

/**
 * 置換ダイアログを表示
 */
function showReplaceDialog() {
    // 既存の置換ダイアログがあれば削除
    const existingDialog = document.getElementById('script-replace-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // 置換ダイアログを作成
    const dialog = document.createElement('div');
    dialog.id = 'script-replace-dialog';
    dialog.className = 'script-replace-dialog';
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = '#f0f0f0';
    dialog.style.padding = '20px';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '4px';
    dialog.style.zIndex = '2000';
    dialog.style.minWidth = '400px';
    dialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    
    dialog.innerHTML = `
        <h4 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;">テキスト置換</h4>
        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">検索テキスト:</label>
            <input type="text" id="search-text" style="width: 100%; padding: 5px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">置換テキスト:</label>
            <input type="text" id="replace-text" style="width: 100%; padding: 5px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" id="case-sensitive-replace"> 大文字/小文字を区別
            </label>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <button id="replace-button" style="padding: 8px 12px;">個別置換</button>
            <button id="replace-all-button" style="padding: 8px 12px;">まとめて置換</button>
            <button id="replace-cancel" style="padding: 8px 12px;">キャンセル</button>
        </div>
    `;
    
    // ダイアログをドキュメントに追加
    document.body.appendChild(dialog);
    
    // 検索テキスト入力フィールドにフォーカス
    document.getElementById('search-text').focus();
    
    // イベントリスナーを設定
    document.getElementById('replace-button').addEventListener('click', function() {
        const searchText = document.getElementById('search-text').value;
        const replaceText = document.getElementById('replace-text').value;
        const isCaseSensitive = document.getElementById('case-sensitive-replace').checked;
        
        // 個別置換を実行
        replaceText(searchText, replaceText, false, isCaseSensitive);
    });
    
    document.getElementById('replace-all-button').addEventListener('click', function() {
        const searchText = document.getElementById('search-text').value;
        const replaceText = document.getElementById('replace-text').value;
        const isCaseSensitive = document.getElementById('case-sensitive-replace').checked;
        
        // すべて置換を実行
        replaceText(searchText, replaceText, true, isCaseSensitive);
        
        // 置換完了メッセージ
        alert('置換が完了しました');
    });
    
    document.getElementById('replace-cancel').addEventListener('click', function() {
        // ダイアログを閉じる
        dialog.remove();
    });
    
    // 背景クリックでダイアログを閉じる
    document.addEventListener('click', function(event) {
        if (!dialog.contains(event.target) && event.target !== dialog) {
            dialog.remove();
        }
    });
}

/**
 * モーダルを閉じる
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * DOM読み込み完了時の処理
 */
document.addEventListener('DOMContentLoaded', function() {
    // エディタ要素
    const editArea = document.getElementById('scriptEditArea');
    const sidebarSceneList = document.getElementById('script-scene-list');
    
    // ツールバーボタン
    const toolbarSaveBtn = document.getElementById('toolbarSaveBtn');
    const toolHashira = document.getElementById('toolHashira');
    const toolTogaki = document.getElementById('toolTogaki');
    const toolSerifu = document.getElementById('toolSerifu');
    const toolUndo = document.getElementById('toolUndo');
    const toolRedo = document.getElementById('toolRedo');
    
    // フォーマットボタン
    const toolBold = document.getElementById('toolBold');
    const toolItalic = document.getElementById('toolItalic');
    const toolUnderline = document.getElementById('toolUnderline');
    const toolStrike = document.getElementById('toolStrike');
    const toolSubscript = document.getElementById('toolSubscript');
    const toolSuperscript = document.getElementById('toolSuperscript');
    const toolBox = document.getElementById('toolBox');
    const toolColor = document.getElementById('toolColor');
    const toolHighlight = document.getElementById('toolHighlight');
    const toolPattern = document.getElementById('toolPattern');
    
    // テキスト操作ボタン
    const toolRuby = document.getElementById('toolRuby');
    const toolLink = document.getElementById('toolLink');
    const toolFontSmall = document.getElementById('toolFontSmall');
    const toolFontMedium = document.getElementById('toolFontMedium');
    const toolFontLarge = document.getElementById('toolFontLarge');
    
    // 配置ボタン
    const toolAlignLeft = document.getElementById('toolAlignLeft');
    const toolAlignCenter = document.getElementById('toolAlignCenter');
    const toolAlignRight = document.getElementById('toolAlignRight');
    const toolAlignJustify = document.getElementById('toolAlignJustify');
    
    // 特殊文字ボタン
    const toolEllipsis = document.getElementById('toolEllipsis');
    const toolDash = document.getElementById('toolDash');
    
    // リストボタン
    const toolBulletList = document.getElementById('toolBulletList');
    const toolNumberList = document.getElementById('toolNumberList');
    const toolJoinSerifu = document.getElementById('toolJoinSerifu');
    
    // 画像操作ボタン
    const toolImage = document.getElementById('toolImage');
    
    // メニューボタン
    const menuNewFile = document.getElementById('menuNewFile');
    const menuOpenVersion = document.getElementById('menuOpenVersion');
    const menuDeleteVersion = document.getElementById('menuDeleteVersion');
    const menuDeleteAll = document.getElementById('menuDeleteAll');
    const menuExitEdit = document.getElementById('menuExitEdit');
    
    const menuSaveOverwrite = document.getElementById('menuSaveOverwrite');
    const menuSaveVersion = document.getElementById('menuSaveVersion');
    const menuSetFinal = document.getElementById('menuSetFinal');
    const menuSyncKouban = document.getElementById('menuSyncKouban');
    const menuSaveText = document.getElementById('menuSaveText');
    const menuSavePDF = document.getElementById('menuSavePDF');
    
    const menuInsertHashira = document.getElementById('menuInsertHashira');
    const menuInsertHiddenHashira = document.getElementById('menuInsertHiddenHashira');
    const menuInsertTogaki = document.getElementById('menuInsertTogaki');
    const menuInsertHiddenTogaki = document.getElementById('menuInsertHiddenTogaki');
    const menuInsertHiddenChar = document.getElementById('menuInsertHiddenChar');
    const menuInsertSerifu = document.getElementById('menuInsertSerifu');
    
    const menuInsertImage = document.getElementById('menuInsertImage');
    const menuInsertPageBreak = document.getElementById('menuInsertPageBreak');
    const menuInsertLink = document.getElementById('menuInsertLink');
    const menuInsertTextboxV = document.getElementById('menuInsertTextboxV');
    const menuInsertTextboxH = document.getElementById('menuInsertTextboxH');
    const menuInsertCut = document.getElementById('menuInsertCut');
    
    // 香盤登録メニュー
    const menuKoubanAll = document.getElementById('menuKoubanAll');
    const menuKoubanChar = document.getElementById('menuKoubanChar');
    const menuKoubanProp = document.getElementById('menuKoubanProp');
    const menuKoubanDevice = document.getElementById('menuKoubanDevice');
    const menuKoubanCostume = document.getElementById('menuKoubanCostume');
    const menuKoubanMakeup = document.getElementById('menuKoubanMakeup');
    const menuKoubanEffect = document.getElementById('menuKoubanEffect');
    const menuKoubanPlace1 = document.getElementById('menuKoubanPlace1');
    const menuKoubanPlace2 = document.getElementById('menuKoubanPlace2');
    const menuKoubanPlace3 = document.getElementById('menuKoubanPlace3');
    const menuKoubanTime = document.getElementById('menuKoubanTime');
    const menuKoubanOther = document.getElementById('menuKoubanOther');
    
    // 描画メニュー
    const menuDrawRect = document.getElementById('menuDrawRect');
    const menuDrawCircle = document.getElementById('menuDrawCircle');
    const menuDrawEllipse = document.getElementById('menuDrawEllipse');
    const menuDrawTriangle = document.getElementById('menuDrawTriangle');
    const menuDrawLine = document.getElementById('menuDrawLine');
    const menuDrawArrow = document.getElementById('menuDrawArrow');
    const menuDrawBubble = document.getElementById('menuDrawBubble');
    
    // 表示メニュー
    const viewToggleButtons = document.querySelectorAll('.view-toggle');
    
    // 校閲メニュー
    const menuCheckSpelling = document.getElementById('menuCheckSpelling');
    const menuCountChars = document.getElementById('menuCountChars');
    const menuCheckProhibited = document.getElementById('menuCheckProhibited');
    
    // モーダルの閉じるボタン
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // 変更フラグ
    let hasUnsavedChanges = false;
    
    // 検索・置換ボタンをツールバーに追加
    if (document.querySelector('.script-toolbar')) {
        const toolbarDiv = document.querySelector('.script-toolbar');
        const searchReplaceContainer = document.createElement('div');
        searchReplaceContainer.style.display = 'flex';
        searchReplaceContainer.style.marginLeft = 'auto';
        searchReplaceContainer.style.alignItems = 'center';
        
        // 検索ボックス
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '検索...';
        searchInput.style.padding = '5px';
        searchInput.style.marginRight = '5px';
        searchInput.style.width = '120px';
        searchInput.id = 'toolbar-search-input';
        
        // 検索ボタン
        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.className = 'script-tool-btn';
        searchButton.title = '検索';
        searchButton.innerHTML = '<i class="fa-solid fa-search"></i>';
        
        // 置換ボタン
        const replaceButton = document.createElement('button');
        replaceButton.type = 'button';
        replaceButton.className = 'script-tool-btn';
        replaceButton.title = '置換';
        replaceButton.innerHTML = '<i class="fa-solid fa-exchange-alt"></i>';
        
        // ボタンイベント
        searchButton.addEventListener('click', function() {
            showSearchBox();
        });
        
        replaceButton.addEventListener('click', function() {
            showReplaceDialog();
        });
        
        // 検索フィールドでEnterキーを押したときの処理
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchText = searchInput.value;
                const match = searchText(searchText, false);
                if (match) {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(match);
                    match.startContainer.parentElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
        
        // 要素を追加
        searchReplaceContainer.appendChild(searchInput);
        searchReplaceContainer.appendChild(searchButton);
        searchReplaceContainer.appendChild(replaceButton);
        
        toolbarDiv.appendChild(searchReplaceContainer);
    }
    
    // 編集領域の変更を検知
    if (editArea) {
        editArea.addEventListener('input', function() {
            hasUnsavedChanges = true;
        });
    }
    
    // キー操作の処理
    document.addEventListener('keydown', function(e) {
        // Ctrl+S で保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveScript();
        }
        
        // Ctrl+Shift+S でバージョン保存
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            saveScript(true);
        }
        
        // Ctrl+H で柱挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            insertHashira();
        }
        
        // Ctrl+T でト書き挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            insertTogaki();
        }
        
        // Ctrl+L でセリフ挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            insertSerifu();
        }
    });
    
    // ツールバーボタンのイベント設定
    if (toolbarSaveBtn) toolbarSaveBtn.addEventListener('click', saveScript);
    if (toolHashira) toolHashira.addEventListener('click', insertHashira);
    if (toolTogaki) toolTogaki.addEventListener('click', insertTogaki);
    if (toolSerifu) toolSerifu.addEventListener('click', insertSerifu);
    if (toolUndo) toolUndo.addEventListener('click', function() { document.execCommand('undo'); });
    if (toolRedo) toolRedo.addEventListener('click', function() { document.execCommand('redo'); });
    
    // フォーマットボタンのイベント
    if (toolBold) toolBold.addEventListener('click', function() { document.execCommand('bold'); });
    if (toolItalic) toolItalic.addEventListener('click', function() { document.execCommand('italic'); });
    if (toolUnderline) toolUnderline.addEventListener('click', function() { document.execCommand('underline'); });
    if (toolStrike) toolStrike.addEventListener('click', function() { document.execCommand('strikeThrough'); });
    if (toolSubscript) toolSubscript.addEventListener('click', function() { document.execCommand('subscript'); });
    if (toolSuperscript) toolSuperscript.addEventListener('click', function() { document.execCommand('superscript'); });
    if (toolBox) toolBox.addEventListener('click', function() { /* 実装予定 */ });
    if (toolColor) toolColor.addEventListener('click', function() { document.execCommand('foreColor', false, 'red'); });
    if (toolHighlight) toolHighlight.addEventListener('click', function() { document.execCommand('hiliteColor', false, 'yellow'); });
    if (toolPattern) toolPattern.addEventListener('click', function() { /* 実装予定 */ });
    
    // テキスト操作ボタンのイベント
    if (toolRuby) toolRuby.addEventListener('click', addRuby);
    if (toolLink) toolLink.addEventListener('click', insertLink);
    if (toolFontSmall) toolFontSmall.addEventListener('click', function() { document.execCommand('fontSize', false, '1'); });
    if (toolFontMedium) toolFontMedium.addEventListener('click', function() { document.execCommand('fontSize', false, '3'); });
    if (toolFontLarge) toolFontLarge.addEventListener('click', function() { document.execCommand('fontSize', false, '5'); });
    
    // 配置ボタンのイベント
    if (toolAlignLeft) toolAlignLeft.addEventListener('click', function() { document.execCommand('justifyLeft'); });
    if (toolAlignCenter) toolAlignCenter.addEventListener('click', function() { document.execCommand('justifyCenter'); });
    if (toolAlignRight) toolAlignRight.addEventListener('click', function() { document.execCommand('justifyRight'); });
    if (toolAlignJustify) toolAlignJustify.addEventListener('click', function() { document.execCommand('justifyFull'); });
    
    // 特殊文字ボタンのイベント
    if (toolEllipsis) toolEllipsis.addEventListener('click', insertEllipsis);
    if (toolDash) toolDash.addEventListener('click', insertDash);
    
    // リストボタンのイベント
    if (toolBulletList) toolBulletList.addEventListener('click', function() { document.execCommand('insertUnorderedList'); });
    if (toolNumberList) toolNumberList.addEventListener('click', function() { document.execCommand('insertOrderedList'); });
    if (toolJoinSerifu) toolJoinSerifu.addEventListener('click', joinSerifu);
    
    // 画像操作ボタンのイベント
    if (toolImage) toolImage.addEventListener('click', insertImage);
    
    // ファイルメニューのイベント
    if (menuNewFile) menuNewFile.addEventListener('click', newScript);
    if (menuOpenVersion) menuOpenVersion.addEventListener('click', loadVersions);
    if (menuDeleteVersion) menuDeleteVersion.addEventListener('click', deleteVersion);
    if (menuDeleteAll) menuDeleteAll.addEventListener('click', deleteAllVersions);
    if (menuExitEdit) menuExitEdit.addEventListener('click', exitEdit);
    
    // 保存メニューのイベント
    if (menuSaveOverwrite) menuSaveOverwrite.addEventListener('click', function() { saveScript(false); });
    if (menuSaveVersion) menuSaveVersion.addEventListener('click', function() { saveScript(true); });
    if (menuSetFinal) menuSetFinal.addEventListener('click', setFinal);
    if (menuSyncKouban) menuSyncKouban.addEventListener('click', syncKouban);
    if (menuSaveText) menuSaveText.addEventListener('click', saveAsText);
    if (menuSavePDF) menuSavePDF.addEventListener('click', saveAsPDF);
    
    // 挿入メニューのイベント
    if (menuInsertHashira) menuInsertHashira.addEventListener('click', insertHashira);
    if (menuInsertHiddenHashira) menuInsertHiddenHashira.addEventListener('click', insertHiddenHashira);
    if (menuInsertTogaki) menuInsertTogaki.addEventListener('click', insertTogaki);
    if (menuInsertHiddenTogaki) menuInsertHiddenTogaki.addEventListener('click', insertHiddenTogaki);
    if (menuInsertHiddenChar) menuInsertHiddenChar.addEventListener('click', insertHiddenChar);
    if (menuInsertSerifu) menuInsertSerifu.addEventListener('click', insertSerifu);
    
    if (menuInsertImage) menuInsertImage.addEventListener('click', insertImage);
    if (menuInsertPageBreak) menuInsertPageBreak.addEventListener('click', insertPageBreak);
    if (menuInsertLink) menuInsertLink.addEventListener('click', insertLink);
    if (menuInsertTextboxV) menuInsertTextboxV.addEventListener('click', insertTextboxVertical);
    if (menuInsertTextboxH) menuInsertTextboxH.addEventListener('click', insertTextboxHorizontal);
    if (menuInsertCut) menuInsertCut.addEventListener('click', insertCutMark);
    
    // 編集記号メニューのイベント
    const editMarkButtons = document.querySelectorAll('[data-action="insertEditMark"]');
    if (editMarkButtons) {
        editMarkButtons.forEach(button => {
            button.addEventListener('click', function() {
                const mark = this.dataset.mark;
                insertEditMark(mark);
            });
        });
    }
    
    // 特殊記号メニューのイベント
    const specialMarkButtons = document.querySelectorAll('[data-action="insertTimeProgress"]');
    if (specialMarkButtons) {
        specialMarkButtons.forEach(button => {
            button.addEventListener('click', insertTimeProgress);
        });
    }
    
    // 香盤登録メニューのイベント
    if (menuKoubanAll) menuKoubanAll.addEventListener('click', function() { registerKouban('all'); });
    if (menuKoubanChar) menuKoubanChar.addEventListener('click', function() { registerKouban('character'); });
    if (menuKoubanProp) menuKoubanProp.addEventListener('click', function() { registerKouban('prop'); });
    if (menuKoubanDevice) menuKoubanDevice.addEventListener('click', function() { registerKouban('device'); });
    if (menuKoubanCostume) menuKoubanCostume.addEventListener('click', function() { registerKouban('costume'); });
    if (menuKoubanMakeup) menuKoubanMakeup.addEventListener('click', function() { registerKouban('makeup'); });
    if (menuKoubanEffect) menuKoubanEffect.addEventListener('click', function() { registerKouban('effect'); });
    if (menuKoubanPlace1) menuKoubanPlace1.addEventListener('click', function() { registerKouban('place1'); });
    if (menuKoubanPlace2) menuKoubanPlace2.addEventListener('click', function() { registerKouban('place2'); });
    if (menuKoubanPlace3) menuKoubanPlace3.addEventListener('click', function() { registerKouban('place3'); });
    if (menuKoubanTime) menuKoubanTime.addEventListener('click', function() { registerKouban('time'); });
    if (menuKoubanOther) menuKoubanOther.addEventListener('click', function() { registerKouban('other'); });
    
    // 描画メニューのイベント
    if (menuDrawRect) menuDrawRect.addEventListener('click', function() { drawShape('rect'); });
    if (menuDrawCircle) menuDrawCircle.addEventListener('click', function() { drawShape('circle'); });
    if (menuDrawEllipse) menuDrawEllipse.addEventListener('click', function() { drawShape('ellipse'); });
    if (menuDrawTriangle) menuDrawTriangle.addEventListener('click', function() { drawShape('triangle'); });
    if (menuDrawLine) menuDrawLine.addEventListener('click', function() { drawShape('line'); });
    if (menuDrawArrow) menuDrawArrow.addEventListener('click', function() { drawShape('arrow'); });
    if (menuDrawBubble) menuDrawBubble.addEventListener('click', function() { drawShape('bubble'); });
    
    // 表示メニューのイベント
    if (viewToggleButtons) {
        viewToggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const viewName = this.dataset.view;
                toggleViewMenu(viewName, this);
            });
        });
    }
    
    // 校閲メニューのイベント
    if (menuCheckSpelling) menuCheckSpelling.addEventListener('click', checkSpelling);
    if (menuCountChars) menuCountChars.addEventListener('click', countChars);
    if (menuCheckProhibited) menuCheckProhibited.addEventListener('click', checkProhibitedWords);
    
    // モーダルの閉じるボタンのイベント
    if (closeButtons) {
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    // ウィンドウクリック時にモーダルを閉じる
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 初期行番号を生成
    generateLineNumbers();
    
    // サイドバーシーンのクリックイベント
    if (sidebarSceneList) {
        const sceneItems = sidebarSceneList.querySelectorAll('.script-sidebar-scene');
        sceneItems.forEach(item => {
            item.addEventListener('click', function() {
                const sceneIndex = parseInt(this.dataset.scene);
                const sceneElem = document.querySelector(`.script-scene[data-scene-index="${sceneIndex}"]`);
                
                if (sceneElem) {
                    // すべてのシーンの選択状態を解除
                    sidebarSceneList.querySelectorAll('.script-sidebar-scene').forEach(scene => {
                        scene.classList.remove('active');
                    });
                    
                    // このシーンをアクティブにする
                    this.classList.add('active');
                    
                    // シーンにスクロール
                    sceneElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    // ページ離脱時の確認
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            const message = '未保存の変更があります。このページを離れますか？';
            e.returnValue = message;
            return message;
        }
    });
    
    // コンテキストメニューの無効化（右クリックメニューのカスタマイズ用）
    if (editArea) {
        editArea.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            // カスタムコンテキストメニューの表示処理（実装予定）
        });
    }
    
    /**
     * 行番号を生成する関数
     */
    function generateLineNumbers() {
        const lineNumbersContinuous = document.getElementById('scriptLineNumbersContinuous');
        const lineNumbersScene = document.getElementById('scriptLineNumbersScene');
        
        if (!lineNumbersContinuous || !lineNumbersScene || !editArea) return;
        
        // 編集エリア内の行数をカウント
        const lines = editArea.querySelectorAll('.scriptarea-hashira, .scriptarea-togaki, .scriptarea-serifu, .scriptarea-togaki-hidden, .scriptarea-serifu-hidden, .time-progress, .script-page-break');
        
        // 連続行番号を生成
        lineNumbersContinuous.innerHTML = '';
        
        let lineCount = 1;
        lines.forEach(line => {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'script-line-number';
            lineNumber.textContent = lineCount;
            
            // しおりボタン（後で実装）
            // const bookmark = document.createElement('div');
            // bookmark.className = 'script-bookmark';
            // lineNumber.appendChild(bookmark);
            
            lineNumbersContinuous.appendChild(lineNumber);
            lineCount++;
        });
        
        // シーンごとの行番号を生成
        lineNumbersScene.innerHTML = '';
        
        let sceneIndex = 0;
        let sceneLineCount = 1;
        
        lines.forEach(line => {
            // 新しいシーンの開始
            if (line.classList.contains('scriptarea-hashira')) {
                sceneIndex++;
                sceneLineCount = 1;
                
                const lineNumber = document.createElement('div');
                lineNumber.className = 'script-line-number scene-start-number';
                lineNumber.textContent = sceneLineCount;
                lineNumbersScene.appendChild(lineNumber);
                
                sceneLineCount++;
            } else {
                const lineNumber = document.createElement('div');
                lineNumber.className = 'script-line-number';
                lineNumber.textContent = sceneLineCount;
                lineNumbersScene.appendChild(lineNumber);
                
                sceneLineCount++;
            }
        });
    }
    
    // 編集エリア内の変更を監視
    if (editArea) {
        // MutationObserverでDOM変更を監視
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // 行番号を再生成
                generateLineNumbers();
                
                // シーン一覧を更新
                updateSceneList();
                
                // 変更フラグをセット
                hasUnsavedChanges = true;
            });
        });
        
        // オブザーバーの設定
        observer.observe(editArea, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
    }
    
    /**
     * サイドバーのシーン一覧を更新
     */
    function updateSceneList() {
        if (!sidebarSceneList || !editArea) return;
        
        // 編集エリア内のシーン要素を取得
        const sceneElements = editArea.querySelectorAll('.script-scene');
        
        // サイドバーを初期化
        sidebarSceneList.innerHTML = '';
        
        // シーン要素ごとにサイドバー項目を作成
        sceneElements.forEach((sceneElem, index) => {
            const hashiraElem = sceneElem.querySelector('.scriptarea-hashira');
            
            // シーン情報を取得
            const sceneId = hashiraElem ? hashiraElem.querySelector('.script-hashira-id').innerText : `${index + 1}`.padStart(3, '0');
            const location = hashiraElem ? hashiraElem.querySelector('.script-hashira-location').innerText : '';
            
            // サイドバー項目を作成
            const sidebarItem = document.createElement('div');
            sidebarItem.className = 'script-sidebar-scene';
            sidebarItem.dataset.scene = index;
            sidebarItem.innerHTML = `#${sceneId} ${location}`;
            
            // クリックイベント
            sidebarItem.addEventListener('click', function() {
                const sceneIndex = parseInt(this.dataset.scene);
                const targetScene = document.querySelector(`.script-scene[data-scene-index="${sceneIndex}"]`);
                
                if (targetScene) {
                    // すべてのシーンの選択状態を解除
                    sidebarSceneList.querySelectorAll('.script-sidebar-scene').forEach(scene => {
                        scene.classList.remove('active');
                    });
                    
                    // このシーンをアクティブにする
                    this.classList.add('active');
                    
                    // シーンにスクロール
                    targetScene.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            
            sidebarSceneList.appendChild(sidebarItem);
        });
    }
});

/**
 * 柱を挿入
 */
function insertHashira() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // 既存のシーン数を取得
    const existingScenes = editArea.querySelectorAll('.script-scene');
    const sceneNumber = (existingScenes.length + 1).toString().padStart(3, '0');
    
    // 新しいシーン要素を作成
    const newScene = document.createElement('div');
    newScene.className = 'script-scene';
    newScene.dataset.sceneIndex = existingScenes.length;
    
    // 柱要素
    newScene.innerHTML = `
        <div class="scriptarea-hashira">
            <div class="script-hashira-id">${sceneNumber}</div>
            <div class="script-hashira-content">
                <div class="script-hashira-location-row">
                    <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                    <span class="script-hashira-time" contenteditable="true"></span>
                </div>
                <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
            </div>
        </div>
        <div class="scene-layout">
            <div class="scene-left">
                <!-- 左側エリア（画像などを配置できる） -->
            </div>
            <div class="scene-right">
                <!-- トー書き -->
                <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
            </div>
        </div>
    `;
    
    // シーンの挿入位置を決定（現在のカーソル位置の最も近い親シーン要素の後ろ）
    let currentNode = range.startContainer;
    while (currentNode && (!currentNode.classList || !currentNode.classList.contains('script-scene'))) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // 既存のシーンの後ろに挿入
        currentNode.after(newScene);
    } else {
        // 最初のシーンとして挿入
        editArea.appendChild(newScene);
    }
    
    // 新しいシーンの場所入力欄にフォーカス
    const locationElem = newScene.querySelector('.script-hashira-location');
    if (locationElem) {
        locationElem.focus();
        
        // テキスト全選択
        const range = document.createRange();
        range.selectNodeContents(locationElem);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // 行番号を更新（別途実装が必要）
    // generateLineNumbers();
    
    // サイドバーのシーン一覧を更新（別途実装が必要）
    // updateSceneList();
}

/**
 * 隠れ柱を挿入
 */
function insertHiddenHashira() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 最も近い親のscriptarea-hashira要素を探す
    let hashiraElem = range.startContainer;
    while (hashiraElem && (!hashiraElem.classList || !hashiraElem.classList.contains('scriptarea-hashira'))) {
        hashiraElem = hashiraElem.parentNode;
    }
    
    if (!hashiraElem) {
        alert('柱が見つかりません。先に柱を挿入してください。');
        return;
    }
    
    // 隠れ柱要素を探す、なければ作成
    let hiddenHashira = hashiraElem.querySelector('.scriptarea-hashira-hidden');
    
    if (!hiddenHashira) {
        hiddenHashira = document.createElement('div');
        hiddenHashira.className = 'scriptarea-hashira-hidden';
        hiddenHashira.contentEditable = 'true';
        
        // 最も近い.script-hashira-content要素に追加
        const contentElem = hashiraElem.querySelector('.script-hashira-content');
        if (contentElem) {
            contentElem.appendChild(hiddenHashira);
        } else {
            alert('柱の構造が不正です。');
            return;
        }
    }
    
    // 隠れ柱を表示
    hiddenHashira.style.display = 'block';
    
    // フォーカスを設定
    hiddenHashira.focus();
}

/**
 * ト書きを挿入
 */
function insertTogaki() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // ト書き要素を作成
    const togaki = document.createElement('div');
    togaki.className = 'scriptarea-togaki';
    togaki.contentEditable = 'true';
    togaki.innerHTML = 'ト書きを入力...';
    
    // 挿入位置の決定（現在のカーソル位置の親要素を検出）
    let currentNode = range.startContainer;
    
    // 挿入位置の親要素がscript-sceneかその子要素になるまで遡る
    while (currentNode && !currentNode.classList?.contains('script-scene')) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // シーン要素内に挿入
        
        // script-right要素を検索
        const rightCol = currentNode.querySelector('.scene-right');
        
        if (rightCol) {
            // 現在のカーソル位置の後に挿入
            let insertAfter = range.startContainer;
            
            // カーソル位置の要素がscriptarea-togaki, scriptarea-serifuなどの場合
            while (insertAfter && 
                  !insertAfter.classList?.contains('scriptarea-togaki') && 
                  !insertAfter.classList?.contains('scriptarea-serifu') && 
                  !insertAfter.classList?.contains('scriptarea-togaki-hidden') && 
                  !insertAfter.classList?.contains('scriptarea-serifu-hidden')) {
                insertAfter = insertAfter.parentNode;
                
                // script-right要素に達したら最後の子要素の後に挿入する
                if (insertAfter === rightCol) {
                    insertAfter = rightCol.lastChild;
                    break;
                }
            }
            
            // 適切な挿入位置が見つかった場合
            if (insertAfter && insertAfter !== rightCol) {
                insertAfter.after(togaki);
            } else {
                // 適切な挿入位置が見つからない場合は右カラムの最後に追加
                rightCol.appendChild(togaki);
            }
        } else {
            // scene-right要素がない場合は作成して追加
            const sceneLayout = document.createElement('div');
            sceneLayout.className = 'scene-layout';
            
            const leftCol = document.createElement('div');
            leftCol.className = 'scene-left';
            
            const rightCol = document.createElement('div');
            rightCol.className = 'scene-right';
            
            rightCol.appendChild(togaki);
            sceneLayout.appendChild(leftCol);
            sceneLayout.appendChild(rightCol);
            
            currentNode.appendChild(sceneLayout);
        }
    } else {
        // シーン要素が見つからない場合、新しいシーンを作成
        insertHashira();
        // 再帰的に呼び出して新しいシーンにト書きを挿入
        setTimeout(insertTogaki, 100);
        return;
    }
    
    // ト書きにフォーカス
    togaki.focus();
    
    // テキストを全選択
    const newRange = document.createRange();
    newRange.selectNodeContents(togaki);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

/**
 * 隠れト書きを挿入
 */
function insertHiddenTogaki() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 隠れト書き要素を作成
    const hiddenTogaki = document.createElement('div');
    hiddenTogaki.className = 'scriptarea-togaki-hidden';
    hiddenTogaki.contentEditable = 'true';
    hiddenTogaki.style.display = 'none'; // 初期状態では非表示
    hiddenTogaki.innerHTML = '隠れト書きを入力...';
    
    // 挿入位置を決定（通常のト書きと同様）
    let currentNode = range.startContainer;
    
    // 挿入位置の親要素がscript-sceneかその子要素になるまで遡る
    while (currentNode && !currentNode.classList?.contains('script-scene')) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // シーン要素内に挿入
        
        // script-right要素を検索
        const rightCol = currentNode.querySelector('.scene-right');
        
        if (rightCol) {
            // 現在のカーソル位置の後に挿入
            let insertAfter = range.startContainer;
            
            // カーソル位置の要素がscriptarea-togaki, scriptarea-serifuなどの場合
            while (insertAfter && 
                  !insertAfter.classList?.contains('scriptarea-togaki') && 
                  !insertAfter.classList?.contains('scriptarea-serifu') && 
                  !insertAfter.classList?.contains('scriptarea-togaki-hidden') && 
                  !insertAfter.classList?.contains('scriptarea-serifu-hidden')) {
                insertAfter = insertAfter.parentNode;
                
                // script-right要素に達したら最後の子要素の後に挿入する
                if (insertAfter === rightCol) {
                    insertAfter = rightCol.lastChild;
                    break;
                }
            }
            
            // 適切な挿入位置が見つかった場合
            if (insertAfter && insertAfter !== rightCol) {
                insertAfter.after(hiddenTogaki);
            } else {
                // 適切な挿入位置が見つからない場合は右カラムの最後に追加
                rightCol.appendChild(hiddenTogaki);
            }
        } else {
            // scene-right要素がない場合は作成して追加
            const sceneLayout = document.createElement('div');
            sceneLayout.className = 'scene-layout';
            
            const leftCol = document.createElement('div');
            leftCol.className = 'scene-left';
            
            const rightCol = document.createElement('div');
            rightCol.className = 'scene-right';
            
            rightCol.appendChild(hiddenTogaki);
            sceneLayout.appendChild(leftCol);
            sceneLayout.appendChild(rightCol);
            
            currentNode.appendChild(sceneLayout);
        }
    } else {
        // シーン要素が見つからない場合、新しいシーンを作成
        insertHashira();
        // 再帰的に呼び出して新しいシーンに隠れト書きを挿入
        setTimeout(insertHiddenTogaki, 100);
        return;
    }
    
    // 隠れト書きを表示
    hiddenTogaki.style.display = 'block';
    
    // 隠れト書きにフォーカス
    hiddenTogaki.focus();
    
    // テキストを全選択
    const newRange = document.createRange();
    newRange.selectNodeContents(hiddenTogaki);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

/**
 * 隠れ登場人物を挿入
 */
function insertHiddenChar() {
    alert('隠れ登場人物機能は現在実装中です');
    // TODO: 実装
}

/**
 * セリフを挿入
 */
function insertSerifu() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // カーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 登場人物選択ダイアログ表示（実際はモーダルで表示）
    const character = prompt('登場人物名を入力してください：');
    if (!character) return;
    
    // セリフ要素を作成
    const serifu = document.createElement('div');
    serifu.className = 'scriptarea-serifu';
    
    const serifuName = document.createElement('div');
    serifuName.className = 'script-serifu-name';
    serifuName.contentEditable = 'true';
    serifuName.textContent = character;
    
    const serifuContent = document.createElement('div');
    serifuContent.className = 'script-serifu-content';
    serifuContent.contentEditable = 'true';
    serifuContent.textContent = 'セリフを入力...';
    
    serifu.appendChild(serifuName);
    serifu.appendChild(serifuContent);
    
    // 挿入位置の決定（ト書きと同様）
    let currentNode = range.startContainer;
    
    // 挿入位置の親要素がscript-sceneかその子要素になるまで遡る
    while (currentNode && !currentNode.classList?.contains('script-scene')) {
        currentNode = currentNode.parentNode;
    }
    
    if (currentNode && currentNode.classList.contains('script-scene')) {
        // シーン要素内に挿入
        
        // script-right要素を検索
        const rightCol = currentNode.querySelector('.scene-right');
        
        if (rightCol) {
            // 現在のカーソル位置の後に挿入
            let insertAfter = range.startContainer;
            
            // カーソル位置の要素がscriptarea-togaki, scriptarea-serifuなどの場合
            while (insertAfter && 
                  !insertAfter.classList?.contains('scriptarea-togaki') && 
                  !insertAfter.classList?.contains('scriptarea-serifu') && 
                  !insertAfter.classList?.contains('scriptarea-togaki-hidden') && 
                  !insertAfter.classList?.contains('scriptarea-serifu-hidden')) {
                insertAfter = insertAfter.parentNode;
                
                // script-right要素に達したら最後の子要素の後に挿入する
                if (insertAfter === rightCol) {
                    insertAfter = rightCol.lastChild;
                    break;
                }
            }
            
            // 適切な挿入位置が見つかった場合
            if (insertAfter && insertAfter !== rightCol) {
                insertAfter.after(serifu);
            } else {
                // 適切な挿入位置が見つからない場合は右カラムの最後に追加
                rightCol.appendChild(serifu);
            }
        } else {
            // scene-right要素がない場合は作成して追加
            const sceneLayout = document.createElement('div');
            sceneLayout.className = 'scene-layout';
            
            const leftCol = document.createElement('div');
            leftCol.className = 'scene-left';
            
            const rightCol = document.createElement('div');
            rightCol.className = 'scene-right';
            
            rightCol.appendChild(serifu);
            sceneLayout.appendChild(leftCol);
            sceneLayout.appendChild(rightCol);
            
            currentNode.appendChild(sceneLayout);
        }
    } else {
        // シーン要素が見つからない場合、新しいシーンを作成
        insertHashira();
        // 再帰的に呼び出して新しいシーンにセリフを挿入
        setTimeout(function() {
            insertSerifu();
        }, 100);
        return;
    }
    
    // セリフ内容にフォーカス
    serifuContent.focus();
    
    // テキストを全選択
    const newRange = document.createRange();
    newRange.selectNodeContents(serifuContent);
    selection.removeAllRanges();
    selection.addRange(newRange);
}
		   
/**
 * 登場人物テーブルの初期化
 */
function initializeCharacterTable() {
    console.log('登場人物テーブル初期化');
    
    const table = document.getElementById('characters-table');
    if (!table) return;
    
    // 行の移動、追加、削除機能を初期化
    const addRowButtons = table.querySelectorAll('.add-row-btn');
    const deleteRowButtons = table.querySelectorAll('.delete-row-btn');
    const moveUpButtons = table.querySelectorAll('.move-up-btn');
    const moveDownButtons = table.querySelectorAll('.move-down-btn');
    
    // 行追加ボタンのイベントハンドラ
    addRowButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const newRow = row.cloneNode(true);
            
            // 入力フィールドをクリア
            newRow.querySelectorAll('input, select').forEach(input => {
                input.value = '';
            });
            
            // 新しい行のボタンに再度イベントリスナーを設定
            setupRowButtonListeners(newRow);
            
            // 新しい行を追加
            row.after(newRow);
        });
    });
    
    // 行削除ボタンのイベントハンドラ
    deleteRowButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            
            // 表の最後の行は削除しない
            if (table.rows.length > 2) { // ヘッダー行 + 少なくとも1行は残す
                row.remove();
            } else {
                // 最後の行は入力値をクリアするだけ
                row.querySelectorAll('input, select').forEach(input => {
                    input.value = '';
                });
            }
        });
    });
    
    // 上に移動ボタンのイベントハンドラ
    moveUpButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const prevRow = row.previousElementSibling;
            
            // ヘッダー行の次の行は上に移動できない
            if (prevRow && prevRow.querySelector('th') === null) {
                prevRow.before(row);
            }
        });
    });
    
    // 下に移動ボタンのイベントハンドラ
    moveDownButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const nextRow = row.nextElementSibling;
            
            if (nextRow) {
                nextRow.after(row);
            }
        });
    });
    
    /**
     * 行のボタンにイベントリスナーを設定
     * @param {HTMLElement} row テーブル行要素
     */
    function setupRowButtonListeners(row) {
        // 行追加ボタン
        const addBtn = row.querySelector('.add-row-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                const newRow = row.cloneNode(true);
                newRow.querySelectorAll('input, select').forEach(input => {
                    input.value = '';
                });
                setupRowButtonListeners(newRow);
                row.after(newRow);
            });
        }
        
        // 行削除ボタン
        const deleteBtn = row.querySelector('.delete-row-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (table.rows.length > 2) {
                    row.remove();
                } else {
                    row.querySelectorAll('input, select').forEach(input => {
                        input.value = '';
                    });
                }
            });
        }
        
        // 上に移動ボタン
        const upBtn = row.querySelector('.move-up-btn');
        if (upBtn) {
            upBtn.addEventListener('click', function() {
                const prevRow = row.previousElementSibling;
                if (prevRow && prevRow.querySelector('th') === null) {
                    prevRow.before(row);
                }
            });
        }
        
        // 下に移動ボタン
        const downBtn = row.querySelector('.move-down-btn');
        if (downBtn) {
            downBtn.addEventListener('click', function() {
                const nextRow = row.nextElementSibling;
                if (nextRow) {
                    nextRow.after(row);
                }
            });
        }
    }
}