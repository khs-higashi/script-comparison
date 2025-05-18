// JavaScript Document
document.addEventListener('DOMContentLoaded', () => {
    // 初期化処理
    initEditorFunctions();
    initMenuHandlers();
    initToolbarHandlers();
    initLineNumberManager();
    formatCharacterNames();
    setupSceneNavigation();
    setupContentEditableHandlers();
    setupFormSubmission();
    
    // モーダル関連の初期化
    initModals();
});

// エディタの主要機能の初期化
function initEditorFunctions() {
    // 編集履歴の管理用配列
    window.editorHistory = {
        undoStack: [],
        redoStack: [],
        currentState: null,
        maxStackSize: 50
    };
    
    // 初期状態を保存
    saveEditorState();
    
    // DOMの変更を監視して自動保存
    const scriptEditArea = document.getElementById('scriptEditArea');
    if (scriptEditArea) {
        const observer = new MutationObserver(function(mutations) {
            // ユーザー操作による変更のみを保存（プログラムによる変更は除外）
            if (!window.isSystemMutation) {
                saveEditorState();
            }
        });
        
        observer.observe(scriptEditArea, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
    }
}

// エディタの状態を保存（undo/redo用）
function saveEditorState() {
    const scriptEditArea = document.getElementById('scriptEditArea');
    if (!scriptEditArea) return;
    
    const currentContent = scriptEditArea.innerHTML;
    
    // 前回の状態と同じなら保存しない
    if (window.editorHistory.currentState === currentContent) return;
    
    // undoスタックに現在の状態を追加
    window.editorHistory.undoStack.push(window.editorHistory.currentState);
    
    // スタックが大きくなりすぎたら古いものを削除
    if (window.editorHistory.undoStack.length > window.editorHistory.maxStackSize) {
        window.editorHistory.undoStack.shift();
    }
    
    // redoスタックをクリア（新しい変更が入った場合）
    window.editorHistory.redoStack = [];
    
    // 現在の状態を更新
    window.editorHistory.currentState = currentContent;
}

// 元に戻す
function undoEdit() {
    if (window.editorHistory.undoStack.length === 0) return;
    
    const scriptEditArea = document.getElementById('scriptEditArea');
    if (!scriptEditArea) return;
    
    // 現在の状態をredoスタックに保存
    window.editorHistory.redoStack.push(window.editorHistory.currentState);
    
    // undoスタックから前の状態を取得
    const prevState = window.editorHistory.undoStack.pop();
    
    // プログラムによる変更フラグをセット
    window.isSystemMutation = true;
    
    // エディタの内容を前の状態に戻す
    scriptEditArea.innerHTML = prevState;
    
    // 現在の状態を更新
    window.editorHistory.currentState = prevState;
    
    // プログラムによる変更フラグをリセット
    setTimeout(() => {
        window.isSystemMutation = false;
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        window.lineNumberManager.updateLineNumbers();
    }
    
    // キャラクター名のフォーマットを再適用
    formatCharacterNames();
}

// やり直し
function redoEdit() {
    if (window.editorHistory.redoStack.length === 0) return;
    
    const scriptEditArea = document.getElementById('scriptEditArea');
    if (!scriptEditArea) return;
    
    // 現在の状態をundoスタックに保存
    window.editorHistory.undoStack.push(window.editorHistory.currentState);
    
    // redoスタックから次の状態を取得
    const nextState = window.editorHistory.redoStack.pop();
    
    // プログラムによる変更フラグをセット
    window.isSystemMutation = true;
    
    // エディタの内容を次の状態に更新
    scriptEditArea.innerHTML = nextState;
    
    // 現在の状態を更新
    window.editorHistory.currentState = nextState;
    
    // プログラムによる変更フラグをリセット
    setTimeout(() => {
        window.isSystemMutation = false;
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        window.lineNumberManager.updateLineNumbers();
    }
    
    // キャラクター名のフォーマットを再適用
    formatCharacterNames();
}

// メニュー項目のイベントハンドラを設定
function initMenuHandlers() {
    // ファイルメニュー
    document.getElementById('menuNewFile')?.addEventListener('click', createNewScript);
    document.getElementById('menuOpenVersion')?.addEventListener('click', openVersionModal);
    document.getElementById('menuDeleteVersion')?.addEventListener('click', deleteVersion);
    document.getElementById('menuDeleteAll')?.addEventListener('click', deleteAllVersions);
    document.getElementById('menuExitEdit')?.addEventListener('click', exitEdit);
    document.getElementById('menuAddScene')?.addEventListener('click', addNewScene);
    document.getElementById('menuDeleteScene')?.addEventListener('click', deleteCurrentScene);
    
    // 保存メニュー
    document.getElementById('menuSaveOverwrite')?.addEventListener('click', saveScript);
    document.getElementById('menuSaveVersion')?.addEventListener('click', saveNewVersion);
    document.getElementById('menuSetFinal')?.addEventListener('click', setFinalVersion);
    document.getElementById('menuSyncKouban')?.addEventListener('click', syncKoubanData);
    document.getElementById('menuSaveText')?.addEventListener('click', saveAsText);
    document.getElementById('menuSavePDF')?.addEventListener('click', saveAsPDF);
    
    // 挿入メニュー
    document.getElementById('menuInsertHashira')?.addEventListener('click', insertHashira);
    document.getElementById('menuInsertHiddenHashira')?.addEventListener('click', insertHiddenHashira);
    document.getElementById('menuInsertTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('menuInsertHiddenTogaki')?.addEventListener('click', insertHiddenTogaki);
    document.getElementById('menuInsertHiddenChar')?.addEventListener('click', insertHiddenCharacter);
    document.getElementById('menuInsertSerifu')?.addEventListener('click', insertSerifu);
    
    // 特殊記号メニュー
    document.querySelector('.script-submenu-item[data-action="insertTimeProgress"]')?.addEventListener('click', insertTimeProgress);
    
    // 編集記号メニューアイテム
    document.querySelectorAll('.script-submenu-item[data-action="insertEditMark"]').forEach(item => {
        item.addEventListener('click', function() {
            const mark = this.getAttribute('data-mark');
            insertEditMark(mark);
        });
    });
    
    document.getElementById('menuInsertImage')?.addEventListener('click', insertImage);
    document.getElementById('menuInsertPageBreak')?.addEventListener('click', insertPageBreak);
    document.getElementById('menuInsertLink')?.addEventListener('click', insertLink);
    document.getElementById('menuInsertTextboxV')?.addEventListener('click', insertVerticalTextbox);
    document.getElementById('menuInsertTextboxH')?.addEventListener('click', insertHorizontalTextbox);
    document.getElementById('menuInsertCut')?.addEventListener('click', insertCutMark);
    
    // 香盤情報メニュー
    document.getElementById('menuKoubanAll')?.addEventListener('click', () => showKoubanInfo('all'));
    document.getElementById('menuKoubanChar')?.addEventListener('click', () => showKoubanInfo('character'));
    document.getElementById('menuKoubanProp')?.addEventListener('click', () => showKoubanInfo('prop'));
    document.getElementById('menuKoubanDevice')?.addEventListener('click', () => showKoubanInfo('device'));
    document.getElementById('menuKoubanCostume')?.addEventListener('click', () => showKoubanInfo('costume'));
    document.getElementById('menuKoubanMakeup')?.addEventListener('click', () => showKoubanInfo('makeup'));
    document.getElementById('menuKoubanEffect')?.addEventListener('click', () => showKoubanInfo('effect'));
    document.getElementById('menuKoubanPlace1')?.addEventListener('click', () => showKoubanInfo('place1'));
    document.getElementById('menuKoubanPlace2')?.addEventListener('click', () => showKoubanInfo('place2'));
    document.getElementById('menuKoubanPlace3')?.addEventListener('click', () => showKoubanInfo('place3'));
    document.getElementById('menuKoubanTime')?.addEventListener('click', () => showKoubanInfo('time'));
    document.getElementById('menuKoubanOther')?.addEventListener('click', () => showKoubanInfo('other'));
    
    // 描画メニュー
    document.getElementById('menuDrawRect')?.addEventListener('click', drawRectangle);
    document.getElementById('menuDrawCircle')?.addEventListener('click', drawCircle);
    document.getElementById('menuDrawEllipse')?.addEventListener('click', drawEllipse);
    document.getElementById('menuDrawTriangle')?.addEventListener('click', drawTriangle);
    document.getElementById('menuDrawLine')?.addEventListener('click', drawLine);
    document.getElementById('menuDrawArrow')?.addEventListener('click', drawArrow);
    document.getElementById('menuDrawBubble')?.addEventListener('click', drawBubble);
    
    // 表示メニュー
    // 表示切替のトグル処理
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            const state = this.getAttribute('data-state');
            
            // 状態を切り替え
            if (state === 'hidden') {
                this.setAttribute('data-state', 'visible');
                this.textContent = this.textContent.replace('表示', '非表示');
                
                // 対応するクラスを追加
                document.getElementById('scriptEditArea').classList.add('show-' + view);
            } else {
                this.setAttribute('data-state', 'hidden');
                this.textContent = this.textContent.replace('非表示', '表示');
                
                // 対応するクラスを削除
                document.getElementById('scriptEditArea').classList.remove('show-' + view);
            }
            
            // 特別な処理が必要な項目
            if (view === 'lineNumber') {
                toggleLineNumbers(state !== 'visible');
            } else if (view === 'verticalMode') {
                toggleVerticalMode(state !== 'visible');
            }
        });
    });
    
    // 校閲メニュー
    document.getElementById('menuCheckSpelling')?.addEventListener('click', checkSpelling);
    document.getElementById('menuCountChars')?.addEventListener('click', countCharacters);
    document.getElementById('menuCheckProhibited')?.addEventListener('click', checkProhibitedWords);
}

// ツールバー項目のイベントハンドラを設定
function initToolbarHandlers() {
    // 保存ボタン
    document.getElementById('toolbarSaveBtn')?.addEventListener('click', saveScript);
    
    // 要素挿入
    document.getElementById('toolHashira')?.addEventListener('click', insertHashira);
    document.getElementById('toolTogaki')?.addEventListener('click', insertTogaki);
    document.getElementById('toolSerifu')?.addEventListener('click', insertSerifu);
    
    // 編集操作
    document.getElementById('toolUndo')?.addEventListener('click', undoEdit);
    document.getElementById('toolRedo')?.addEventListener('click', redoEdit);
    
    // クリップボード操作
    document.getElementById('toolCopy')?.addEventListener('click', copySelection);
    document.getElementById('toolPaste')?.addEventListener('click', pasteContent);
    
    // テキスト装飾
    document.getElementById('toolBold')?.addEventListener('click', () => applyFormatting('bold'));
    document.getElementById('toolItalic')?.addEventListener('click', () => applyFormatting('italic'));
    document.getElementById('toolUnderline')?.addEventListener('click', () => applyFormatting('underline'));
    document.getElementById('toolStrike')?.addEventListener('click', () => applyFormatting('strikethrough'));
    document.getElementById('toolSubscript')?.addEventListener('click', () => applyFormatting('subscript'));
    document.getElementById('toolSuperscript')?.addEventListener('click', () => applyFormatting('superscript'));
    document.getElementById('toolBox')?.addEventListener('click', () => applyFormatting('box'));
    document.getElementById('toolColor')?.addEventListener('click', () => applyFormatting('color'));
    document.getElementById('toolHighlight')?.addEventListener('click', () => applyFormatting('highlight'));
    document.getElementById('toolPattern')?.addEventListener('click', () => applyFormatting('pattern'));
    
    // 特殊入力
    document.getElementById('toolRuby')?.addEventListener('click', insertRuby);
    document.getElementById('toolLink')?.addEventListener('click', insertLink);
    
    // フォントサイズ操作
    document.getElementById('toolFontSmall')?.addEventListener('click', () => changeFontSize('small'));
    document.getElementById('toolFontMedium')?.addEventListener('click', () => changeFontSize('medium'));
    document.getElementById('toolFontLarge')?.addEventListener('click', () => changeFontSize('large'));
    
    // テキスト揃え
    document.getElementById('toolAlignLeft')?.addEventListener('click', () => alignText('left'));
    document.getElementById('toolAlignCenter')?.addEventListener('click', () => alignText('center'));
    document.getElementById('toolAlignRight')?.addEventListener('click', () => alignText('right'));
    document.getElementById('toolAlignJustify')?.addEventListener('click', () => alignText('justify'));
    
    // 特殊文字の挿入
    document.getElementById('toolEllipsis')?.addEventListener('click', insertEllipsis);
    document.getElementById('toolDash')?.addEventListener('click', insertDash);
    
    // リスト操作
    document.getElementById('toolBulletList')?.addEventListener('click', insertBulletList);
    document.getElementById('toolNumberList')?.addEventListener('click', insertNumberList);
    document.getElementById('toolJoinSerifu')?.addEventListener('click', joinSerifu);
    
    // 画像挿入
    document.getElementById('toolImage')?.addEventListener('click', insertImage);
}

// シーン間のナビゲーション機能を設定
function setupSceneNavigation() {
    const sceneItems = document.querySelectorAll('.script-sidebar-scene');
    sceneItems.forEach(item => {
        item.addEventListener('click', function() {
            // 選択しているシーンのハイライト表示
            sceneItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 選択したシーンに移動
            const sceneIndex = this.getAttribute('data-scene');
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${sceneIndex}"]`);
            if (targetScene) {
                targetScene.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 初期状態では最初のシーンを選択状態にする
    if (sceneItems.length > 0) {
        sceneItems[0].classList.add('active');
    }
}

// contenteditable要素の編集イベントを設定
function setupContentEditableHandlers() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // フォーカス時の処理
    editArea.addEventListener('focus', function(e) {
        if (e.target.hasAttribute('contenteditable') && e.target.getAttribute('contenteditable') === 'true') {
            // 選択されている要素を記録（後でコマンド適用時に使用）
            window.currentEditElement = e.target;
        }
    }, true);
    
    // キーボードショートカット
    editArea.addEventListener('keydown', function(e) {
        // Ctrl+S または Command+S で保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveScript();
        }
        
        // Ctrl+Z または Command+Z で元に戻す
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoEdit();
        }
        
        // Ctrl+Y または Command+Y で再実行
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redoEdit();
        }
        
        // Ctrl+H または Command+H で柱挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 'h' && !e.shiftKey) {
            e.preventDefault();
            insertHashira();
        }
        
        // Ctrl+Shift+H または Command+Shift+H で隠れ柱挿入
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
            e.preventDefault();
            insertHiddenHashira();
        }
        
        // Ctrl+T または Command+T でト書き挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 't' && !e.shiftKey) {
            e.preventDefault();
            insertTogaki();
        }
        
        // Ctrl+Shift+T または Command+Shift+T で隠れト書き挿入
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 't') {
            e.preventDefault();
            insertHiddenTogaki();
        }
        
        // Ctrl+L または Command+L でセリフ挿入
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            insertSerifu();
        }
    });
}

// フォーム送信処理の設定
function setupFormSubmission() {
    const form = document.getElementById('script-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 台本データをJSON化して隠しフィールドに設定
        const scriptData = collectScriptData();
        document.getElementById('script_content').value = JSON.stringify(scriptData);
        
        // フォームを送信
        this.submit();
    });
}

// セリフの登場人物名の横幅調整
function formatCharacterNames() {
    const nameElements = document.querySelectorAll('.script-serifu-name');

    nameElements.forEach(element => {
        const originalName = element.textContent.trim();

        // 保存しておく（再実行防止）
        if (!element.dataset.originalName) {
            element.dataset.originalName = originalName;
        }

        const nameLength = originalName.length;

        if (nameLength === 1) {
            // 1文字 → 両側に &emsp;
            element.innerHTML = '&emsp;' + originalName + '&emsp;';
        } else if (nameLength === 2) {
            // 2文字 → 間に &emsp;
            element.innerHTML = originalName[0] + '&emsp;' + originalName[1];
        } else if (nameLength >= 4) {
            element.classList.add('long-name');
            element.innerHTML = originalName; // 長い名前はそのまま
        } else {
            // 3文字など
            element.innerHTML = originalName;
        }
    });
}

// 行番号管理クラス
class LineNumberManager {
    constructor() {
        // DOM要素
        this.continuousContainer = document.getElementById('scriptLineNumbersContinuous');
        this.sceneContainer = document.getElementById('scriptLineNumbersScene');
        this.scriptArea = document.getElementById('scriptEditArea');
        
        // 行の高さは固定値として設定
        this.defaultLineHeight = 24; // px
        
        // 状態管理
        this.isSceneNumbersVisible = false;
        
        // 初期化
        this.init();
    }
    
    init() {
        if (!this.continuousContainer || !this.scriptArea) return;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期行番号の生成
        setTimeout(() => this.updateLineNumbers(), 500);
    }
    
    setupEventListeners() {
        // スクロール同期
        this.scriptArea.addEventListener('scroll', () => this.syncScroll());
        
        // DOM変更の監視
        const observer = new MutationObserver(() => {
            clearTimeout(this.updateTimer);
            this.updateTimer = setTimeout(() => this.updateLineNumbers(), 300);
        });
        
        observer.observe(this.scriptArea, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
        
        // ウィンドウサイズ変更時にも更新
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.updateLineNumbers(), 300);
        });
    }
    
    syncScroll() {
        if (this.continuousContainer && this.scriptArea) {
            this.continuousContainer.scrollTop = this.scriptArea.scrollTop;
            if (this.sceneContainer) {
                this.sceneContainer.scrollTop = this.scriptArea.scrollTop;
            }
        }
    }
    
    updateLineNumbers() {
        if (!this.continuousContainer || !this.scriptArea) return;
        
        // コンテナをクリア
        this.continuousContainer.innerHTML = '';
        if (this.sceneContainer) {
            this.sceneContainer.innerHTML = '';
        }
        
        // すべての表示可能な要素を取得
        const allElements = this.getAllVisibleElements();
        
        // 連続的な行番号カウンタ
        let continuousLineNumber = 1;
        // シーンごとの行番号カウンタ
        let sceneLineNumber = 1;
        let currentSceneIndex = -1;
        
        // 各要素に対して行番号を生成
        allElements.forEach(element => {
            // 要素のシーンインデックスを取得
            const sceneElement = this.findParentScene(element);
            const sceneIndex = sceneElement ? 
                parseInt(sceneElement.getAttribute('data-scene-index')) : -1;
            
            // 新しいシーンが始まったらシーン内行番号をリセット
            if (sceneIndex !== currentSceneIndex) {
                currentSceneIndex = sceneIndex;
                sceneLineNumber = 1;
            }
            
            // 行番号div要素を作成
            const lineNumberDiv = document.createElement('div');
            lineNumberDiv.className = 'script-line-number';
            lineNumberDiv.textContent = continuousLineNumber++;
            lineNumberDiv.style.textAlign = 'center';
            
            // 要素の位置に合わせて行番号の位置を調整
            this.positionLineNumber(lineNumberDiv, element);
            
            // 行番号をコンテナに追加
            this.continuousContainer.appendChild(lineNumberDiv);
            
            // 柱要素以外は、シーン行番号も追加
            if (!element.classList.contains('scriptarea-hashira') && 
                !element.classList.contains('scriptarea-hashira-hidden')) {
                if (this.sceneContainer) {
                    const sceneLineNumberDiv = document.createElement('div');
                    sceneLineNumberDiv.className = 'script-line-number';
                    sceneLineNumberDiv.style.textAlign = 'center';
                    
                    if (sceneLineNumber === 1) {
                        sceneLineNumberDiv.classList.add('scene-start-number');
                    }
                    sceneLineNumberDiv.textContent = sceneLineNumber++;
                    
                    this.positionLineNumber(sceneLineNumberDiv, element);
                    
                    this.sceneContainer.appendChild(sceneLineNumberDiv);
                }
            }
            
            // しおり機能のためのコンテキストメニューイベント
            lineNumberDiv.addEventListener('contextmenu', this.handleLineNumberContextMenu);
        });
    }
    
    positionLineNumber(lineNumberDiv, element) {
        // 要素の位置とサイズを取得
        const elementRect = element.getBoundingClientRect();
        const scriptAreaRect = this.scriptArea.getBoundingClientRect();
        
        // スクリプトエリアからの相対位置を計算
        const relativeTop = elementRect.top - scriptAreaRect.top + this.scriptArea.scrollTop;
        
        // 行番号divのスタイルを設定
        lineNumberDiv.style.position = 'absolute';
        lineNumberDiv.style.top = `${relativeTop}px`;
        lineNumberDiv.style.height = `${this.defaultLineHeight}px`;
        lineNumberDiv.style.lineHeight = `${this.defaultLineHeight}px`;
        lineNumberDiv.style.boxSizing = 'border-box';
    }
    
    getAllVisibleElements() {
        // 対象となる要素のセレクタ
        const selectors = [
            '.scriptarea-hashira',
            '.scriptarea-hashira-hidden',
            '.scriptarea-togaki',
            '.scriptarea-togaki-hidden',
            '.scriptarea-serifu',
            '.scriptarea-serifu-hidden',
            '.time-progress',
            '.script-page-break'
        ];
        
        // すべての対象要素を取得
        let elements = [];
        selectors.forEach(selector => {
            const found = this.scriptArea.querySelectorAll(selector);
            found.forEach(el => {
                if (this.isElementVisible(el)) {
                    elements.push(el);
                }
            });
        });
        
        // 表示位置（上から下）でソート
        elements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectA.top - rectB.top;
        });
        
        return elements;
    }
    
    isElementVisible(element) {
        if (!element) return false;
        
        if (!element.offsetParent) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }
    
    findParentScene(element) {
        let current = element;
        while (current && !current.classList.contains('script-scene')) {
            current = current.parentElement;
        }
        return current;
    }
    
    handleLineNumberContextMenu(e) {
        e.preventDefault();
        
        // コンテキストメニューを作成
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        
        // しおりの有無によって表示内容を変更
        const hasBookmark = this.querySelector('.script-bookmark');
        if (hasBookmark) {
            contextMenu.innerHTML = '<div class="context-menu-item" data-action="removeBookmark">しおりを削除</div>';
        } else {
            contextMenu.innerHTML = '<div class="context-menu-item" data-action="addBookmark">しおりを追加</div>';
        }
        
        // 位置の設定
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        
        // コンテキストメニューの追加
        document.body.appendChild(contextMenu);
        
        // クリックイベントの設定
        const menuItems = contextMenu.querySelectorAll('.context-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const lineNum = e.target;
                
                if (action === 'addBookmark') {
                    // しおりを追加
                    const bookmark = document.createElement('span');
                    bookmark.className = 'script-bookmark';
                    
                    // Font Awesome アイコンを追加
                    const icon = document.createElement('i');
                    icon.className = 'fa-solid fa-bookmark';
                    bookmark.appendChild(icon);
                    
                    // 行番号を表示するスパンを追加
                    const lineNumberText = document.createElement('span');
                    lineNumberText.className = 'script-bookmark-number';
                    lineNumberText.textContent = lineNum.textContent;
                    
                    bookmark.appendChild(lineNumberText);
                    lineNum.appendChild(bookmark);
                    
                    // サイドバーのシーン一覧にもしおりマークを追加
                    const sceneItems = document.querySelectorAll('.script-sidebar-scene');
                    const activeScene = document.querySelector('.script-sidebar-scene.active');
                    if (activeScene) {
                        // しおりがまだない場合のみ追加
                        if (!activeScene.querySelector('.sidebar-bookmark')) {
                            const sidebarBookmark = document.createElement('span');
                            sidebarBookmark.className = 'sidebar-bookmark';
                            sidebarBookmark.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
                            activeScene.prepend(sidebarBookmark);
                        }
                    }
                } else if (action === 'removeBookmark') {
                    // しおりを削除
                    lineNum.querySelector('.script-bookmark').remove();
                    
                    // 他に同じシーンにしおりがなければサイドバーのしおりも削除
                    const activeScene = document.querySelector('.script-sidebar-scene.active');
                    if (activeScene) {
                        const sceneElement = document.querySelector(`.script-scene[data-scene-index="${activeScene.getAttribute('data-scene')}"]`);
                        if (sceneElement) {
                            const hasOtherBookmarks = Array.from(sceneElement.querySelectorAll('.script-line-number')).some(ln => ln.querySelector('.script-bookmark'));
                            if (!hasOtherBookmarks) {
                                const sidebarBookmark = activeScene.querySelector('.sidebar-bookmark');
                                if (sidebarBookmark) {


                                    sidebarBookmark.remove();
                                }
                            }
                        }
                    }
                }
                
                // コンテキストメニューを削除
                contextMenu.remove();
            });
        });
        
        // クリック以外の場所をクリックしたらメニューを閉じる
        document.addEventListener('click', function closeMenu() {
            if (document.querySelector('.context-menu')) {
                document.querySelector('.context-menu').remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }
}

// 行番号マネージャーの初期化
function initLineNumberManager() {
    try {
        // 行番号のコンテナスタイルを変更
        const lineNumbersContainer = document.querySelector('.script-line-numbers-container');
        if (lineNumbersContainer) {
            lineNumbersContainer.style.position = 'relative';
        }
        
        const continuousContainer = document.getElementById('scriptLineNumbersContinuous');
        if (continuousContainer) {
            continuousContainer.style.position = 'relative';
            continuousContainer.style.overflow = 'hidden';
            continuousContainer.style.height = '100%';
            continuousContainer.style.textAlign = 'center';
        }
        
        const sceneContainer = document.getElementById('scriptLineNumbersScene');
        if (sceneContainer) {
            sceneContainer.style.position = 'relative';
            sceneContainer.style.overflow = 'hidden';
            sceneContainer.style.height = '100%';
            sceneContainer.style.display = 'none';
            sceneContainer.style.textAlign = 'center';
        }
        
        window.lineNumberManager = new LineNumberManager();
    } catch (error) {
        console.error('行番号マネージャー初期化エラー:', error);
    }
}

// 行番号表示の切り替え
function toggleLineNumbers(show) {
    const continuousContainer = document.getElementById('scriptLineNumbersContinuous');
    const sceneContainer = document.getElementById('scriptLineNumbersScene');
    
    if (show) {
        // 行番号を表示
        if (continuousContainer) continuousContainer.style.display = 'block';
        // 現在のモードに応じてシーン行番号も表示
        const toggle = document.querySelector('.view-toggle[data-view="lineNumber"]');
        if (toggle && toggle.getAttribute('data-state') === 'visible' && sceneContainer) {
            sceneContainer.style.display = 'block';
        }
    } else {
        // 行番号を非表示
        if (continuousContainer) continuousContainer.style.display = 'none';
        if (sceneContainer) sceneContainer.style.display = 'none';
    }
}

// 縦書きモードの切り替え
function toggleVerticalMode(isVertical) {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    if (isVertical) {
        editArea.classList.add('vertical-writing-mode');
    } else {
        editArea.classList.remove('vertical-writing-mode');
    }
    
    // 行番号の更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// モーダルの初期化
function initModals() {
    // モーダルを閉じる処理
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 登場人物モーダルの設定
    setupCharacterModal();
    
    // 香盤情報モーダルの設定
    setupKoubanModal();
    
    // バージョン選択モーダルの設定
    setupVersionModal();
}

// 登場人物モーダルの設定
function setupCharacterModal() {
    const modal = document.getElementById('character-select-modal');
    if (!modal) return;
    
    // 登場人物クリック時の処理
    document.querySelectorAll('.character-item').forEach(item => {
        item.addEventListener('click', function() {
            const characterName = this.getAttribute('data-name');
            insertSerifuWithCharacter(characterName);
            modal.style.display = 'none';
        });
    });
    
    // カスタム登場人物の追加
    document.getElementById('add-character-btn')?.addEventListener('click', function() {
        const customNameInput = document.getElementById('custom-character');
        if (customNameInput && customNameInput.value.trim() !== '') {
            insertSerifuWithCharacter(customNameInput.value.trim());
            modal.style.display = 'none';
            customNameInput.value = '';
        }
    });
}

// 香盤情報モーダルの設定
function setupKoubanModal() {
    const modal = document.getElementById('kouban-select-modal');
    if (!modal) return;
    
    // 適用ボタンクリック時の処理
    document.getElementById('apply-kouban-btn')?.addEventListener('click', function() {
        const koubanType = document.getElementById('kouban-type').value;
        const koubanDesc = document.getElementById('kouban-desc').value.trim();
        
        applyKoubanInfo(koubanType, koubanDesc);
        modal.style.display = 'none';
        document.getElementById('kouban-desc').value = '';
    });
}

// バージョン選択モーダルの設定
function setupVersionModal() {
    // バージョン一覧は実際のデータベースから取得する必要があるので、
    // 保存済みのバージョン一覧を表示するための処理は別途実装が必要
}

// 台本データの収集（JSONに変換するため）
function collectScriptData() {
    const scriptData = {
        scenes: []
    };
    
    // シーン要素をすべて取得
    const scenes = document.querySelectorAll('.script-scene');
    
    scenes.forEach((sceneElement, index) => {
        const scene = {};
        
        // シーンID
		scene.scene_id = sceneElement.querySelector('.script-hashira-id')?.textContent || sceneNumber.padStart(3, '0');
        
        // 場所
        scene.location = sceneElement.querySelector('.script-hashira-location')?.textContent || '';
        
        // 時間帯
        scene.time_setting = sceneElement.querySelector('.script-hashira-time')?.textContent || '';
        
        // 隠れ柱
        scene.hidden_description = sceneElement.querySelector('.scriptarea-hashira-hidden')?.textContent || '';
        
        // シーンの内容（ト書き、セリフなど）を収集
        scene.content = [];
        
        // ト書き
        sceneElement.querySelectorAll('.scriptarea-togaki').forEach(togaki => {
            if (!togaki.classList.contains('time-progress')) {
                scene.content.push({
                    type: 'togaki',
                    text: togaki.textContent
                });
            }
        });
        
        // 隠れト書き
        sceneElement.querySelectorAll('.scriptarea-togaki-hidden').forEach(hiddenTogaki => {
            scene.content.push({
                type: 'hidden_togaki',
                text: hiddenTogaki.textContent
            });
        });
        
        // セリフ
        sceneElement.querySelectorAll('.scriptarea-serifu').forEach(serifu => {
            const characterName = serifu.querySelector('.script-serifu-name')?.dataset.originalName || 
                                 serifu.querySelector('.script-serifu-name')?.textContent.trim() || '';
            
            scene.content.push({
                type: 'serifu',
                character: characterName,
                text: serifu.querySelector('.script-serifu-content')?.textContent || ''
            });
        });
        
        // 隠れセリフ
        sceneElement.querySelectorAll('.scriptarea-serifu-hidden').forEach(hiddenSerifu => {
            const characterName = hiddenSerifu.querySelector('.script-serifu-name')?.dataset.originalName || 
                                hiddenSerifu.querySelector('.script-serifu-name')?.textContent.trim() || '';
            
            scene.content.push({
                type: 'hidden_serifu',
                character: characterName,
                text: hiddenSerifu.querySelector('.script-serifu-content')?.textContent || ''
            });
        });
        
        // 時間経過
        sceneElement.querySelectorAll('.time-progress').forEach(timeProgress => {
            scene.content.push({
                type: 'time_progress'
            });
        });
        
        // ページ区切り
        sceneElement.querySelectorAll('.script-page-break').forEach(pageBreak => {
            scene.content.push({
                type: 'page_break'
            });
        });
        
        // 左側のコンテンツ
        const leftContent = sceneElement.querySelector('.scene-left')?.innerHTML || '';
        if (leftContent.trim() !== '') {
            scene.left_content = leftContent;
        }
        
        // シーンデータを追加
        scriptData.scenes.push(scene);
    });
    
    return scriptData;
}

// 台本保存
function saveScript() {
    // 既存バージョンへの上書き保存（通常保存）
    console.log("上書き保存を実行します");
    
    // 台本データをJSON化して隠しフィールドに設定
    const scriptData = collectScriptData();
    document.getElementById('script_content').value = JSON.stringify(scriptData);
    
    // フォームを送信
    document.getElementById('script-form').submit();
}

// 新しいバージョンとして保存
function saveNewVersion() {
    console.log("新規バージョンとして保存します");
    
    // バージョン保存フラグを追加
    const saveAsNewVersionInput = document.createElement('input');
    saveAsNewVersionInput.type = 'hidden';
    saveAsNewVersionInput.name = 'save_as_new_version';
    saveAsNewVersionInput.value = '1';
    
    // フォームに追加
    const form = document.getElementById('script-form');
    if (form) {
        form.appendChild(saveAsNewVersionInput);
    }
    
    // 現在のバージョン情報を保持
    const currentVersion = document.getElementById('version').value;
    console.log("現在のバージョン:", currentVersion);
    
    // 決定稿フラグをリセット（新規バージョンは決定稿にしない）
    const isFinalInput = document.getElementById('is_final');
    if (isFinalInput) {
        isFinalInput.value = '0';
    }
    
    // 台本データをJSON化して隠しフィールドに設定
    const scriptData = collectScriptData();
    document.getElementById('script_content').value = JSON.stringify(scriptData);
    
    // フォームを送信
    if (form) {
        form.submit();
    }
}

// 決定稿として保存
function setFinalVersion() {
    console.log("決定稿として保存します");
    
    // 決定稿フラグをセット
    const isFinalInput = document.getElementById('is_final');
    if (isFinalInput) {
        isFinalInput.value = '1';
    }
    
    // バージョン表示を更新
    const versionDisplay = document.querySelector('.script-menu-version');
    if (versionDisplay) {
        versionDisplay.textContent = '【完成稿】';
        versionDisplay.classList.add('final');
    }
    
    // 台本データをJSON化して隠しフィールドに設定
    const scriptData = collectScriptData();
    document.getElementById('script_content').value = JSON.stringify(scriptData);
    
    // フォームを送信
    document.getElementById('script-form').submit();
}

// テキストとして保存
function saveAsText() {
    const scriptData = collectScriptData();
    let textContent = '';
    
    // シーンごとにテキスト化
    scriptData.scenes.forEach(scene => {
        // 柱情報
        textContent += `${scene.scene_id} ${scene.location}${scene.time_setting ? ' ' + scene.time_setting : ''}\n`;
        
        // 隠れ柱があれば追加
        if (scene.hidden_description) {
            textContent += `${scene.hidden_description}\n`;
        }
        
        textContent += '\n';
        
        // シーンの内容
        if (scene.content) {
            scene.content.forEach(item => {
                if (item.type === 'togaki') {
                    textContent += `　　${item.text}\n\n`;
                } else if (item.type === 'hidden_togaki') {
                    textContent += `　　(隠)${item.text}\n\n`;
                } else if (item.type === 'serifu') {
                    textContent += `${item.character}「${item.text}」\n\n`;
                } else if (item.type === 'hidden_serifu') {
                    textContent += `(隠)${item.character}「${item.text}」\n\n`;
                } else if (item.type === 'time_progress') {
                    textContent += `　　×　　×　　×\n\n`;
                } else if (item.type === 'page_break') {
                    textContent += `=====ページ区切り=====\n\n`;
                }
            });
        }
        
        textContent += '\n\n';
    });
    
    // テキストファイルのダウンロード
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
    element.setAttribute('download', `台本_${document.getElementById('script_id').value}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// PDFとして保存（サーバー側で処理するか、jsPDFなどのライブラリを使用）
function saveAsPDF() {
    alert('PDF保存機能は準備中です...');
    // 実際の実装は別途必要
}


// 香盤データと同期（実装はサーバー側で）
function syncKoubanData() {
    alert('香盤情報を同期しています...');
    // 実際の実装では非同期通信などで処理
    
    // 台本データをJSON化して隠しフィールドに設定
    const scriptData = collectScriptData();
    document.getElementById('script_content').value = JSON.stringify(scriptData);
    
    // フォームを送信
    const form = document.getElementById('script-form');
    if (form) {
        // 特別なフラグを追加して香盤同期モードであることを示す
        const syncKoubanFlag = document.createElement('input');
        syncKoubanFlag.type = 'hidden';
        syncKoubanFlag.name = 'sync_kouban';
        syncKoubanFlag.value = '1';
        form.appendChild(syncKoubanFlag);
        
        // フォーム送信
        form.submit();
    }
}

// 新規台本作成
function createNewScript() {
    if (confirm('新しい台本を作成します。現在の内容は失われますがよろしいですか？')) {
        // エディタ内容をクリア
        const scriptEditArea = document.getElementById('scriptEditArea');
        if (scriptEditArea) {
            scriptEditArea.innerHTML = `
            <div class="script-scene" data-scene-index="0">
                <div class="scriptarea-hashira">
                    <div class="script-hashira-id">001</div>
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
        }
        
        // サイドバーを更新
        const sceneList = document.getElementById('script-scene-list');
        if (sceneList) {
            sceneList.innerHTML = `
            <div class="script-sidebar-scene active" data-scene="0">
                #001 場所を入力
            </div>
            `;
        }
        
        // バージョン情報をリセット
        const versionInput = document.getElementById('version');
        if (versionInput) {
            versionInput.value = '1';
        }
        
        const isFinalInput = document.getElementById('is_final');
        if (isFinalInput) {
            isFinalInput.value = '0';
        }
        
        // バージョン表示を更新
        const versionDisplay = document.querySelector('.script-menu-version');
        if (versionDisplay) {
            versionDisplay.textContent = '【第1稿】';
            versionDisplay.classList.remove('final');
        }
        
        // 編集モードをリセット
        const editModeInput = document.getElementById('edit_mode');
        if (editModeInput) {
            editModeInput.value = '0';
        }
        
        // 行番号を更新
        if (window.lineNumberManager) {
            setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
        }
    }
}

// バージョンを開く
function openVersionModal() {
    // モーダルを表示
    const modal = document.getElementById('version-select-modal');
    if (modal) {
        // サーバーからバージョン一覧を取得するAjax処理
        const work_id = document.querySelector('input[name="work_id"]').value;
        const script_id = document.querySelector('input[name="script_id"]').value;
        
        console.log("バージョン一覧取得開始: work_id=" + work_id + ", script_id=" + script_id);
        
        // Fetchを使用してデータを取得
        fetch('get_versions.php?work_id=' + work_id + '&script_id=' + script_id)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(versions => {
                console.log("取得したバージョン:", versions);
                
                const versionList = document.getElementById('version-list');
                if (versionList) {
                    versionList.innerHTML = '';
                    
                    if (versions.length === 0) {
                        // バージョンがない場合のメッセージ
                        const noVersions = document.createElement('div');
                        noVersions.className = 'no-versions';
                        noVersions.textContent = 'バージョンが見つかりません';
                        versionList.appendChild(noVersions);
                    } else {
                        // 取得したバージョン一覧を表示
                        versions.forEach(version => {
                            const versionItem = document.createElement('div');
                            versionItem.className = 'version-item';
                            versionItem.setAttribute('data-version', version.version);
                            versionItem.setAttribute('data-script-id', version.script_id);
                            
                            const versionTitle = document.createElement('span');
                            versionTitle.className = 'version-title';
                            versionTitle.textContent = version.is_final == 1 ? '決定稿' : `第${version.version}稿`;
                            
                            const versionDate = document.createElement('span');
                            versionDate.className = 'version-date';
                            const createdDate = new Date(version.created_at);
                            versionDate.textContent = createdDate.toLocaleString();
                            
                            versionItem.appendChild(versionTitle);
                            versionItem.appendChild(versionDate);
                            versionList.appendChild(versionItem);
                            
                            // クリックイベントの設定
                            versionItem.addEventListener('click', function() {
                                const version_num = this.getAttribute('data-version');
                                const script_id = this.getAttribute('data-script-id');
                                window.location.href = 'index-edit.php?id=' + script_id + '&version=' + version_num;
                            });
                        });
                    }
                }
                
                modal.style.display = 'block';
            })
            .catch(error => {
                console.error('バージョン一覧の取得に失敗しました:', error);
                alert('バージョン一覧の取得に失敗しました: ' + error.message);
            });
    }
}

// バージョンを削除
function deleteVersion() {
    if (confirm('現在のバージョンを削除しますか？この操作は元に戻せません。')) {
        // 削除処理（サーバー通信が必要）
        alert('バージョンを削除しました');
    }
}

// すべてのバージョンを削除
function deleteAllVersions() {
    if (confirm('すべてのバージョンを削除しますか？この操作は元に戻せません。')) {
        // 削除処理（サーバー通信が必要）
        alert('すべてのバージョンを削除しました');
    }
}

// 編集を終了
function exitEdit() {
    if (confirm('編集を終了します。保存していない変更は失われます。')) {
        window.location.href = 'index.php';
    }
}

// 新しいシーンを追加
function addNewScene() {
    const scenes = document.querySelectorAll('.script-scene');
    const newSceneIndex = scenes.length;
    const newSceneId = (newSceneIndex + 1).toString().padStart(3, '0');
    
    // 新しいシーンHTML
    const newSceneHTML = `
    <div class="script-scene" data-scene-index="${newSceneIndex}">
        <div class="scriptarea-hashira">
            <div class="script-hashira-id">${newSceneId}</div>
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
    
    // エディタに追加
    const scriptEditArea = document.getElementById('scriptEditArea');
    if (scriptEditArea) {
        scriptEditArea.insertAdjacentHTML('beforeend', newSceneHTML);
    }
    
    // サイドバーに追加
    const sceneList = document.getElementById('script-scene-list');
    if (sceneList) {
        const newSceneItem = document.createElement('div');
        newSceneItem.className = 'script-sidebar-scene';
        newSceneItem.setAttribute('data-scene', newSceneIndex);
        newSceneItem.textContent = `#${newSceneId} 場所を入力`;
        sceneList.appendChild(newSceneItem);
        
        // クリックイベントを設定
        newSceneItem.addEventListener('click', function() {
            document.querySelectorAll('.script-sidebar-scene').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${newSceneIndex}"]`);
            if (targetScene) {
                targetScene.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // 新しいシーンを選択状態に
        newSceneItem.click();
    }
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 現在のシーンを削除
function deleteCurrentScene() {
    const activeSceneItem = document.querySelector('.script-sidebar-scene.active');
    if (!activeSceneItem) {
        alert('削除するシーンが選択されていません');
        return;
    }
    
    const sceneIndex = activeSceneItem.getAttribute('data-scene');
    const targetScene = document.querySelector(`.script-scene[data-scene-index="${sceneIndex}"]`);
    
    if (!targetScene) {
        alert('選択されたシーンが見つかりません');
        return;
    }
    
    if (document.querySelectorAll('.script-scene').length <= 1) {
        alert('少なくとも1つのシーンが必要です');
        return;
    }
    
    if (confirm('選択中のシーンを削除しますか？この操作は元に戻せません。')) {
        // シーンを削除
        targetScene.remove();
        activeSceneItem.remove();
        
        // シーンインデックスを再調整
        document.querySelectorAll('.script-scene').forEach((scene, index) => {
            scene.setAttribute('data-scene-index', index);
        });
        
        document.querySelectorAll('.script-sidebar-scene').forEach((item, index) => {
            item.setAttribute('data-scene', index);
        });
        
        // 最初のシーンを選択状態に
        const firstSceneItem = document.querySelector('.script-sidebar-scene');
        if (firstSceneItem) {
            firstSceneItem.classList.add('active');
            const firstSceneIndex = firstSceneItem.getAttribute('data-scene');
            const firstScene = document.querySelector(`.script-scene[data-scene-index="${firstSceneIndex}"]`);
            if (firstScene) {
                firstScene.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        // 行番号を更新
        if (window.lineNumberManager) {
            setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
        }
    }
}

// 柱を挿入
function insertHashira() {
    // 現在の選択状態またはカーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === Node.TEXT_NODE) {
        currentElement = currentElement.parentNode;
    }
    
    // 親のシーンを取得
    let currentScene = null;
    let tempElement = currentElement;
    
    while (tempElement && !currentScene) {
        if (tempElement.classList && tempElement.classList.contains('script-scene')) {
            currentScene = tempElement;
            break;
        }
        
        // document.bodyより上には行かないようにする
        if (tempElement === document.body || !tempElement.parentNode) {
            break;
        }
        
        tempElement = tempElement.parentNode;
    }
    
    // 親シーンが見つからない場合は、最初のシーンを使用するか、新規作成
    if (!currentScene) {
        currentScene = document.querySelector('.script-scene');
        
        if (!currentScene) {
            // シーンが1つもない場合は、エディタエリアに新しいシーンを追加
            const scriptEditArea = document.getElementById('scriptEditArea');
            if (!scriptEditArea) {
                alert('エディタエリアが見つかりません');
                return;
            }
            
            const newSceneHTML = `
            <div class="script-scene" data-scene-index="0">
                <div class="scriptarea-hashira">
                    <div class="script-hashira-id">001</div>
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
            
            scriptEditArea.innerHTML = newSceneHTML;
            
            // サイドバーも更新
            const sceneList = document.getElementById('script-scene-list');
            if (sceneList) {
                sceneList.innerHTML = `
                <div class="script-sidebar-scene active" data-scene="0">
                    #001 場所を入力
                </div>
                `;
            }
            
            // 行番号の更新
            if (window.lineNumberManager) {
                setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
            }
            
            return;
        }
    }
    
    // 新しい柱要素を作成
    const scenes = document.querySelectorAll('.script-scene');
    const newSceneIndex = scenes.length;
    const newSceneId = (newSceneIndex + 1).toString().padStart(3, '0');
    
    const hashiraHTML = `
    <div class="scriptarea-hashira">
        <div class="script-hashira-id">${newSceneId}</div>
        <div class="script-hashira-content">
            <div class="script-hashira-location-row">
                <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                <span class="script-hashira-time" contenteditable="true"></span>
            </div>
            <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
        </div>
    </div>
    `;
    
    // 新しいシーンを作成して挿入
    const newScene = document.createElement('div');
    newScene.className = 'script-scene';
    newScene.setAttribute('data-scene-index', scenes.length);
    newScene.innerHTML = hashiraHTML + `
    <div class="scene-layout">
        <div class="scene-left">
            <!-- 左側エリア -->
        </div>
        <div class="scene-right">
            <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
        </div>
    </div>
    `;
    
    // 現在のシーンの後に新しいシーンを挿入
    currentScene.parentNode.insertBefore(newScene, currentScene.nextSibling);
	
	// メニューバーとツールバーの表示修正関数
	function fixHeaderVisibility() {
    // メニューバーとツールバーの参照を取得
    const menuBar = document.querySelector('.script-menu-bar');
    const toolbar = document.querySelector('.script-toolbar');
    
    if (menuBar) {
        // スタイルを強制的にリセット
        menuBar.style.position = 'sticky';
        menuBar.style.top = '0';
        menuBar.style.zIndex = '200';
        menuBar.style.display = 'flex';
        menuBar.style.visibility = 'visible';
    }
    
    if (toolbar) {
        // スタイルを強制的にリセット
        toolbar.style.position = 'sticky';
        toolbar.style.top = (menuBar ? menuBar.offsetHeight + 'px' : '0');
        toolbar.style.zIndex = '199';
        toolbar.style.display = 'flex';
        toolbar.style.visibility = 'visible';
    }
    
    // スクロール位置を調整（少し上にスクロールして全体を表示）
    setTimeout(() => {
        window.scrollTo({
            top: Math.max(0, window.scrollY - 50),
            behavior: 'smooth'
        });
    }, 100);
}
    
    // サイドバーに追加
    const sceneList = document.getElementById('script-scene-list');
    if (sceneList) {
        const newSceneItem = document.createElement('div');
        newSceneItem.className = 'script-sidebar-scene';
        newSceneItem.setAttribute('data-scene', scenes.length);
        newSceneItem.textContent = `#${newSceneId} 場所を入力`;
        sceneList.appendChild(newSceneItem);
        
        // クリックイベントを設定
        newSceneItem.addEventListener('click', function() {
            document.querySelectorAll('.script-sidebar-scene').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${scenes.length}"]`);
            if (targetScene) {
                targetScene.scrollIntoView({ behavior: 'smooth' });
            }
        });    // 新しいシーンを選択状態に
        newSceneItem.click();
    }
    
    // メニューバーとツールバーの表示を修正
    fixHeaderVisibility();
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 隠れ柱を挿入
function insertHiddenHashira() {
    // この関数の実装はあなたのニーズに合わせて追加
    console.log('隠れ柱を挿入します');
}

// 要素挿入のためのヘルパー関数（特定の条件に基づいて挿入位置を決定）
function findInsertPosition(elementType) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode;
    }
    
    // 親のscene-rightを見つける
    let sceneRight = null;
    let tempNode = currentNode;
    while (tempNode && !sceneRight) {
        if (tempNode.classList && tempNode.classList.contains('scene-right')) {
            sceneRight = tempNode;
            break;
        }
        tempNode = tempNode.parentNode;
    }
    
    if (!sceneRight) return null;
    
    // 挿入位置を決定
    let insertTarget;
    let insertBefore = false;
    
    // 現在の要素のタイプに基づいて挿入位置を決定
    if (currentNode.classList) {
        if (currentNode.classList.contains('scriptarea-togaki') ||
            currentNode.classList.contains('scriptarea-togaki-hidden') ||
            currentNode.classList.contains('scriptarea-serifu') ||
            currentNode.classList.contains('scriptarea-serifu-hidden') ||
            currentNode.classList.contains('time-progress') ||
            currentNode.classList.contains('script-page-break')) {
            
            insertTarget = currentNode;
            insertBefore = false; // 要素の後に挿入
        } else if (currentNode.classList.contains('script-serifu-name') ||
                  currentNode.classList.contains('script-serifu-content')) {
            
            // セリフの子要素の場合はセリフ全体を対象に
            insertTarget = currentNode.closest('.scriptarea-serifu') || 
                          currentNode.closest('.scriptarea-serifu-hidden');
            insertBefore = false;
        } else if (currentNode === sceneRight) {
            // scene-right 直下の場合は最後に追加
            insertTarget = sceneRight;
            insertBefore = false;
        } else {
            // その他の場合はscene-rightの最後に追加
            insertTarget = sceneRight;
            insertBefore = false;
        }
    } else {		
		// 要素でない場合はscene-rightの最後に追加
        insertTarget = sceneRight;
        insertBefore = false;
    }
    
    return { target: insertTarget, before: insertBefore, sceneRight: sceneRight };
}

// ト書きを挿入
function insertTogaki() {
    const position = findInsertPosition('togaki');
    if (!position) {
        alert('ト書きを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しいト書き要素を作成
    const togakiElement = document.createElement('div');
    togakiElement.className = 'scriptarea-togaki';
    togakiElement.setAttribute('contenteditable', 'true');
    togakiElement.textContent = 'ト書きを入力...';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(togakiElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(togakiElement);
    } else {
        position.target.parentNode.insertBefore(togakiElement, position.target.nextSibling);
    }
    
    // フォーカスを設定
    setTimeout(() => {
        togakiElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(togakiElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 隠れト書きを挿入
function insertHiddenTogaki() {
    const position = findInsertPosition('togaki');
    if (!position) {
        alert('隠れト書きを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しい隠れト書き要素を作成
    const hiddenTogakiElement = document.createElement('div');
    hiddenTogakiElement.className = 'scriptarea-togaki-hidden';
    hiddenTogakiElement.setAttribute('contenteditable', 'true');
    hiddenTogakiElement.textContent = '隠れト書きを入力...';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(hiddenTogakiElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(hiddenTogakiElement);
    } else {
        position.target.parentNode.insertBefore(hiddenTogakiElement, position.target.nextSibling);
    }
    
    // 表示設定を確認し、必要なら表示
    const viewToggle = document.querySelector('.view-toggle[data-view="hiddenTogaki"]');
    if (viewToggle && viewToggle.getAttribute('data-state') !== 'visible') {
        // 隠れト書きが非表示設定の場合は表示する
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        document.getElementById('scriptEditArea').classList.add('show-hiddenTogaki');
    }
    
    // フォーカスを設定
    setTimeout(() => {
        hiddenTogakiElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(hiddenTogakiElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 隠れ登場人物を挿入
function insertHiddenCharacter() {
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('隠れ登場人物を挿入できる位置が見つかりません');
        return;
    }
    
    // 登場人物選択モーダルを表示
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        // 選択された登場人物用のハンドラを設定
        const handleCharacterSelect = function(characterName) {
            // 新しい隠れセリフ要素を作成
            const hiddenSerifuElement = document.createElement('div');
            hiddenSerifuElement.className = 'scriptarea-serifu-hidden';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'script-serifu-name';
            nameElement.setAttribute('contenteditable', 'true');
            nameElement.dataset.originalName = characterName;
            nameElement.textContent = characterName;
            
            const contentElement = document.createElement('div');
            contentElement.className = 'script-serifu-content';
            contentElement.setAttribute('contenteditable', 'true');
            contentElement.textContent = '';
            
            hiddenSerifuElement.appendChild(nameElement);
            hiddenSerifuElement.appendChild(contentElement);
            
            // 挿入
            if (position.before) {
                position.target.parentNode.insertBefore(hiddenSerifuElement, position.target);
            } else if (position.target === position.sceneRight) {
                position.target.appendChild(hiddenSerifuElement);
            } else {
                position.target.parentNode.insertBefore(hiddenSerifuElement, position.target.nextSibling);
            }
            
            // 表示設定を確認し、必要なら表示
            const viewToggle = document.querySelector('.view-toggle[data-view="hiddenChar"]');
            if (viewToggle && viewToggle.getAttribute('data-state') !== 'visible') {
                // 隠れ登場人物が非表示設定の場合は表示する
                viewToggle.setAttribute('data-state', 'visible');
                viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
                document.getElementById('scriptEditArea').classList.add('show-hiddenChar');
            }
            
            // キャラクター名のフォーマットを適用
            formatCharacterNames();
            
            // フォーカスをセリフ内容に設定
            setTimeout(() => {
                contentElement.focus();
            }, 10);
            
            // 行番号を更新
            if (window.lineNumberManager) {
                setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
            }
            
            // モーダルを閉じる
            modal.style.display = 'none';
            
            // ハンドラを削除
            document.querySelectorAll('.character-item').forEach(item => {
                item.removeEventListener('click', charClickHandler);
            });
            document.getElementById('add-character-btn').removeEventListener('click', addCharHandler);
        };
        
        // キャラクタークリックのハンドラ
        const charClickHandler = function() {
            const characterName = this.getAttribute('data-name');
            handleCharacterSelect(characterName);
        };
        
        // カスタム登場人物追加ハンドラ
        const addCharHandler = function() {
            const customNameInput = document.getElementById('custom-character');
            if (customNameInput && customNameInput.value.trim() !== '') {
                handleCharacterSelect(customNameInput.value.trim());
                customNameInput.value = '';
            }
        };
        
        // イベントリスナーを設定
        document.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', charClickHandler);
        });
        
        document.getElementById('add-character-btn')?.addEventListener('click', addCharHandler);
        
        // モーダルを表示
        modal.style.display = 'block';
        
        // カスタム登場人物の入力欄をフォーカス
        setTimeout(() => {
            const customNameInput = document.getElementById('custom-character');
            if (customNameInput) {
                customNameInput.focus();
            }
        }, 100);
    }
}

// セリフを挿入（登場人物選択モーダルを表示）
function insertSerifu() {
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('セリフを挿入できる位置が見つかりません');
        return;
    }
    
    // 登場人物選択モーダルを表示
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // カスタム登場人物の入力欄をフォーカス
        setTimeout(() => {
            const customNameInput = document.getElementById('custom-character');
            if (customNameInput) {
                customNameInput.focus();
            }
        }, 100);
    }
}

// セリフを挿入する（登場人物名付き）
function insertSerifuWithCharacter(characterName) {
    if (!characterName) return;
    
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('セリフを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しいセリフ要素を作成
    const serifuElement = document.createElement('div');
    serifuElement.className = 'scriptarea-serifu';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'script-serifu-name';
    nameElement.setAttribute('contenteditable', 'true');
    nameElement.dataset.originalName = characterName;
    nameElement.textContent = characterName;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'script-serifu-content';
    contentElement.setAttribute('contenteditable', 'true');
    contentElement.textContent = 'セリフを入力...';
    
    serifuElement.appendChild(nameElement);
    serifuElement.appendChild(contentElement);
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(serifuElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(serifuElement);
    } else {
        position.target.parentNode.insertBefore(serifuElement, position.target.nextSibling);
    }
    
    // キャラクター名のフォーマットを適用
    formatCharacterNames();
    
    // フォーカスをセリフ内容に設定
    setTimeout(() => {
        contentElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 時間経過マークを挿入
function insertTimeProgress() {
    const position = findInsertPosition('togaki');
    if (!position) {
        alert('時間経過を挿入できる位置が見つかりません');
        return;
    }
    
    // 新しい時間経過要素を作成
    const timeProgressElement = document.createElement('div');
    timeProgressElement.className = 'scriptarea-togaki time-progress';
    timeProgressElement.setAttribute('contenteditable', 'true');
    timeProgressElement.textContent = '　　×　　×　　×';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(timeProgressElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(timeProgressElement);
    } else {
        position.target.parentNode.insertBefore(timeProgressElement, position.target.nextSibling);
    }
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// 編集記号を挿入
function insertEditMark(mark) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 選択範囲のコンテナが contenteditable 要素かどうか確認
    let container = range.startContainer;
    while (container && container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentNode;
    }
    
    if (!container || !container.hasAttribute('contenteditable') || container.getAttribute('contenteditable') !== 'true') {
        alert('編集記号は編集可能なエリアに挿入してください');
        return;
    }
    
    // 編集記号を挿入
    const markWrapper = document.createElement('span');
    markWrapper.className = 'edit-mark';
    markWrapper.textContent = `【${mark} 】`;
    
    range.deleteContents();
    range.insertNode(markWrapper);
    
    // 挿入後のカーソル位置を設定（記号の後ろ）
    const newRange = document.createRange();
    newRange.setStartAfter(markWrapper);
    newRange.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // 表示設定を確認し、必要なら表示
    const viewToggle = document.querySelector('.view-toggle[data-view="editMark"]');
    if (viewToggle && viewToggle.getAttribute('data-state') !== 'visible') {
        // 編集記号が非表示設定の場合は表示する
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        document.getElementById('scriptEditArea').classList.add('show-editMark');
    }
}

// 画像挿入（実際の実装はファイル選択ダイアログが必要）
function insertImage() {
    alert('画像挿入機能は準備中です。実際の実装にはファイルアップロード機能が必要です。');
}

// ページ区切りを挿入
function insertPageBreak() {
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('ページ区切りを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しいページ区切り要素を作成
    const pageBreakElement = document.createElement('div');
    pageBreakElement.className = 'script-page-break';
    pageBreakElement.textContent = '＝＝＝＝＝ページ区切り＝＝＝＝＝';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(pageBreakElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(pageBreakElement);
    } else {
        position.target.parentNode.insertBefore(pageBreakElement, position.target.nextSibling);
    }
    
    // 表示設定を確認し、必要なら表示

    const viewToggle = document.querySelector('.view-toggle[data-view="pageBreak"]');
    if (viewToggle && viewToggle.getAttribute('data-state') !== 'visible') {
        // ページ区切りが非表示設定の場合は表示する
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        document.getElementById('scriptEditArea').classList.add('show-pageBreak');
    }
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

// リンクを挿入
function insertLink() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const selectedText = selection.toString();
    if (!selectedText) {
        alert('リンクを設定するテキストを選択してください');
        return;
    }
    
    const url = prompt('リンク先のURLを入力してください:', 'https://');
    
    if (url && url.trim() !== '' && url !== 'https://') {
        const range = selection.getRangeAt(0);
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.target = '_blank';
        linkElement.className = 'script-link';
        
        // 選択範囲をリンクで置き換え
        range.deleteContents();
        linkElement.textContent = selectedText;
        range.insertNode(linkElement);
        
        // 挿入後のカーソル位置を設定（リンクの後ろ）
        const newRange = document.createRange();
        newRange.setStartAfter(linkElement);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

// テキストボックス（縦書き）を挿入
function insertVerticalTextbox() {
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('テキストボックスを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しいテキストボックス要素を作成
    const textboxElement = document.createElement('div');
    textboxElement.className = 'script-textbox-vertical';
    textboxElement.setAttribute('contenteditable', 'true');
    textboxElement.style.writingMode = 'vertical-rl';
    textboxElement.style.border = '1px solid black';
    textboxElement.style.padding = '10px';
    textboxElement.style.minHeight = '150px';
    textboxElement.style.minWidth = '100px';
    textboxElement.style.backgroundColor = 'white';
    textboxElement.style.resize = 'both';
    textboxElement.style.overflow = 'auto';
    textboxElement.style.display = 'inline-block';
    textboxElement.style.margin = '10px';
    textboxElement.style.textOrientation = 'upright';
    textboxElement.textContent = 'テキストを入力...';
    
    // シーンの左側に挿入
    const sceneElement = position.target.closest('.script-scene');
    if (sceneElement) {
        const sceneLeft = sceneElement.querySelector('.scene-left');
        if (sceneLeft) {
            sceneLeft.appendChild(textboxElement);
            
            // フォーカスを設定
            setTimeout(() => {
                textboxElement.focus();
                
                // 内容を全選択
                const range = document.createRange();
                range.selectNodeContents(textboxElement);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }, 10);
        } else {
            alert('テキストボックスを挿入できる左エリアが見つかりません');
        }
    } else {
        alert('テキストボックスを挿入できるシーンが見つかりません');
    }
}

// テキストボックス（横書き）を挿入
function insertHorizontalTextbox() {
    const position = findInsertPosition('serifu');
    if (!position) {
        alert('テキストボックスを挿入できる位置が見つかりません');
        return;
    }
    
    // 新しいテキストボックス要素を作成
    const textboxElement = document.createElement('div');
    textboxElement.className = 'script-textbox-horizontal';
    textboxElement.setAttribute('contenteditable', 'true');
    textboxElement.style.border = '1px solid black';
    textboxElement.style.padding = '10px';
    textboxElement.style.minHeight = '100px';
    textboxElement.style.minWidth = '150px';
    textboxElement.style.backgroundColor = 'white';
    textboxElement.style.resize = 'both';
    textboxElement.style.overflow = 'auto';
    textboxElement.style.display = 'inline-block';
    textboxElement.style.margin = '10px';
    textboxElement.textContent = 'テキストを入力...';
    
    // シーンの左側に挿入
    const sceneElement = position.target.closest('.script-scene');
    if (sceneElement) {
        const sceneLeft = sceneElement.querySelector('.scene-left');
        if (sceneLeft) {
            sceneLeft.appendChild(textboxElement);
            
            // フォーカスを設定
            setTimeout(() => {
                textboxElement.focus();
                
                // 内容を全選択
                const range = document.createRange();
                range.selectNodeContents(textboxElement);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }, 10);
        } else {
            alert('テキストボックスを挿入できる左エリアが見つかりません');
        }
    } else {
        alert('テキストボックスを挿入できるシーンが見つかりません');
    }
}

// カット割り指定を挿入
function insertCutMark() {
    alert('カット割り指定機能は準備中です。');
}

// 香盤情報を表示
function showKoubanInfo(type) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        alert('香盤情報を適用するテキストを選択してください');
        return;
    }
    
    const selectedText = selection.toString();
    if (!selectedText) {
        alert('香盤情報を適用するテキストを選択してください');
        return;
    }
    
    // 香盤情報モーダルを表示
    const modal = document.getElementById('kouban-select-modal');
    if (modal) {
        // 選択したタイプをあらかじめ設定
        const typeSelect = document.getElementById('kouban-type');
        if (typeSelect) {
            typeSelect.value = type === 'all' ? 'character' : type;
        }
        
        modal.style.display = 'block';
        
        // 詳細入力欄をフォーカス
        setTimeout(() => {
            const descInput = document.getElementById('kouban-desc');
            if (descInput) {
                descInput.focus();
            }
        }, 100);
    }
}

// 香盤情報を適用
function applyKoubanInfo(type, description) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 選択範囲を香盤情報で装飾
    const koubanMark = document.createElement('span');
    koubanMark.className = `kouban-${type}`;
    koubanMark.setAttribute('data-kouban-type', type);
    if (description) {
        koubanMark.setAttribute('data-kouban-desc', description);
    }
    
    // 選択範囲をマークで置き換え
    const contents = range.extractContents();
    koubanMark.appendChild(contents);
    range.insertNode(koubanMark);
    
    // 表示設定を確認し、必要なら表示
    const viewToggle = document.querySelector('.view-toggle[data-view="kouban"]');
    if (viewToggle && viewToggle.getAttribute('data-state') !== 'visible') {
        // 香盤情報が非表示設定の場合は表示する
        viewToggle.setAttribute('data-state', 'visible');
        viewToggle.textContent = viewToggle.textContent.replace('表示', '非表示');
        document.getElementById('scriptEditArea').classList.add('show-kouban');
    }
}

// 図形描画機能（実装は省略）
function drawRectangle() {
    alert('四角形の描画機能は準備中です。');
}

function drawCircle() {
    alert('円の描画機能は準備中です。');
}

function drawEllipse() {
    alert('楕円の描画機能は準備中です。');
}

function drawTriangle() {
    alert('三角形の描画機能は準備中です。');
}

function drawLine() {
    alert('直線の描画機能は準備中です。');
}

function drawArrow() {
    alert('矢印の描画機能は準備中です。');
}

function drawBubble() {
    alert('吹き出しの描画機能は準備中です。');
}

// 校閲機能（実装は省略）
function checkSpelling() {
    alert('スペルチェックと文章校正機能は準備中です。');
}

function countCharacters() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 表示されているテキストを取得
    let text = editArea.textContent;
    
    // 文字数をカウント
    const charCount = text.replace(/\s/g, '').length;
    
    // 行数をカウント
    const lineCount = editArea.querySelectorAll('.scriptarea-togaki, .scriptarea-togaki-hidden, .scriptarea-serifu, .scriptarea-serifu-hidden').length;
    
    // シーン数をカウント
    const sceneCount = editArea.querySelectorAll('.script-scene').length;
    
    alert(`文字数: ${charCount}文字\n行数: ${lineCount}行\nシーン数: ${sceneCount}シーン`);
}

function checkProhibitedWords() {
    alert('禁止用語・注意用語チェック機能は準備中です。');
}

// テキスト装飾関連の機能
function applyFormatting(type) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        alert('装飾するテキストを選択してください');
        return;
    }
    
    const selectedText = selection.toString();
    if (!selectedText) {
        alert('装飾するテキストを選択してください');
        return;
    }
    
    const range = selection.getRangeAt(0);
    const formatElement = document.createElement('span');
    
    switch (type) {
        case 'bold':
            formatElement.style.fontWeight = 'bold';
            break;
        case 'italic':
            formatElement.style.fontStyle = 'italic';
            break;
        case 'underline':
            formatElement.style.textDecoration = 'underline';
            break;
        case 'strikethrough':
            formatElement.style.textDecoration = 'line-through';
            break;
        case 'subscript':
            formatElement.style.verticalAlign = 'sub';
            formatElement.style.fontSize = '0.8em';
            break;
        case 'superscript':
            formatElement.style.verticalAlign = 'super';
            formatElement.style.fontSize = '0.8em';
            break;
        case 'box':
            formatElement.style.border = '1px solid black';
            formatElement.style.padding = '0 3px';
            break;
        case 'color':
            const color = prompt('色を指定してください（例: red, #ff0000）:', 'red');
            if (color) {
                formatElement.style.color = color;
            } else {
                return;
            }
            break;
        case 'highlight':
            const bgColor = prompt('背景色を指定してください（例: yellow, #ffff00）:', 'yellow');
            if (bgColor) {
                formatElement.style.backgroundColor = bgColor;
            } else {
                return;
            }
            break;
        case 'pattern':
            formatElement.style.background = 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 5px, #e0e0e0 5px, #e0e0e0 10px)';
            break;
    }
    
    // 選択範囲を装飾付きスパンで置き換え
    const contents = range.extractContents();
    formatElement.appendChild(contents);
    range.insertNode(formatElement);
    
    // 挿入後のカーソル位置を設定（装飾の後ろ）
    const newRange = document.createRange();
    newRange.setStartAfter(formatElement);
    newRange.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// クリップボード操作
function copySelection() {
    document.execCommand('copy');
}

function pasteContent() {
    document.execCommand('paste');
}

// ルビを挿入
function insertRuby() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        alert('ルビを付けるテキストを選択してください');
        return;
    }
    
    const selectedText = selection.toString();
    if (!selectedText) {
        alert('ルビを付けるテキストを選択してください');
        return;
    }
    
    const ruby = prompt('ルビを入力してください:', '');
    
    if (ruby !== null) {
        const range = selection.getRangeAt(0);
        const rubyElement = document.createElement('ruby');
        
        const rbElement = document.createElement('rb');
        rbElement.textContent = selectedText;
        
        const rtElement = document.createElement('rt');
        rtElement.textContent = ruby;
        
        rubyElement.appendChild(rbElement);
        rubyElement.appendChild(rtElement);
        
        // 選択範囲をルビ要素で置き換え
        range.deleteContents();
        range.insertNode(rubyElement);
        
        // 挿入後のカーソル位置を設定（ルビの後ろ）
        const newRange = document.createRange();
        newRange.setStartAfter(rubyElement);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

// フォントサイズを変更
function changeFontSize(size) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        alert('サイズを変更するテキストを選択してください');
        return;
    }
    
    const selectedText = selection.toString();
    if (!selectedText) {
        alert('サイズを変更するテキストを選択してください');
        return;
    }
    
    const range = selection.getRangeAt(0);
    const sizeElement = document.createElement('span');
    
    switch (size) {
        case 'small':
            sizeElement.style.fontSize = '0.8em';
            break;
        case 'medium':
            sizeElement.style.fontSize = '1.2em';
            break;
        case 'large':
            sizeElement.style.fontSize = '1.5em';
            break;
    }
    
    // 選択範囲をスパンで置き換え
    const contents = range.extractContents();
    sizeElement.appendChild(contents);
    range.insertNode(sizeElement);
    
    // 挿入後のカーソル位置を設定
    const newRange = document.createRange();
    newRange.setStartAfter(sizeElement);
    newRange.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// テキスト揃えを変更
function alignText(align) {
    // 現在選択されている要素または親要素を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    // テキストノードの場合は親要素を取得
    if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentNode;
    }
    
    // 適切な親要素を探す
    const validElements = [
        '.scriptarea-togaki',
        '.scriptarea-togaki-hidden',
        '.scriptarea-serifu',
        '.scriptarea-serifu-hidden',
        '.script-serifu-content'
    ];
    
    let targetElement = null;
    
    for (const selector of validElements) {
        const closest = element.closest(selector);
        if (closest) {
            targetElement = closest;
            break;
        }
    }
    
    if (!targetElement) {
        alert('揃えを適用できる要素が選択されていません');
        return;
    }
    
    // 揃えを適用
    switch (align) {
        case 'left':
            targetElement.style.textAlign = 'left';
            break;
        case 'center':
            targetElement.style.textAlign = 'center';
            break;
        case 'right':
            targetElement.style.textAlign = 'right';
            break;
        case 'justify':
            targetElement.style.textAlign = 'justify';
            break;
    }
}

// 特殊文字の挿入
function insertEllipsis() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 選択範囲を省略記号で置き換え
    range.deleteContents();
    const textNode = document.createTextNode('……');
    range.insertNode(textNode);
    
    // 挿入後のカーソル位置を設定（省略記号の後ろ）
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
}

function insertDash() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // 選択範囲を長音記号で置き換え
    range.deleteContents();
    const textNode = document.createTextNode('―');
    range.insertNode(textNode);
    
    // 挿入後のカーソル位置を設定（長音記号の後ろ）
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// リスト関連の機能
function insertBulletList() {
    alert('箇条書きリスト機能は準備中です。');
}

function insertNumberList() {
    alert('番号付きリスト機能は準備中です。');
}

// セリフの連結
function joinSerifu() {
    alert('セリフ連結機能は準備中です。');
}

// キーボードショートカットのハンドラを設定
document.addEventListener('keydown', function(e) {
    // Ctrl+S または Command+S で保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveScript();
    }
});				
				// DOM完全ロード時にメニューバーとツールバーの表示を確保
document.addEventListener('DOMContentLoaded', function() {
    // 柱追加などのアクションボタンにイベントリスナーを追加
    const actionButtons = document.querySelectorAll('.script-dropdown-item, .script-tool-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 少し遅延させてUIが構築された後に実行
            setTimeout(ensureMenuVisibility, 500);
        });
    });
    
    // 初期表示の保証
    ensureMenuVisibility();
});

// メニューバーとツールバーの表示を保証する関数
function ensureMenuVisibility() {
    // メニューバーとツールバーの要素を取得
    const menuBar = document.querySelector('.script-menu-bar');
    const toolbar = document.querySelector('.script-toolbar');
    
    if (menuBar) {
        // 1. 直接スタイルでvisibilityを強制
        menuBar.style.visibility = 'visible';
        menuBar.style.display = 'flex';
        
        // 2. メニューバーのクラスリストにvisibleクラスを追加（もし定義されていれば）
        menuBar.classList.add('visible');
        
        // 3. 親要素のoverflow設定をチェック
        let parent = menuBar.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
                parent.style.overflow = 'visible';
            }
            parent = parent.parentElement;
        }
    }
    
    if (toolbar) {
        // ツールバーにも同様の処理
        toolbar.style.visibility = 'visible';
        toolbar.style.display = 'flex';
        toolbar.classList.add('visible');
    }
    
    // ウィンドウ自体が最上部にスクロールしている場合は、少し下にスクロール
    if (window.scrollY < 10) {
        window.scrollTo(0, 0);
    }
}

/**
 * シーン番号を連番に更新する関数
 * 全てのシーンを走査し、001から始まる連番でシーン番号を振り直す
 */
function renumberScenes() {
    const scenes = document.querySelectorAll('.script-scene');
    
    // シーン番号を振り直し
    scenes.forEach((scene, index) => {
        const sceneNumber = (index + 1).toString().padStart(3, '0');
        
        // シーンのdata属性を更新
        scene.setAttribute('data-scene-index', index);
        
        // シーン内の番号表示を更新
        const idElement = scene.querySelector('.script-hashira-id');
        if (idElement) {
            idElement.textContent = sceneNumber;
        }
    });
    
    // サイドバーのシーン一覧も更新
    updateSceneList();
}

/**
 * サイドバーのシーン一覧を更新する関数
 * 各シーンの場所情報も反映させる
 */
function updateSceneList() {
    const sceneList = document.getElementById('script-scene-list');
    if (!sceneList) return;
    
    // サイドバーをクリア（現在選択中のシーンを記憶）
    const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
    sceneList.innerHTML = '';
    
    // 全シーンを走査して一覧を作成
    const scenes = document.querySelectorAll('.script-scene');
    scenes.forEach((scene, index) => {
        const sceneId = scene.querySelector('.script-hashira-id')?.textContent || (index + 1).toString().padStart(3, '0');
        const location = scene.querySelector('.script-hashira-location')?.textContent || '場所を入力';
        
        // シーン一覧アイテムを作成
        const sceneItem = document.createElement('div');
        sceneItem.className = 'script-sidebar-scene';
        sceneItem.setAttribute('data-scene', index);
        sceneItem.textContent = `#${sceneId} ${location}`;
        
        // もともと選択されていたシーンなら選択状態に
        if (activeSceneIndex && parseInt(activeSceneIndex) === index) {
            sceneItem.classList.add('active');
        }
        
        // クリックイベントを設定
        sceneItem.addEventListener('click', function() {
            document.querySelectorAll('.script-sidebar-scene').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${index}"]`);
            if (targetScene) {
                targetScene.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        sceneList.appendChild(sceneItem);
    });
}

/**
 * シーンの場所情報が変更された時に同期する関数
 */
function setupLocationSync() {
    // 全てのシーンの場所要素に入力イベントを設定
    document.querySelectorAll('.script-hashira-location').forEach(locationElement => {
        locationElement.addEventListener('input', function() {
            // 変更内容をシーン一覧に反映（遅延を入れて処理負荷を軽減）
            clearTimeout(this.syncTimeout);
            this.syncTimeout = setTimeout(() => {
                updateSceneList();
            }, 500);
        });
    });
}

/**
 * コンテンツ編集可能領域のセットアップ強化
 */
function enhanceContentEditableHandling() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 変更イベントのリスナーを追加
    editArea.addEventListener('input', function(e) {
        const target = e.target;
        if (target.classList && target.classList.contains('script-hashira-location')) {
            // 場所が変更された場合、サイドバーに反映
            updateSceneList();
        }
    });
}

/**
 * 柱を挿入する関数（既存関数を修正・強化）
 */
function insertHashira() {
    // 現在の選択状態またはカーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === Node.TEXT_NODE) {
        currentElement = currentElement.parentNode;
    }
    
    // 親のシーンを取得
    let currentScene = null;
    let tempElement = currentElement;
    
    while (tempElement && !currentScene) {
        if (tempElement.classList && tempElement.classList.contains('script-scene')) {
            currentScene = tempElement;
            break;
        }
        
        // document.bodyより上には行かないようにする
        if (tempElement === document.body || !tempElement.parentNode) {
            break;
        }
        
        tempElement = tempElement.parentNode;
    }
    
    // 親シーンが見つからない場合は、最初のシーンを使用するか、新規作成
    if (!currentScene) {
        currentScene = document.querySelector('.script-scene');
        
        if (!currentScene) {
            // シーンが1つもない場合は、エディタエリアに新しいシーンを追加
            const scriptEditArea = document.getElementById('scriptEditArea');
            if (!scriptEditArea) {
                alert('エディタエリアが見つかりません');
                return;
            }
            
            const newSceneHTML = `
            <div class="script-scene" data-scene-index="0">
                <div class="scriptarea-hashira">
                    <div class="script-hashira-id">001</div>
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
            
            scriptEditArea.innerHTML = newSceneHTML;
            
            // サイドバーも更新
            updateSceneList();
            
            // 行番号の更新
            if (window.lineNumberManager) {
                setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
            }
            
            return;
        }
    }
    
    // 次のシーン番号を計算（現在のシーン数+1）
    const scenes = document.querySelectorAll('.script-scene');
    const newSceneIndex = scenes.length;
    const newSceneId = (newSceneIndex + 1).toString().padStart(3, '0');
    
    // 新しい柱要素を作成
    const hashiraHTML = `
    <div class="scriptarea-hashira">
        <div class="script-hashira-id">${newSceneId}</div>
        <div class="script-hashira-content">
            <div class="script-hashira-location-row">
                <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                <span class="script-hashira-time" contenteditable="true"></span>
            </div>
            <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
        </div>
    </div>
    `;
    
    // 新しいシーンを作成して挿入
    const newScene = document.createElement('div');
    newScene.className = 'script-scene';
    newScene.setAttribute('data-scene-index', scenes.length);
    newScene.innerHTML = hashiraHTML + `
    <div class="scene-layout">
        <div class="scene-left">
            <!-- 左側エリア -->
        </div>
        <div class="scene-right">
            <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
        </div>
    </div>
    `;
    
    // 現在のシーンの後に新しいシーンを挿入
    currentScene.parentNode.insertBefore(newScene, currentScene.nextSibling);
    
    // シーン番号を連番に更新し、サイドバーも更新
    renumberScenes();
    
    // 新しいシーンにロケーション変更イベントリスナーを設定
    setupLocationSync();
    
    // 新しいシーンを選択状態に
    const newSceneItem = document.querySelector(`.script-sidebar-scene[data-scene="${newSceneIndex}"]`);
    if (newSceneItem) {
        newSceneItem.click();
    }
    
    // メニューバーとツールバーの表示を修正
    ensureMenuVisibility();
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * 要素挿入のためのヘルパー関数（改善版）
 */
function findInsertPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode;
    }
    
    // 親のscene-rightを見つける
    let sceneRight = null;
    let tempNode = currentNode;
    
    while (tempNode && !tempNode.matches('body')) {
        if (tempNode.classList && tempNode.classList.contains('scene-right')) {
            sceneRight = tempNode;
            break;
        }
        
        // scriptarea-togaki や scriptarea-serifu の場合は、それらの親要素を探す
        if (tempNode.classList && 
            (tempNode.classList.contains('scriptarea-togaki') || 
             tempNode.classList.contains('scriptarea-serifu') ||
             tempNode.classList.contains('scriptarea-togaki-hidden') ||
             tempNode.classList.contains('scriptarea-serifu-hidden'))) {
            
            const parent = tempNode.parentNode;
            if (parent && parent.classList && parent.classList.contains('scene-right')) {
                sceneRight = parent;
                break;
            }
        }
        
        tempNode = tempNode.parentNode;
    }
    
    // scene-rightが見つからない場合は、現在選択中のシーンのscene-rightを使用
    if (!sceneRight) {
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        if (activeSceneIndex) {
            const activeScene = document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`);
            if (activeScene) {
                sceneRight = activeScene.querySelector('.scene-right');
            }
        }
        
        // それでも見つからない場合は最初のシーンを使用
        if (!sceneRight) {
            const firstScene = document.querySelector('.script-scene');
            if (firstScene) {
                sceneRight = firstScene.querySelector('.scene-right');
            }
        }
    }
    
    if (!sceneRight) {
        return null;
    }
    
    // 挿入位置を決定
    let insertTarget;
    let insertBefore = false;
    
    // セリフやト書き要素内の場合はその要素の後に挿入
    if (currentNode.classList) {
        if (currentNode.classList.contains('scriptarea-togaki') || 
            currentNode.classList.contains('scriptarea-togaki-hidden') || 
            currentNode.classList.contains('scriptarea-serifu') || 
            currentNode.classList.contains('scriptarea-serifu-hidden') || 
            currentNode.classList.contains('time-progress') || 
            currentNode.classList.contains('script-page-break')) {
            
            insertTarget = currentNode;
            insertBefore = false; // 要素の後に挿入
        } else if (currentNode.classList.contains('script-serifu-name') || 
                  currentNode.classList.contains('script-serifu-content')) {
            
            // セリフの子要素の場合はセリフ全体を対象に
            insertTarget = currentNode.closest('.scriptarea-serifu') || 
                          currentNode.closest('.scriptarea-serifu-hidden');
            insertBefore = false;
        } else {
            // その他の場合はscene-rightの最後に追加
            insertTarget = sceneRight;
            insertBefore = false;
        }
    } else {
        // 要素でない場合はscene-rightの最後に追加
        insertTarget = sceneRight;
        insertBefore = false;
    }
    
    return { target: insertTarget, before: insertBefore, sceneRight: sceneRight };
}

/**
 * ト書きを挿入する関数（改良版）
 */
function insertTogaki() {
    const position = findInsertPosition();
    if (!position) {
        // 挿入位置が見つからない場合は、現在アクティブなシーンを使用
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        const activeScene = activeSceneIndex ? document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`) : null;
        
        if (activeScene) {
            const sceneRight = activeScene.querySelector('.scene-right');
            if (sceneRight) {
                position = {
                    target: sceneRight,
                    before: false,
                    sceneRight: sceneRight
                };
            }
        }
        
        if (!position) {
            alert('ト書きを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 新しいト書き要素を作成
    const togakiElement = document.createElement('div');
    togakiElement.className = 'scriptarea-togaki';
    togakiElement.setAttribute('contenteditable', 'true');
    togakiElement.textContent = 'ト書きを入力...';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(togakiElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(togakiElement);
    } else {
        position.target.parentNode.insertBefore(togakiElement, position.target.nextSibling);
    }
    
    // フォーカスを設定
    setTimeout(() => {
        togakiElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(togakiElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * セリフ挿入処理の拡張版
 */
function insertSerifu() {
    const position = findInsertPosition();
    if (!position) {
        // 挿入位置が見つからない場合は、現在アクティブなシーンを使用
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        const activeScene = activeSceneIndex ? document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`) : null;
        
        if (activeScene) {
            const sceneRight = activeScene.querySelector('.scene-right');
            if (sceneRight) {
                position = {
                    target: sceneRight,
                    before: false,
                    sceneRight: sceneRight
                };
            }
        }
        
        if (!position) {
            alert('セリフを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 登場人物のプルダウンを作成せずに直接挿入
    insertSerifuWithCharacter('表示名');
}

/**
 * セリフを挿入する（登場人物名付き）- 拡張版
 */
function insertSerifuWithCharacter(characterName) {
    if (!characterName) return;
    
    const position = findInsertPosition();
    if (!position) {
        // 挿入位置が見つからない場合は、現在アクティブなシーンを使用
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        const activeScene = activeSceneIndex ? document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`) : null;
        
        if (activeScene) {
            const sceneRight = activeScene.querySelector('.scene-right');
            if (sceneRight) {
                position = {
                    target: sceneRight,
                    before: false,
                    sceneRight: sceneRight
                };
            }
        }
        
        if (!position) {
            alert('セリフを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 新しいセリフ要素を作成
    const serifuElement = document.createElement('div');
    serifuElement.className = 'scriptarea-serifu';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'script-serifu-name';
    nameElement.setAttribute('contenteditable', 'true');
    nameElement.dataset.originalName = characterName;
    nameElement.textContent = characterName;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'script-serifu-content';
    contentElement.setAttribute('contenteditable', 'true');
    contentElement.textContent = 'セリフを入力...';
    
    serifuElement.appendChild(nameElement);
    serifuElement.appendChild(contentElement);
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(serifuElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(serifuElement);
    } else {
        position.target.parentNode.insertBefore(serifuElement, position.target.nextSibling);
    }
    
    // 登場人物名にイベントリスナーを設定
    setupCharacterNameAutocomplete(nameElement);
    
    // キャラクター名のフォーマットを適用
    formatCharacterNames();
    
    // フォーカスをセリフ内容に設定
    setTimeout(() => {
        contentElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * 登場人物名の自動補完機能をセットアップ
 */
function setupCharacterNameAutocomplete(nameElement) {
    if (!nameElement) return;
    
    // 最近使用した登場人物名のキャッシュ
    if (!window.recentCharacterNames) {
        window.recentCharacterNames = [];
    }
    
    // 名前を選択しやすいように、フォーカス時に全選択
    nameElement.addEventListener('focus', function() {
        const range = document.createRange();
        range.selectNodeContents(this);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 補完候補のリストを表示
        showCharacterSuggestions(this);
    });
    
    // 入力時の処理
    nameElement.addEventListener('input', function() {
        // 名前が変更されたら元の名前を更新
        this.dataset.originalName = this.textContent.trim();
        
        // 入力に応じて補完候補を更新
        updateCharacterSuggestions(this);
    });
    
    // フォーカスが外れた時の処理
    nameElement.addEventListener('blur', function() {
        // 少し遅延させて、候補クリックイベントが先に処理されるようにする
        setTimeout(() => {
            // 候補リストを非表示
            hideCharacterSuggestions();
            
            // 名前のフォーマットを更新
            formatCharacterNames();
            
            // 新しい名前を最近使用したリストに追加
            const name = this.textContent.trim();
            if (name && name !== '表示名') {
                // 既存の同名エントリーを削除
                const index = window.recentCharacterNames.indexOf(name);
                if (index > -1) {
                    window.recentCharacterNames.splice(index, 1);
                }
                
                // リストの先頭に追加
                window.recentCharacterNames.unshift(name);
                
                // 最大5件に制限
                if (window.recentCharacterNames.length > 5) {
                    window.recentCharacterNames.pop();
                }
            }
        }, 150);
    });
}

/**
 * 登場人物名の候補リストを表示
 */
function showCharacterSuggestions(nameElement) {
    // 既存の候補リストを削除
    hideCharacterSuggestions();
    
    // 候補リストを作成
    const suggestionList = document.createElement('div');
    suggestionList.className = 'character-name-suggestions';
    suggestionList.style.position = 'absolute';
    suggestionList.style.zIndex = '1000';
    suggestionList.style.background = '#333';
    suggestionList.style.border = '1px solid #555';
    suggestionList.style.borderRadius = '3px';
    suggestionList.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    suggestionList.style.maxHeight = '150px';
    suggestionList.style.overflowY = 'auto';
    suggestionList.style.width = '150px';
    
    // 要素の位置に合わせて配置
    const rect = nameElement.getBoundingClientRect();
    suggestionList.style.left = rect.left + 'px';
    suggestionList.style.top = (rect.bottom + window.scrollY) + 'px';
    
    // 最近使用した名前と登録済みの名前を候補に追加
    const allCharacterNames = getAllCharacterNames();
    const nameSet = new Set([...window.recentCharacterNames, ...allCharacterNames]);
    
    // 候補が存在する場合のみ候補リストを表示
    if (nameSet.size > 0) {
        // 候補をリストに追加
        nameSet.forEach(name => {
            const item = document.createElement('div');
            item.className = 'character-suggestion-item';
            item.style.padding = '5px 10px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #444';
            item.textContent = name;
            
            // ホバー効果
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#444';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            // クリック時の処理
            item.addEventListener('click', function() {
                nameElement.textContent = this.textContent;
                nameElement.dataset.originalName = this.textContent;
                hideCharacterSuggestions();
                
                // 次のセリフ要素（内容）にフォーカス
                const serifuContent = nameElement.nextElementSibling;
                if (serifuContent && serifuContent.classList.contains('script-serifu-content')) {
                    serifuContent.focus();
                    
                    // 内容を全選択
                    const range = document.createRange();
                    range.selectNodeContents(serifuContent);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
            
            suggestionList.appendChild(item);
        });
        
        // 候補リストを表示
        document.body.appendChild(suggestionList);
        window.currentSuggestionList = suggestionList;
    }
}

/**
 * 入力内容に応じて候補リストを更新
 */
function updateCharacterSuggestions(nameElement) {
    const inputText = nameElement.textContent.trim().toLowerCase();
    
    // 候補リストが存在しない場合は何もしない
    if (!window.currentSuggestionList) {
        showCharacterSuggestions(nameElement);
        return;
    }
    
    // 全ての候補アイテムをチェック
    const items = window.currentSuggestionList.querySelectorAll('.character-suggestion-item');
    let hasVisibleItems = false;
    
    items.forEach(item => {
        const itemText = item.textContent.toLowerCase();
        if (itemText.includes(inputText)) {
            item.style.display = 'block';
            hasVisibleItems = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // 表示する候補がない場合はリストを非表示
    if (!hasVisibleItems) {
        window.currentSuggestionList.style.display = 'none';
    } else {
        window.currentSuggestionList.style.display = 'block';
    }
}

/**
 * 候補リストを非表示にする
 */
function hideCharacterSuggestions() {
    if (window.currentSuggestionList) {
        window.currentSuggestionList.remove();
        window.currentSuggestionList = null;
    }
}

/**
 * 登録済みのすべての登場人物名を取得
 */
function getAllCharacterNames() {
    // 登場人物データベースからの取得を模倣
    // 実際にはAjaxでサーバーから取得するべき
    
    // 現在のページ内の登場人物名を収集
    const names = new Set();
    document.querySelectorAll('.script-serifu-name').forEach(element => {
        const name = element.textContent.trim();
        if (name && name !== '表示名') {
            names.add(name);
        }
    });
    
    // モーダルの登場人物リストからも収集
    document.querySelectorAll('.character-item').forEach(item => {
        const name = item.getAttribute('data-name');
        if (name) {
            names.add(name);
        }
    });
    
    return Array.from(names);
}

// 初期化関数の拡張
function initEditorFunctionsExtended() {
    // シーン番号の連番更新
    renumberScenes();
    
    // シーンの場所情報変更時の同期設定
    setupLocationSync();
    
    // コンテンツ編集イベントの強化
    enhanceContentEditableHandling();
    
    // 最近使用した登場人物名の初期化
    window.recentCharacterNames = [];
}

// DOMロード時に拡張機能も初期化
document.addEventListener('DOMContentLoaded', function() {
    // 既存の初期化後に追加の初期化を実行
    setTimeout(initEditorFunctionsExtended, 500);
});

// 挿入メニュー関連の機能修正セット（改良版）

/**
 * シーン番号を連番に更新する関数
 * 全てのシーンを走査し、001から始まる連番でシーン番号を振り直す
 */
function renumberScenes() {
    const scenes = document.querySelectorAll('.script-scene');
    
    // シーン番号を振り直し
    scenes.forEach((scene, index) => {
        const sceneNumber = (index + 1).toString().padStart(3, '0');
        
        // シーンのdata属性を更新
        scene.setAttribute('data-scene-index', index);
        
        // シーン内の番号表示を更新
        const idElement = scene.querySelector('.script-hashira-id');
        if (idElement) {
            idElement.textContent = sceneNumber;
        }
    });
    
    // サイドバーのシーン一覧も更新
    updateSceneList();
}

/**
 * サイドバーのシーン一覧を更新する関数
 * 各シーンの場所情報も反映させる
 */
function updateSceneList() {
    const sceneList = document.getElementById('script-scene-list');
    if (!sceneList) return;
    
    // サイドバーをクリア（現在選択中のシーンを記憶）
    const activeSceneElement = document.querySelector('.script-sidebar-scene.active');
    const activeSceneIndex = activeSceneElement?.getAttribute('data-scene');
    sceneList.innerHTML = '';
    
    // 全シーンを走査して一覧を作成
    const scenes = document.querySelectorAll('.script-scene');
    scenes.forEach((scene, index) => {
        const sceneId = scene.querySelector('.script-hashira-id')?.textContent || (index + 1).toString().padStart(3, '0');
        const location = scene.querySelector('.script-hashira-location')?.textContent || '場所を入力';
        
        // シーン一覧アイテムを作成
        const sceneItem = document.createElement('div');
        sceneItem.className = 'script-sidebar-scene';
        sceneItem.setAttribute('data-scene', index);
        sceneItem.textContent = `#${sceneId} ${location}`;
        
        // もともと選択されていたシーンなら選択状態に
        if (activeSceneIndex && parseInt(activeSceneIndex) === index) {
            sceneItem.classList.add('active');
        }
        
        // クリックイベントを設定
        sceneItem.addEventListener('click', function() {
            document.querySelectorAll('.script-sidebar-scene').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${index}"]`);
            if (targetScene) {
                // スクロール前にメニュー表示を確保
                ensureMenuVisibility();
                
                // 台本編集エリア内のみスクロール（親要素のスクロールにする）
                const editArea = document.getElementById('scriptEditArea');
                if (editArea) {
                    // スクロール位置を計算
                    const editAreaRect = editArea.getBoundingClientRect();
                    const targetRect = targetScene.getBoundingClientRect();
                    const relativeTop = targetRect.top - editAreaRect.top;
                    
                    // エリア内でスクロール
                    editArea.scrollTop += relativeTop;
                } else {
                    // フォールバック: 通常スクロール（避けたい）
                    targetScene.scrollIntoView({ behavior: 'smooth' });
                }
                
                // スクロール後もメニュー表示を確保
                setTimeout(ensureMenuVisibility, 300);
            }
        });
        
        sceneList.appendChild(sceneItem);
    });
}

/**
 * シーンの場所情報が変更された時に同期する関数
 */
function setupLocationSync() {
    // シーンの場所要素に入力イベントを設定
    const setupLocationEvents = () => {
        document.querySelectorAll('.script-hashira-location').forEach(locationElement => {
            // 既にイベントが設定されている場合はスキップ
            if (locationElement.hasLocationEvent) return;
            
            // inputイベントでリアルタイム更新
            locationElement.addEventListener('input', function() {
                // 変更の度に即時更新
                updateSceneList();
            });
            
            // イベント設定済みフラグ
            locationElement.hasLocationEvent = true;
        });
    };
    
    // 初回設定
    setupLocationEvents();
    
    // エディタ全体の変更も監視
    const editArea = document.getElementById('scriptEditArea');
    if (editArea) {
        const observer = new MutationObserver(() => {
            // DOM変更があったら再度イベントを設定
            setupLocationEvents();
        });
        
        observer.observe(editArea, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * コンテンツ編集可能領域のセットアップ強化
 */
function enhanceContentEditableHandling() {
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 変更イベントのリスナーを追加
    editArea.addEventListener('input', function(e) {
        const target = e.target;
        if (target.classList && target.classList.contains('script-hashira-location')) {
            // 場所が変更された場合、サイドバーに反映
            updateSceneList();
        }
    });
    
    // エンターキー押下時の特別な処理
    editArea.addEventListener('keydown', function(e) {
        // Enterキーが押された場合の処理
        if (e.key === 'Enter' && !e.shiftKey) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            let element = range.startContainer;
            
            // テキストノードの場合は親要素を取得
            if (element.nodeType === Node.TEXT_NODE) {
                element = element.parentNode;
            }
            
            // セリフ内容の場合
            if (element.classList && element.classList.contains('script-serifu-content')) {
                e.preventDefault();
                
                // 現在のセリフ要素を取得
                const serifuElement = element.closest('.scriptarea-serifu') || element.closest('.scriptarea-serifu-hidden');
                if (serifuElement) {
                    // 新しいセリフを挿入
                    // 登場人物名を取得（同じ名前を使用）
                    const characterName = serifuElement.querySelector('.script-serifu-name')?.dataset.originalName || 
                        serifuElement.querySelector('.script-serifu-name')?.textContent || '表示名';
                    
                    // 位置情報を生成
                    const position = {
                        target: serifuElement,
                        before: false,
                        sceneRight: serifuElement.closest('.scene-right')
                    };
                    
                    // セリフ挿入時に「」を含める
                    insertSerifuWithCharacterAfter(characterName, position);
                }
                
                return;
            }
            
            // ト書き内容の場合
            if (element.classList && (element.classList.contains('scriptarea-togaki') || element.classList.contains('scriptarea-togaki-hidden'))) {
                e.preventDefault();
                
                // 現在のト書き要素を取得
                const togakiElement = element;
                
                // 新しいト書きを挿入
                // 位置情報を生成
                const position = {
                    target: togakiElement,
                    before: false,
                    sceneRight: togakiElement.closest('.scene-right')
                };
                
                // ト書き挿入
                insertTogakiAfter(position);
                
                return;
            }
        }
    });
}

/**
 * 柱を挿入する関数（既存関数を修正・強化）
 */
function insertHashira() {
    // メニューとツールバーの表示を確保
    ensureMenuVisibility();
    
    // 現在の選択状態またはカーソル位置を取得
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentElement.nodeType === Node.TEXT_NODE) {
        currentElement = currentElement.parentNode;
    }
    
    // 親のシーンを取得
    let currentScene = null;
    let tempElement = currentElement;
    
    while (tempElement && !currentScene) {
        if (tempElement.classList && tempElement.classList.contains('script-scene')) {
            currentScene = tempElement;
            break;
        }
        
        // document.bodyより上には行かないようにする
        if (tempElement === document.body || !tempElement.parentNode) {
            break;
        }
        
        tempElement = tempElement.parentNode;
    }
    
    // 親シーンが見つからない場合は、最初のシーンを使用するか、新規作成
    if (!currentScene) {
        currentScene = document.querySelector('.script-scene');
        
        if (!currentScene) {
            // シーンが1つもない場合は、エディタエリアに新しいシーンを追加
            const scriptEditArea = document.getElementById('scriptEditArea');
            if (!scriptEditArea) {
                alert('エディタエリアが見つかりません');
                return;
            }
            
            const newSceneHTML = `
            <div class="script-scene" data-scene-index="0">
                <div class="scriptarea-hashira">
                    <div class="script-hashira-id">001</div>
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
            
            scriptEditArea.innerHTML = newSceneHTML;
            
            // サイドバーも更新
            updateSceneList();
            
            // 行番号の更新
            if (window.lineNumberManager) {
                setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
            }
            
            return;
        }
    }
    
    // 次のシーン番号を計算（現在のシーン数+1）
    const scenes = document.querySelectorAll('.script-scene');
    const newSceneIndex = scenes.length;
    const newSceneId = (newSceneIndex + 1).toString().padStart(3, '0');
    
    // 新しい柱要素を作成
    const hashiraHTML = `
    <div class="scriptarea-hashira">
        <div class="script-hashira-id">${newSceneId}</div>
        <div class="script-hashira-content">
            <div class="script-hashira-location-row">
                <span class="script-hashira-location" contenteditable="true">場所を入力</span>
                <span class="script-hashira-time" contenteditable="true"></span>
            </div>
            <div class="scriptarea-hashira-hidden" contenteditable="true"></div>
        </div>
    </div>
    `;
    
    // 新しいシーンを作成して挿入
    const newScene = document.createElement('div');
    newScene.className = 'script-scene';
    newScene.setAttribute('data-scene-index', scenes.length);
    newScene.innerHTML = hashiraHTML + `
    <div class="scene-layout">
        <div class="scene-left">
            <!-- 左側エリア -->
        </div>
        <div class="scene-right">
            <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
        </div>
    </div>
    `;
    
    // 現在のシーンの後に新しいシーンを挿入
    currentScene.parentNode.insertBefore(newScene, currentScene.nextSibling);
    
    // シーン番号を連番に更新し、サイドバーも更新
    renumberScenes();
    
    // 新しいシーンにロケーション変更イベントリスナーを設定
    setupLocationSync();
    
    // 新しいシーンを選択状態に
    const newSceneItem = document.querySelector(`.script-sidebar-scene[data-scene="${newSceneIndex}"]`);
    if (newSceneItem) {
        newSceneItem.click();
    }
    
    // メニューバーとツールバーの表示を修正
    ensureMenuVisibility();
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * 要素挿入のためのヘルパー関数（改善版）
 */
function findInsertPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // テキストノードの場合は親要素を取得
    if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode;
    }
    
    // 親のscene-rightを見つける
    let sceneRight = null;
    let tempNode = currentNode;
    
    while (tempNode && tempNode.nodeName !== 'BODY') {
        if (tempNode.classList && tempNode.classList.contains('scene-right')) {
            sceneRight = tempNode;
            break;
        }
        
        // scriptarea-togaki や scriptarea-serifu の場合は、それらの親要素を探す
        if (tempNode.classList && 
            (tempNode.classList.contains('scriptarea-togaki') || 
             tempNode.classList.contains('scriptarea-serifu') ||
             tempNode.classList.contains('scriptarea-togaki-hidden') ||
             tempNode.classList.contains('scriptarea-serifu-hidden'))) {
            
            const parent = tempNode.parentNode;
            if (parent && parent.classList && parent.classList.contains('scene-right')) {
                sceneRight = parent;
                break;
            }
        }
        
        tempNode = tempNode.parentNode;
    }
    
    // scene-rightが見つからない場合は、現在選択中のシーンのscene-rightを使用
    if (!sceneRight) {
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        if (activeSceneIndex) {
            const activeScene = document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`);
            if (activeScene) {
                sceneRight = activeScene.querySelector('.scene-right');
            }
        }
        
        // それでも見つからない場合は最初のシーンを使用
        if (!sceneRight) {
            const firstScene = document.querySelector('.script-scene');
            if (firstScene) {
                sceneRight = firstScene.querySelector('.scene-right');
            }
        }
    }
    
    if (!sceneRight) {
        return null;
    }
    
    // 挿入位置を決定
    let insertTarget;
    let insertBefore = false;
    
    // セリフやト書き要素内の場合はその要素の後に挿入
    if (currentNode.classList) {
        if (currentNode.classList.contains('scriptarea-togaki') || 
            currentNode.classList.contains('scriptarea-togaki-hidden') || 
            currentNode.classList.contains('scriptarea-serifu') || 
            currentNode.classList.contains('scriptarea-serifu-hidden') || 
            currentNode.classList.contains('time-progress') || 
            currentNode.classList.contains('script-page-break')) {
            
            insertTarget = currentNode;
            insertBefore = false; // 要素の後に挿入
        } else if (currentNode.classList.contains('script-serifu-name') || 
                  currentNode.classList.contains('script-serifu-content')) {
            
            // セリフの子要素の場合はセリフ全体を対象に
            insertTarget = currentNode.closest('.scriptarea-serifu') || 
                          currentNode.closest('.scriptarea-serifu-hidden');
            insertBefore = false;
        } else {
            // その他の場合はscene-rightの最後に追加
            insertTarget = sceneRight;
            insertBefore = false;
        }
    } else {
        // 要素でない場合はscene-rightの最後に追加
        insertTarget = sceneRight;
        insertBefore = false;
    }
    
    return { target: insertTarget, before: insertBefore, sceneRight: sceneRight };
}

/**
 * ト書きを挿入する関数（改良版）
 */
function insertTogaki() {
    // メニューとツールバーの表示を確保
    ensureMenuVisibility();
    
    const position = findInsertPosition();
    if (!position) {
        // 挿入位置が見つからない場合は、現在アクティブなシーンを使用
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        const activeScene = activeSceneIndex ? document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`) : null;
        
        if (activeScene) {
            const sceneRight = activeScene.querySelector('.scene-right');
            if (sceneRight) {
                position = {
                    target: sceneRight,
                    before: false,
                    sceneRight: sceneRight
                };
            }
        }
        
        if (!position) {
            alert('ト書きを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 新しいト書き要素を作成
    const togakiElement = document.createElement('div');
    togakiElement.className = 'scriptarea-togaki';
    togakiElement.setAttribute('contenteditable', 'true');
    togakiElement.textContent = 'ト書きを入力...';
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(togakiElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(togakiElement);
    } else {
        position.target.parentNode.insertBefore(togakiElement, position.target.nextSibling);
    }
    
    // フォーカスを設定
    setTimeout(() => {
        togakiElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(togakiElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * 特定位置の後にト書きを挿入（連続入力用）
 */
function insertTogakiAfter(position) {
    if (!position) return;
    
    // 新しいト書き要素を作成
    const togakiElement = document.createElement('div');
    togakiElement.className = 'scriptarea-togaki';
    togakiElement.setAttribute('contenteditable', 'true');
    togakiElement.textContent = '';
    
    // 挿入
    position.target.parentNode.insertBefore(togakiElement, position.target.nextSibling);
    
    // フォーカスを設定
    setTimeout(() => {
        togakiElement.focus();
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
}

/**
 * セリフ挿入処理の拡張版
 */
function insertSerifu() {
    // メニューとツールバーの表示を確保
    ensureMenuVisibility();
    
    const position = findInsertPosition();
    if (!position) {
        // 挿入位置が見つからない場合は、現在アクティブなシーンを使用
        const activeSceneIndex = document.querySelector('.script-sidebar-scene.active')?.getAttribute('data-scene');
        const activeScene = activeSceneIndex ? document.querySelector(`.script-scene[data-scene-index="${activeSceneIndex}"]`) : null;
        
        if (activeScene) {
            const sceneRight = activeScene.querySelector('.scene-right');
            if (sceneRight) {
                position = {
                    target: sceneRight,
                    before: false,
                    sceneRight: sceneRight
                };
            }
        }
        
        if (!position) {
            alert('セリフを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 登場人物のプルダウンを表示（モーダルを使用）
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        // モーダル表示時の処理を設定
        window.currentInsertPosition = position; // 挿入位置を保存
        
        // モーダルを表示
        modal.style.display = 'block';
        
        // カスタム登場人物名の入力フィールドにフォーカス
        setTimeout(() => {
            const customNameInput = document.getElementById('custom-character');
            if (customNameInput) {
                customNameInput.focus();
            }
        }, 100);
    } else {
        // モーダルがない場合は直接挿入
        insertSerifuWithCharacter('表示名', position);
    }
}

/**
 * セリフを挿入する（登場人物名付き）- 拡張版
 */
function insertSerifuWithCharacter(characterName, position) {
    if (!characterName) return;
    
    // 位置が指定されていない場合は検出
    if (!position) {
        position = findInsertPosition();
        if (!position) {
            alert('セリフを挿入できる位置が見つかりません。シーンを選択してください。');
            return;
        }
    }
    
    // 新しいセリフ要素を作成
    const serifuElement = document.createElement('div');
    serifuElement.className = 'scriptarea-serifu';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'script-serifu-name';
    nameElement.setAttribute('contenteditable', 'true');
    nameElement.dataset.originalName = characterName;
    nameElement.textContent = characterName;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'script-serifu-content';
    contentElement.setAttribute('contenteditable', 'true');
    contentElement.textContent = '「セリフを入力...」';
    
    serifuElement.appendChild(nameElement);
    serifuElement.appendChild(contentElement);
    
    // 挿入
    if (position.before) {
        position.target.parentNode.insertBefore(serifuElement, position.target);
    } else if (position.target === position.sceneRight) {
        position.target.appendChild(serifuElement);
    } else {
        position.target.parentNode.insertBefore(serifuElement, position.target.nextSibling);
    }
    
    // 登場人物名にイベントリスナーを設定
    setupCharacterNameAutocomplete(nameElement);
    
    // キャラクター名のフォーマットを適用
    formatCharacterNames();
    
    // フォーカスをセリフ内容に設定
    setTimeout(() => {
        contentElement.focus();
        
        // 内容を全選択
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        
        // 「」の間にカーソルを配置するよう調整
        if (contentElement.textContent === '「セリフを入力...」') {
            range.setStart(contentElement.firstChild, 1); // 「の後
            range.setEnd(contentElement.firstChild, contentElement.textContent.length - 1); // 」の前
        }
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, 10);
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
    
    return serifuElement;
}

/**
 * 連続セリフ入力用の挿入関数
 */
function insertSerifuWithCharacterAfter(characterName, position) {
    if (!characterName || !position) return;
    
    // 新しいセリフ要素を挿入
    const serifuElement = insertSerifuWithCharacter(characterName, position);
    
    // 挿入後の処理（必要に応じて追加）
    return serifuElement;
}

/**
 * 登場人物名の自動補完機能をセットアップ
 */
function setupCharacterNameAutocomplete(nameElement) {
    if (!nameElement) return;
    
    // 最近使用した登場人物名のキャッシュ
    if (!window.recentCharacterNames) {
        window.recentCharacterNames = [];
    }
    
    // 名前を選択しやすいように、フォーカス時に全選択
    nameElement.addEventListener('focus', function() {
        const range = document.createRange();
        range.selectNodeContents(this);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 元のテキストが「表示名」の場合は空にする
        if (this.textContent.trim() === '表示名') {
            this.textContent = '';
        }
        
        // 補完候補のリストを表示
        showCharacterSuggestions(this);
    });
    
    // 入力時の処理
    nameElement.addEventListener('input', function() {
        // 名前が変更されたら元の名前を更新
        const newName = this.textContent.trim();
        this.dataset.originalName = newName || '表示名';
        
        // 入力に応じて補完候補を更新
        updateCharacterSuggestions(this);
    });
    
    // フォーカスが外れた時の処理
    nameElement.addEventListener('blur', function() {
        // 少し遅延させて、候補クリックイベントが先に処理されるようにする
        setTimeout(() => {
            // 候補リストを非表示
            hideCharacterSuggestions();
            
            // テキストが空の場合は「表示名」に戻す
            if (!this.textContent.trim()) {
                this.textContent = '表示名';
            }
            
            // 名前のフォーマットを更新
            formatCharacterNames();
            
            // 新しい名前を最近使用したリストに追加
            const name = this.textContent.trim();
            if (name && name !== '表示名') {
                // 既存の同名エントリーを削除
                const index = window.recentCharacterNames.indexOf(name);
                if (index > -1) {
                    window.recentCharacterNames.splice(index, 1);
                }
                
                // リストの先頭に追加
                window.recentCharacterNames.unshift(name);
                
                // 最大5件に制限
                if (window.recentCharacterNames.length > 5) {
                    window.recentCharacterNames.pop();
                }
            }
        }, 150);
    });
}

/**
 * 登場人物名の候補リストを表示
 */
function showCharacterSuggestions(nameElement) {
    // 既存の候補リストを削除
    hideCharacterSuggestions();
    
    // 候補リストを作成
    const suggestionList = document.createElement('div');
    suggestionList.id = 'character-name-suggestions';
    suggestionList.style.position = 'absolute';
    suggestionList.style.zIndex = '1000';
    suggestionList.style.background = '#333';
    suggestionList.style.border = '1px solid #555';
    suggestionList.style.borderRadius = '3px';
    suggestionList.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    suggestionList.style.maxHeight = '150px';
    suggestionList.style.overflowY = 'auto';
    suggestionList.style.width = '150px';
    
    // 要素の位置に合わせて配置
    const rect = nameElement.getBoundingClientRect();
    suggestionList.style.left = rect.left + 'px';
    suggestionList.style.top = (rect.bottom + window.scrollY) + 'px';
    
    // 最近使用した名前と登録済みの名前を候補に追加
    const allCharacterNames = getAllCharacterNames();
    const nameSet = new Set([...window.recentCharacterNames, ...allCharacterNames]);
    
    // 候補が存在する場合のみ候補リストを表示
    if (nameSet.size > 0) {
        // 候補をリストに追加
        nameSet.forEach(name => {
            // 空名は除外
            if (!name.trim()) return;
            
            const item = document.createElement('div');
            item.className = 'character-suggestion-item';
            item.style.padding = '5px 10px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #444';
            item.textContent = name;
            
            // ホバー効果
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#444';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            // クリック時の処理
            item.addEventListener('click', function() {
                nameElement.textContent = this.textContent;
                nameElement.dataset.originalName = this.textContent;
                hideCharacterSuggestions();
                
                // フォーマットを適用
                formatCharacterNames();
                
                // 次のセリフ要素（内容）にフォーカス
                const serifuContent = nameElement.nextElementSibling;
                if (serifuContent && serifuContent.classList.contains('script-serifu-content')) {
                    serifuContent.focus();
                    
                    // 内容を全選択（「」の間）
                    if (serifuContent.textContent === '「セリフを入力...」') {
                        const range = document.createRange();
                        range.setStart(serifuContent.firstChild, 1); // 「の後
                        range.setEnd(serifuContent.firstChild, serifuContent.textContent.length - 1); // 」の前
                        
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        const range = document.createRange();
                        range.selectNodeContents(serifuContent);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            });
            
            suggestionList.appendChild(item);
        });
        
        // 候補リストを表示
        document.body.appendChild(suggestionList);
        window.currentSuggestionList = suggestionList;
    }
}

/**
 * 入力内容に応じて候補リストを更新
 */
function updateCharacterSuggestions(nameElement) {
    const inputText = nameElement.textContent.trim().toLowerCase();
    
    // 候補リストが存在しない場合は何もしない
    if (!window.currentSuggestionList) {
        showCharacterSuggestions(nameElement);
        return;
    }
    
    // 全ての候補アイテムをチェック
    const items = window.currentSuggestionList.querySelectorAll('.character-suggestion-item');
    let hasVisibleItems = false;
    
    items.forEach(item => {
        const itemText = item.textContent.toLowerCase();
        if (itemText.includes(inputText)) {
            item.style.display = 'block';
            hasVisibleItems = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // 表示する候補がない場合はリストを非表示
    if (!hasVisibleItems) {
        window.currentSuggestionList.style.display = 'none';
    } else {
        window.currentSuggestionList.style.display = 'block';
    }
}

/**
 * 候補リストを非表示にする
 */
function hideCharacterSuggestions() {
    const list = document.getElementById('character-name-suggestions');
    if (list) {
        list.remove();
    }
    window.currentSuggestionList = null;
}

/**
 * 登録済みのすべての登場人物名を取得
 */
function getAllCharacterNames() {
    // 登場人物データベースからの取得を模倣
    // 実際にはAjaxでサーバーから取得するべき
    
    // 現在のページ内の登場人物名を収集
    const names = new Set();
    document.querySelectorAll('.script-serifu-name').forEach(element => {
        const name = element.dataset.originalName || element.textContent.trim();
        if (name && name !== '表示名') {
            names.add(name);
        }
    });
    
    // モーダルの登場人物リストからも収集
    document.querySelectorAll('.character-item').forEach(item => {
        const name = item.getAttribute('data-name');
        if (name) {
            names.add(name);
        }
    });
    
    return Array.from(names);
}

/**
 * 既存のモーダル関連設定を強化
 */
function enhanceExistingModals() {
    // 登場人物選択モーダルを強化
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        // 登場人物クリック時の処理を更新
        document.querySelectorAll('.character-item').forEach(item => {
            // 既存のイベントリスナーを削除
            const clone = item.cloneNode(true);
            item.parentNode.replaceChild(clone, item);
            
            // 新しいイベントリスナーを設定
            clone.addEventListener('click', function() {
                const characterName = this.getAttribute('data-name');
                
                // 保存されている挿入位置を使用
                const position = window.currentInsertPosition;
                insertSerifuWithCharacter(characterName, position);
                
                // モーダルを閉じる
                modal.style.display = 'none';
            });
        });
        
        // カスタム登場人物の追加
        const addCharBtn = document.getElementById('add-character-btn');
        if (addCharBtn) {
            // 既存のイベントリスナーを削除
            const clone = addCharBtn.cloneNode(true);
            addCharBtn.parentNode.replaceChild(clone, addCharBtn);
            
            // 新しいイベントリスナーを設定
            clone.addEventListener('click', function() {
                const customNameInput = document.getElementById('custom-character');
                if (customNameInput && customNameInput.value.trim() !== '') {
                    // 保存されている挿入位置を使用
                    const position = window.currentInsertPosition;
                    insertSerifuWithCharacter(customNameInput.value.trim(), position);
                    
                    // モーダルを閉じてフィールドをクリア
                    modal.style.display = 'none';
                    customNameInput.value = '';
                }
            });
            
            // カスタム入力欄でEnterキーを押したときの処理
            const customNameInput = document.getElementById('custom-character');
            if (customNameInput) {
                customNameInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        clone.click(); // 追加ボタンのクリックをシミュレート
                    }
                });
            }
        }
    }
}

// 初期化関数の拡張
function initEditorFunctionsExtended() {
    // シーン番号の連番更新
    renumberScenes();
    
    // シーンの場所情報変更時の同期設定
    setupLocationSync();
    
    // コンテンツ編集イベントの強化
    enhanceContentEditableHandling();
    
    // 既存のモーダルを強化
    enhanceExistingModals();
    
    // 最近使用した登場人物名の初期化
    window.recentCharacterNames = [];
    
    // メニューとツールバーの表示を修正（既存関数を使用）
    ensureMenuVisibility();
    
    // メニュー項目のイベントハンドラを更新（既存のものを上書き）
    updateMenuEventHandlers();
}

/**
 * メニュー項目のイベントハンドラを強制的に更新
 */
function updateMenuEventHandlers() {
    // 挿入メニュー
    const menuInsertTogaki = document.getElementById('menuInsertTogaki');
    const menuInsertSerifu = document.getElementById('menuInsertSerifu');
    
    if (menuInsertTogaki) {
        // 既存のイベントハンドラを削除（クローンして置き換え）
        const menuInsertTogakiClone = menuInsertTogaki.cloneNode(true);
        menuInsertTogaki.parentNode.replaceChild(menuInsertTogakiClone, menuInsertTogaki);
        
        // 新しいイベントハンドラを設定
        menuInsertTogakiClone.addEventListener('click', insertTogaki);
    }
    
    if (menuInsertSerifu) {
        // 既存のイベントハンドラを削除（クローンして置き換え）
        const menuInsertSerifuClone = menuInsertSerifu.cloneNode(true);
        menuInsertSerifu.parentNode.replaceChild(menuInsertSerifuClone, menuInsertSerifu);
        
        // 新しいイベントハンドラを設定
        menuInsertSerifuClone.addEventListener('click', insertSerifu);
    }
}

// DOMロード時に拡張機能も初期化
document.addEventListener('DOMContentLoaded', function() {
    // 既存の初期化後に追加の初期化を実行
    setTimeout(initEditorFunctionsExtended, 500);
});

// シーン関連機能の改良コード

/**
 * シーンの場所情報が変更された時に同期する関数（改良版）
 */
function setupLocationSyncImproved() {
    console.log("場所同期機能の強化を実行しています");
    
    // エディタエリアを取得
    const editArea = document.getElementById('scriptEditArea');
    if (!editArea) return;
    
    // 直接の入力イベントをリッスン（バブリングを利用）
    editArea.addEventListener('input', function(e) {
        // イベントの発生元が場所要素の場合のみ処理
        if (e.target && e.target.classList && e.target.classList.contains('script-hashira-location')) {
            console.log("場所の変更を検出: ", e.target.textContent);
            // 変更を即時反映
            updateSceneList();
        }
    });
    
    // MutationObserverを使用して入力の変更を監視
    const observer = new MutationObserver(function(mutations) {
        let needsUpdate = false;
        
        // 変更内容をチェック
        mutations.forEach(mutation => {
            // テキスト変更を確認
            if (mutation.type === 'characterData') {
                // 親要素を辿って場所要素かどうか確認
                let node = mutation.target;
                while (node && node.nodeType !== Node.ELEMENT_NODE) {
                    node = node.parentNode;
                }
                
                if (node && node.classList && node.classList.contains('script-hashira-location')) {
                    needsUpdate = true;
                }
            }
            
            // 子要素の追加/削除を確認（シーンが追加/削除された場合）
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                needsUpdate = true;
            }
        });
        
        // 更新が必要な場合のみ実行
        if (needsUpdate) {
            console.log("DOM変更によるシーン一覧更新");
            updateSceneList();
        }
    });
    
    // 監視の設定
    observer.observe(editArea, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // シーン番号の編集制限を設定
    setupSceneNumberRestriction();
}

/**
 * シーン番号の編集制限を設定
 * - 入力不可、削除可能に設定
 */
function setupSceneNumberRestriction() {
    console.log("シーン番号の編集制限を設定");
    
    // 全てのシーン番号要素に対して処理
    const sceneNumbers = document.querySelectorAll('.script-hashira-id');
    sceneNumbers.forEach(element => {
        // 既に設定済みならスキップ
        if (element.hasSceneNumberRestriction) return;
        
        // クリックやフォーカスイベントを無効化
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        element.addEventListener('focus', function(e) {
            this.blur(); // フォーカスを即時解除
        });
        
        // contentEditableを無効化
        element.setAttribute('contenteditable', 'false');
        
        // 設定済みフラグ
        element.hasSceneNumberRestriction = true;
    });
    
    // 新しく追加される要素にも対応するために監視
    const editArea = document.getElementById('scriptEditArea');
    if (editArea) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 新しく追加された要素内のシーン番号に制限を適用
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newSceneNumbers = node.querySelectorAll ? 
                                node.querySelectorAll('.script-hashira-id') : [];
                            
                            newSceneNumbers.forEach(element => {
                                if (!element.hasSceneNumberRestriction) {
                                    element.setAttribute('contenteditable', 'false');
                                    element.hasSceneNumberRestriction = true;
                                }
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(editArea, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * シーン一覧のクリック動作強化（スクロール挙動改善）
 */
function enhanceSceneListClick() {
    const sceneList = document.getElementById('script-scene-list');
    if (!sceneList) return;
    
    // シーン一覧アイテムのクリックイベントを全て再構築
    const sceneItems = sceneList.querySelectorAll('.script-sidebar-scene');
    sceneItems.forEach(item => {
        // 既存のイベントリスナーを全て削除（クローンして置換）
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // 新しいクリックイベントを設定
        newItem.addEventListener('click', function() {
            // 選択状態の更新
            document.querySelectorAll('.script-sidebar-scene').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 対象シーンを取得
            const sceneIndex = this.getAttribute('data-scene');
            const targetScene = document.querySelector(`.script-scene[data-scene-index="${sceneIndex}"]`);
            
            if (targetScene) {
                // 1. スクロール前にメニューの表示を確保
                ensureMenuVisibility();
                
                // 2. エディタエリア内でのスクロール
                const editArea = document.getElementById('scriptEditArea');
                if (editArea) {
                    // ターゲットシーンの位置を取得
                    const targetOffset = targetScene.offsetTop;
                    
                    // エディタエリア内でスムーズにスクロール
                    editArea.scrollTo({
                        top: targetOffset,
                        behavior: 'smooth'
                    });
                } else {
                    // フォールバック: 通常スクロール
                    targetScene.scrollIntoView({ behavior: 'smooth' });
                }
                
                // 3. スクロール後もメニュー表示を確保（遅延実行）
                setTimeout(ensureMenuVisibility, 300);
            }
        });
    });
}

/**
 * 柱の追加時に常に連番になるよう改善
 */
function enhanceSceneNumbering() {
    // 既存の柱を連番に振り直し
    renumberScenes();
    
    // 新規追加時に連番になるよう監視
    const editArea = document.getElementById('scriptEditArea');
    if (editArea) {
        const observer = new MutationObserver(function(mutations) {
            let sceneAdded = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 追加された要素の中にシーンがあるか確認
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList && 
                            node.classList.contains('script-scene')) {
                            sceneAdded = true;
                        }
                    });
                }
            });
            
            // シーンが追加された場合は番号を振り直し
            if (sceneAdded) {
                console.log("シーン追加を検出: 番号を振り直します");
                renumberScenes();
                setupSceneNumberRestriction(); // 新しいシーン番号に制限を適用
            }
        });
        
        observer.observe(editArea, {
            childList: true,
            subtree: true
        });
    }
}

// DOMロード時に初期化
document.addEventListener('DOMContentLoaded', function() {
    // 既存の処理が完了した後で実行
    setTimeout(function() {
        console.log("シーン関連機能の強化を実行");
        setupLocationSyncImproved();
        enhanceSceneListClick();
        enhanceSceneNumbering();
    }, 800);
});

// シーン管理の拡張機能（移動・削除・自動ナンバリング）

/**
 * シーン番号を即時連番更新する改良版
 */
function enhanceAutoNumbering() {
    console.log("自動ナンバリング機能を強化");
    
    // 定期的なナンバリングチェック
    const autoNumberingInterval = setInterval(() => {
        const scenes = document.querySelectorAll('.script-scene');
        let needsUpdate = false;
        
        // シーン番号が連番になっているかチェック
        scenes.forEach((scene, index) => {
            const expectedNumber = (index + 1).toString().padStart(3, '0');
            const currentNumber = scene.querySelector('.script-hashira-id')?.textContent;
            
            if (currentNumber !== expectedNumber) {
                needsUpdate = true;
            }
        });
        
        // 不一致があれば更新
        if (needsUpdate) {
            console.log("シーン番号の不一致を検出、連番更新を実行");
            renumberScenes();
            updateSceneList();
        }
    }, 2000); // 2秒ごとにチェック
    
    // ページがアンロードされるときにインターバルをクリア
    window.addEventListener('beforeunload', () => {
        clearInterval(autoNumberingInterval);
    });
}

/**
 * 台本編集画面の追従ナビゲーション機能
 * - 「台本 登場人物」タブ、シーン一覧、メニューバー、ツールバーを固定
 * - 元のレイアウトを維持
 */
document.addEventListener('DOMContentLoaded', function() {
    // ページロード完了後に実行
    setTimeout(initFixedNavigation, 500);
});

/**
 * 追従ナビゲーション機能の初期化
 */
function initFixedNavigation() {
    // 対象となる要素
    const subnav = document.querySelector('.nav-worklogin-sub'); // 「台本 登場人物」タブ
    const scenelist = document.querySelector('.script-sidebar'); // シーン一覧
    const menubar = document.querySelector('.script-menu-bar'); // メニューバー
    const toolbar = document.querySelector('.script-toolbar'); // ツールバー
    
    // 要素が見つからない場合は終了
    if (!menubar || !toolbar) {
        console.log('メニューバーまたはツールバーが見つかりません');
        return;
    }
    
    // 元の位置とスタイルを保存
    const originalPositions = {};
    
    if (subnav) {
        const rect = subnav.getBoundingClientRect();
        originalPositions.subnav = {
            top: rect.top + window.pageYOffset,
            height: rect.height,
            style: {
                position: window.getComputedStyle(subnav).position,
                zIndex: window.getComputedStyle(subnav).zIndex
            }
        };
    }
    
    if (scenelist) {
        const rect = scenelist.getBoundingClientRect();
        originalPositions.scenelist = {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height,
            style: {
                position: window.getComputedStyle(scenelist).position,
                zIndex: window.getComputedStyle(scenelist).zIndex
            }
        };
    }
    
    const menubarRect = menubar.getBoundingClientRect();
    originalPositions.menubar = {
        top: menubarRect.top + window.pageYOffset,
        left: menubarRect.left + window.pageXOffset,
        width: menubarRect.width,
        height: menubarRect.height,
        style: {
            position: window.getComputedStyle(menubar).position,
            zIndex: window.getComputedStyle(menubar).zIndex
        }
    };
    
    const toolbarRect = toolbar.getBoundingClientRect();
    originalPositions.toolbar = {
        top: toolbarRect.top + window.pageYOffset,
        left: toolbarRect.left + window.pageXOffset,
        width: toolbarRect.width,
        height: toolbarRect.height,
        style: {
            position: window.getComputedStyle(toolbar).position,
            zIndex: window.getComputedStyle(toolbar).zIndex
        }
    };
    
    // 要素を元に戻す関数
    function resetElement(element, originalData) {
        if (!element || !originalData) return;
        
        element.style.position = originalData.style.position;
        element.style.top = '';
        element.style.left = '';
        element.style.width = '';
        element.style.zIndex = originalData.style.zIndex;
    }
    
    // スクロールイベントハンドラ
    function handleScroll() {
        const scrollY = window.pageYOffset;
        let offsetTop = 0;
        
        // サブナビゲーション
        if (subnav && originalPositions.subnav) {
            if (scrollY >= originalPositions.subnav.top) {
                subnav.style.position = 'fixed';
                subnav.style.top = '0';
                subnav.style.left = '0';
                subnav.style.width = '100%';
                subnav.style.zIndex = '1000';
                
                offsetTop += originalPositions.subnav.height;
            } else {
                resetElement(subnav, originalPositions.subnav);
            }
        }
        
        // シーン一覧
        if (scenelist && originalPositions.scenelist) {
            if (scrollY >= originalPositions.scenelist.top) {
                scenelist.style.position = 'fixed';
                scenelist.style.top = offsetTop + 'px';
                scenelist.style.left = originalPositions.scenelist.left + 'px';
                scenelist.style.width = originalPositions.scenelist.width + 'px';
                scenelist.style.zIndex = '997';
                
                // 残りの高さに合わせる
                const remainingHeight = window.innerHeight - offsetTop;
                scenelist.style.maxHeight = remainingHeight + 'px';
                scenelist.style.overflowY = 'auto';
            } else {
                resetElement(scenelist, originalPositions.scenelist);
                scenelist.style.maxHeight = '';
                scenelist.style.overflowY = '';
            }
        }
        
        // メニューバー
        if (menubar && originalPositions.menubar) {
            if (scrollY >= originalPositions.menubar.top) {
                menubar.style.position = 'fixed';
                menubar.style.top = offsetTop + 'px';
                menubar.style.left = originalPositions.menubar.left + 'px';
                menubar.style.width = originalPositions.menubar.width + 'px';
                menubar.style.zIndex = '999';
            } else {
                resetElement(menubar, originalPositions.menubar);
            }
        }
        
        // ツールバー
        if (toolbar && originalPositions.toolbar) {
            if (scrollY >= originalPositions.toolbar.top) {
                toolbar.style.position = 'fixed';
                
                // メニューバーの状態に応じてツールバーの位置を調整
                if (menubar.style.position === 'fixed') {
                    toolbar.style.top = (offsetTop + originalPositions.menubar.height) + 'px';
                } else {
                    toolbar.style.top = offsetTop + 'px';
                }
                
                toolbar.style.left = originalPositions.toolbar.left + 'px';
                toolbar.style.width = originalPositions.toolbar.width + 'px';
                toolbar.style.zIndex = '998';
            } else {
                resetElement(toolbar, originalPositions.toolbar);
            }
        }
    }
    
    // パフォーマンス最適化（スロットリング）
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // リサイズ時に位置情報を更新
    window.addEventListener('resize', function() {
        // 一旦元に戻す
        if (subnav) resetElement(subnav, originalPositions.subnav);
        if (scenelist) {
            resetElement(scenelist, originalPositions.scenelist);
            scenelist.style.maxHeight = '';
            scenelist.style.overflowY = '';
        }
        resetElement(menubar, originalPositions.menubar);
        resetElement(toolbar, originalPositions.toolbar);
        
        // 位置情報を再計算
        if (subnav) {
            const rect = subnav.getBoundingClientRect();
            originalPositions.subnav.top = rect.top + window.pageYOffset;
            originalPositions.subnav.height = rect.height;
        }
        
        if (scenelist) {
            const rect = scenelist.getBoundingClientRect();
            originalPositions.scenelist.top = rect.top + window.pageYOffset;
            originalPositions.scenelist.left = rect.left + window.pageXOffset;
            originalPositions.scenelist.width = rect.width;
            originalPositions.scenelist.height = rect.height;
        }
        
        const menubarRect = menubar.getBoundingClientRect();
        originalPositions.menubar.top = menubarRect.top + window.pageYOffset;
        originalPositions.menubar.left = menubarRect.left + window.pageXOffset;
        originalPositions.menubar.width = menubarRect.width;
        originalPositions.menubar.height = menubarRect.height;
        
        const toolbarRect = toolbar.getBoundingClientRect();
        originalPositions.toolbar.top = toolbarRect.top + window.pageYOffset;
        originalPositions.toolbar.left = toolbarRect.left + window.pageXOffset;
        originalPositions.toolbar.width = toolbarRect.width;
        originalPositions.toolbar.height = toolbarRect.height;
        
        // スクロール状態を更新
        handleScroll();
    });
    
    // 初期実行
    handleScroll();
}


/**
 * カーソル位置で登場人物選択ダイアログを表示する機能
 */

// カーソル位置を保存する変数
let currentSelection = null;
let currentSceneIndex = null;

/**
 * カーソル位置の近くにダイアログを表示する関数
 */
function showCharacterDialogAtCursor(x, y) {
    // 既存のダイアログがあれば削除
    const existingDialog = document.getElementById('character-inline-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // 新しいダイアログ要素を作成
    const dialog = document.createElement('div');
    dialog.id = 'character-inline-dialog';
    dialog.className = 'character-inline-dialog';
    dialog.style.position = 'absolute';
    dialog.style.zIndex = '1000';
    dialog.style.background = '#222'; // 背景色を黒に変更
    dialog.style.color = '#fff'; // テキスト色を白に変更
    dialog.style.border = '1px solid #444'; // ボーダー色を暗めのグレーに変更
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)'; // シャドウを濃くする
    dialog.style.padding = '15px';
    dialog.style.minWidth = '250px';
    dialog.style.maxWidth = '300px';
    dialog.style.maxHeight = '400px';
    dialog.style.overflowY = 'auto';
    
    // 閉じるボタン
    const closeBtn = document.createElement('span');
    closeBtn.className = 'dialog-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '10px';
    closeBtn.style.top = '5px';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#ccc'; // 色を明るめのグレーに変更
    closeBtn.onclick = function() {
        dialog.remove();
    };
    
    // ダイアログのタイトル
    const title = document.createElement('h4');
    title.textContent = '登場人物を選択';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.borderBottom = '1px solid #444'; // ボーダー色を暗めのグレーに変更
    title.style.paddingBottom = '8px';
    title.style.color = '#fff'; // テキスト色を白に変更
    
    // キャラクターリスト
    const charList = document.createElement('div');
    charList.className = 'dialog-character-list';
    charList.style.maxHeight = '200px';
    charList.style.overflowY = 'auto';
    charList.style.marginBottom = '15px';
    charList.style.border = '1px solid #444'; // ボーダー色を暗めのグレーに変更
    charList.style.borderRadius = '3px';
    charList.style.backgroundColor = '#333'; // 背景色を暗めのグレーに変更
    
    // 登場人物をリストに追加
    const characters = getCharacters();
    characters.forEach(character => {
        const charItem = document.createElement('div');
        charItem.className = 'dialog-character-item';
        charItem.textContent = character;
        charItem.style.padding = '8px 12px';
        charItem.style.cursor = 'pointer';
        charItem.style.transition = 'background-color 0.2s';
        charItem.style.borderBottom = '1px solid #444'; // ボーダー色を暗めのグレーに変更
        charItem.style.color = '#eee'; // テキスト色を明るめの白に変更
        
        // ホバー効果
        charItem.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#444'; // ホバー時の背景色を暗めのグレーに
        });
        
        charItem.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        charItem.onclick = function() {
            insertCharacterSerifu(character);
            dialog.remove();
        };
        charList.appendChild(charItem);
    });
    
    // 新しい登場人物の入力フィールド
    const inputContainer = document.createElement('div');
    inputContainer.className = 'dialog-character-input';
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = '8px';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '新しい登場人物名';
    input.id = 'inline-character-input';
    input.style.flexGrow = '1';
    input.style.padding = '6px 8px';
    input.style.border = '1px solid #555'; // ボーダー色を暗めのグレーに変更
    input.style.backgroundColor = '#333'; // 背景色を暗めのグレーに変更
    input.style.color = '#fff'; // テキスト色を白に変更
    input.style.borderRadius = '3px';
    
    // プレースホルダーの色を変更
    input.style.cssText += `
        ::placeholder, 
        ::-webkit-input-placeholder { 
            color: #999; 
        }
        :-ms-input-placeholder { 
            color: #999;
        }
    `;
    
    // Enterキーで追加できるようにする
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const newCharName = input.value.trim();
            if (newCharName) {
                insertCharacterSerifu(newCharName);
                dialog.remove();
            }
        }
    });
    
    const addBtn = document.createElement('button');
    addBtn.textContent = '追加';
    addBtn.style.backgroundColor = '#007BFF';
    addBtn.style.color = 'white';
    addBtn.style.border = 'none';
    addBtn.style.padding = '6px 12px';
    addBtn.style.borderRadius = '3px';
    addBtn.style.cursor = 'pointer';
    addBtn.style.fontWeight = 'bold';
    
    addBtn.onclick = function() {
        const newCharName = input.value.trim();
        if (newCharName) {
            insertCharacterSerifu(newCharName);
            dialog.remove();
        }
    };
    
    inputContainer.appendChild(input);
    inputContainer.appendChild(addBtn);
    
    // 要素を組み立て
    dialog.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(charList);
    dialog.appendChild(inputContainer);
    
    // ダイアログを表示位置を調整
    dialog.style.left = `${x}px`;
    dialog.style.top = `${y}px`;
    
    // ダイアログをDOMに追加
    document.body.appendChild(dialog);
    
    // 入力フィールドにフォーカス
    input.focus();
    
    // クリックイベントを追加して外側をクリックしたら閉じる
    document.addEventListener('click', function closeDialogOnClickOutside(e) {
        if (!dialog.contains(e.target) && e.target !== dialog) {
            dialog.remove();
            document.removeEventListener('click', closeDialogOnClickOutside);
        }
    });
}

/**
 * 登場人物のセリフを挿入する関数
 */
function insertCharacterSerifu(characterName) {
    if (!currentSelection) return;
    
    // 既存の選択範囲を復元
    restoreSelection(currentSelection);
    
    // 新しいセリフブロックを作成
    const serifuElement = document.createElement('div');
    serifuElement.className = 'scriptarea-serifu';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'script-serifu-name';
    nameElement.setAttribute('contenteditable', 'true');
    nameElement.dataset.originalName = characterName;
    nameElement.textContent = characterName;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'script-serifu-content';
    contentElement.setAttribute('contenteditable', 'true');
    contentElement.textContent = '「セリフを入力...」';
    
    serifuElement.appendChild(nameElement);
    serifuElement.appendChild(contentElement);
    
    // 新しいセリフを挿入する位置を特定
    // 現在のシーンの右側コンテンツエリアを特定
    const sceneElement = document.querySelector(`.script-scene[data-scene-index="${currentSceneIndex}"]`);
    if (!sceneElement) return;
    
    const sceneRightElement = sceneElement.querySelector('.scene-right');
    if (!sceneRightElement) return;
    
    // 選択位置に挿入するか、最後に追加する
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let currentNode = range.startContainer;
        
        // テキストノードの場合は親要素を取得
        if (currentNode.nodeType === Node.TEXT_NODE) {
            currentNode = currentNode.parentNode;
        }
        
        // 親要素を見つける（scene-right内の要素）
        while (currentNode && !sceneRightElement.contains(currentNode)) {
            currentNode = currentNode.parentNode;
        }
        
        if (currentNode && currentNode !== sceneRightElement) {
            // スクリプト要素（ト書きやセリフ）を特定
            const scriptElement = findScriptElement(currentNode);
            if (scriptElement) {
                // 現在のブロックの後に挿入
                scriptElement.after(serifuElement);
            } else {
                // 見つからない場合は最後に追加
                sceneRightElement.appendChild(serifuElement);
            }
        } else {
            // scene-rightの最後に追加
            sceneRightElement.appendChild(serifuElement);
        }
    } else {
        // 選択範囲がない場合は最後に追加
        sceneRightElement.appendChild(serifuElement);
    }
    
    // キャラクター名のフォーマットを適用
    formatCharacterNames();
    
    // アニメーション効果を適用（新規追加のハイライト）
    serifuElement.classList.add('new-added');
    setTimeout(() => {
        serifuElement.classList.remove('new-added');
    }, 1500);
    
    // セリフ要素にフォーカスして入力できるようにする
    setTimeout(() => {
        contentElement.focus();
        
        // 「」の間にカーソルを配置
        if (contentElement.firstChild && contentElement.textContent === '「セリフを入力...」') {
            const range = document.createRange();
            range.setStart(contentElement.firstChild, 1); // 「の後
            range.setEnd(contentElement.firstChild, contentElement.textContent.length - 1); // 」の前
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // 内容全体を選択
            const range = document.createRange();
            range.selectNodeContents(contentElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, 10);
    
    // 台本内容を更新
    saveEditorState();
    
    // 行番号を更新
    if (window.lineNumberManager) {
        setTimeout(() => window.lineNumberManager.updateLineNumbers(), 300);
    }
    
    // サイドバーのシーン一覧を更新
    updateSceneList();
}

/**
 * 親のスクリプト要素（ト書きやセリフブロック）を見つける
 */
function findScriptElement(element) {
    if (!element) return null;
    
    // 自身がスクリプト要素かチェック
    if (element.classList && (
        element.classList.contains('scriptarea-togaki') ||
        element.classList.contains('scriptarea-togaki-hidden') ||
        element.classList.contains('scriptarea-serifu') ||
        element.classList.contains('scriptarea-serifu-hidden') ||
        element.classList.contains('time-progress') ||
        element.classList.contains('script-page-break')
    )) {
        return element;
    }
    
    // 親要素を探索
    let parent = element;
    while (parent) {
        if (parent.classList && (
            parent.classList.contains('scriptarea-togaki') ||
            parent.classList.contains('scriptarea-togaki-hidden') ||
            parent.classList.contains('scriptarea-serifu') ||
            parent.classList.contains('scriptarea-serifu-hidden') ||
            parent.classList.contains('time-progress') ||
            parent.classList.contains('script-page-break')
        )) {
            return parent;
        }
        
        // 次の親へ
        parent = parent.parentNode;
        
        // body要素まで到達したら終了
        if (!parent || parent.nodeName === 'BODY') break;
    }
    
    return null;
}

/**
 * 登場人物リストを取得する関数
 */
function getCharacters() {
    // 登場人物データを取得
    const characterItems = document.querySelectorAll('.character-item');
    const characters = [];
    
    characterItems.forEach(item => {
        const name = item.getAttribute('data-name');
        if (name) {
            characters.push(name);
        }
    });
    
    // 既存のセリフから登場人物名も取得（重複を避ける）
    const nameSet = new Set(characters);
    document.querySelectorAll('.script-serifu-name').forEach(nameEl => {
        const name = nameEl.dataset.originalName || nameEl.textContent.trim();
        if (name && name !== '表示名' && name !== 'セリフ') {
            nameSet.add(name);
        }
    });
    
    return Array.from(nameSet);
}

/**
 * 選択範囲を保存する関数
 */
function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        return selection.getRangeAt(0);
    }
    return null;
}

/**
 * 選択範囲を復元する関数
 */
function restoreSelection(range) {
    if (range) {
        const selection = window.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * カーソルがあるシーンのインデックスを取得する関数
 */
function getCurrentSceneIndex() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let currentNode = range.startContainer;
        
        // テキストノードの場合は親要素を取得
        if (currentNode.nodeType === Node.TEXT_NODE) {
            currentNode = currentNode.parentNode;
        }
        
        // シーン要素を探す
        while (currentNode && !currentNode.classList?.contains('script-scene')) {
            currentNode = currentNode.parentNode;
            // document.bodyまで到達したら終了
            if (!currentNode || currentNode === document.body) break;
        }
        
        if (currentNode && currentNode.classList.contains('script-scene')) {
            return currentNode.getAttribute('data-scene-index');
        }
    }
    
    // 見つからない場合は現在選択中のシーンを使用
    const activeScene = document.querySelector('.script-sidebar-scene.active');
    if (activeScene) {
        return activeScene.getAttribute('data-scene');
    }
    
    return null;
}

/**
 * セリフ挿入ボタンのイベントリスナーを設定
 */
function setupCharacterDialogEvents() {
    // ツールバーのセリフ挿入ボタン
    const toolSerifuBtn = document.getElementById('toolSerifu');
    if (toolSerifuBtn) {
        // 既存のイベントリスナーを全て削除（クローンで置換）
        const clone = toolSerifuBtn.cloneNode(true);
        toolSerifuBtn.parentNode.replaceChild(clone, toolSerifuBtn);
        
        // 新しいイベントリスナーを設定
        clone.addEventListener('click', function(e) {
            e.stopPropagation(); // イベント伝播を停止
            
            // 現在の選択範囲を保存
            currentSelection = saveSelection();
            currentSceneIndex = getCurrentSceneIndex();
            
            // カーソル位置を取得
            const rect = clone.getBoundingClientRect();
            const x = rect.left;
            const y = rect.bottom + window.scrollY;
            
            // ダイアログを表示
            showCharacterDialogAtCursor(x, y);
        });
    }
    
    // メニューのセリフ挿入項目
    const menuInsertSerifu = document.getElementById('menuInsertSerifu');
    if (menuInsertSerifu) {
        // 既存のイベントリスナーを全て削除（クローンで置換）
        const clone = menuInsertSerifu.cloneNode(true);
        menuInsertSerifu.parentNode.replaceChild(clone, menuInsertSerifu);
        
        // 新しいイベントリスナーを設定
        clone.addEventListener('click', function(e) {
            e.stopPropagation(); // イベント伝播を停止
            
            // 現在の選択範囲を保存
            currentSelection = saveSelection();
            currentSceneIndex = getCurrentSceneIndex();
            
            // カーソル位置を取得
            const rect = clone.getBoundingClientRect();
            const x = rect.left;
            const y = rect.bottom + window.scrollY;
            
            // ダイアログを表示
            showCharacterDialogAtCursor(x, y);
        });
    }
    
    // キーボードショートカットの設定 (Ctrl+L)
    document.addEventListener('keydown', function(e) {
        // Macの場合はCmd+L, それ以外はCtrl+L
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? e.metaKey : e.ctrlKey;
        
        if (modifierKey && e.key === 'l') {
            e.preventDefault();
            
            // エディタ内にフォーカスがある場合のみ処理
            const editArea = document.getElementById('scriptEditArea');
            if (document.activeElement === editArea || editArea.contains(document.activeElement)) {
                // 現在の選択範囲を保存
                currentSelection = saveSelection();
                currentSceneIndex = getCurrentSceneIndex();
                
                // 選択位置の座標を取得
                let x, y;
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    x = rect.left;
                    y = rect.bottom + window.scrollY;
                } else {
                    // フォールバック: エディタの中央付近に表示
                    const editAreaRect = editArea.getBoundingClientRect();
                    x = editAreaRect.left + 100;
                    y = editAreaRect.top + 100 + window.scrollY;
                }
                
                // ダイアログを表示
                showCharacterDialogAtCursor(x, y);
            }
        }
    });
}

/**
 * CSSスタイルを追加する関数
 */
function addInlineDialogStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .character-inline-dialog {
            position: absolute;
            z-index: 1000;
            background-color: #222;
            color: #fff;
            border: 1px solid #444;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            padding: 15px;
            min-width: 250px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .dialog-close {
            position: absolute;
            right: 10px;
            top: 5px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            color: #ccc;
        }
        
        .dialog-close:hover {
            color: #fff;
        }
        
        .dialog-character-list {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 15px;
            border: 1px solid #444;
            border-radius: 3px;
            background-color: #333;
        }
        
        .dialog-character-item {
            padding: 8px 12px;
            cursor: pointer;
            transition: background-color 0.2s;
            border-bottom: 1px solid #444;
            color: #eee;
        }
        
        .dialog-character-item:hover {
            background-color: #444;
        }
        
        .dialog-character-item:not(:last-child) {
            border-bottom: 1px solid #444;
        }
        
        .dialog-character-input {
            display: flex;
            gap: 8px;
        }
        
        .dialog-character-input input {
            flex-grow: 1;
            padding: 6px 8px;
            border: 1px solid #555;
            background-color: #333;
            color: #fff;
            border-radius: 3px;
        }
        
        .dialog-character-input input::placeholder {
            color: #999;
        }
        
        .dialog-character-input button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .dialog-character-input button:hover {
            background-color: #45a049;
        }
        
        /* 選択されている状態のスタイル */
        .dialog-character-item.selected {
            background-color: #555;
            font-weight: bold;
        }
        
        /* 台本エディタのスタイル調整 - セリフ要素の強調表示 */
        .scriptarea-serifu {
            position: relative;
            margin: 10px 0;
            border-left: 3px solid transparent;
            transition: border-color 0.2s;
        }
        
        .scriptarea-serifu:hover {
            border-left-color: #4CAF50;
        }
        
        /* アニメーション効果 - 新しく追加されたセリフ */
        @keyframes highlight-new-serifu {
            0% { background-color: rgba(76, 175, 80, 0.2); }
            100% { background-color: transparent; }
        }
        
        .scriptarea-serifu.new-added {
            animation: highlight-new-serifu 1.5s ease-out;
        }
    `;
    document.head.appendChild(styleElement);
}

// DOMが読み込まれたらイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
    setupCharacterDialogEvents();
    addInlineDialogStyles();
});

// 既存の insertSerifu 関数をオーバーライド
// 既存のセリフ挿入関数を新しい実装に置き換え
window.original_insertSerifu = window.insertSerifu;
window.insertSerifu = function() {
    // 現在の選択範囲を保存
    currentSelection = saveSelection();
    currentSceneIndex = getCurrentSceneIndex();
    
    // 位置情報を計算
    let x, y;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        x = rect.left;
        y = rect.bottom + window.scrollY;
    } else {
        // フォールバック: ビューポートの中央付近に表示
        x = window.innerWidth / 2 - 150;
        y = window.innerHeight / 3 + window.scrollY;
    }
    
    // ダイアログを表示
    showCharacterDialogAtCursor(x, y);
};

/**
 * セリフ機能の完全リセットと再実装（1行だけ対応）
 */
(function() {
    // 実行済みフラグをチェック
    const UNIQUE_ID = "serifu_fix_v11"; // バージョン番号を更新
    if (window[UNIQUE_ID]) return;
    window[UNIQUE_ID] = true;
    
    console.log('セリフ機能を完全リセットして再実装します - v11');
    
    // ページからすべてのキーボードイベントハンドラを強制的に削除
    try {
        // グローバルのキーダウンハンドラを削除
        document.onkeydown = null;
        
        // すべてのkeydownイベントリスナーを削除（可能な限り）
        const editArea = document.getElementById('scriptEditArea');
        if (editArea) {
            const oldEditArea = editArea.cloneNode(true);
            editArea.parentNode.replaceChild(oldEditArea, editArea);
            console.log('エディタ領域を複製してイベントリスナーをリセットしました');
        }
    } catch (err) {
        console.error('イベントリスナー削除エラー:', err);
    }
    
    // ボーダー色変更のためのスタイル追加
    const style = document.createElement('style');
    style.textContent = `
        /* セリフ要素のホバー時のボーダー色を青に変更 */
        .scriptarea-serifu {
            position: relative;
            margin: 10px 0;
            border-left: 3px solid transparent;
            transition: border-color 0.2s;
        }
        
        .scriptarea-serifu:hover {
            border-left-color: #007BFF !important; /* 強制的に青色に */
        }
        
        /* セリフの名前ホバー時の背景色 */
        .script-serifu-name:hover {
            background-color: rgba(0, 123, 255, 0.1);
        }
        
        /* ドロップダウンスタイル */
        #character-name-dropdown {
            background-color: #222;
            color: #fff;
            border: 1px solid #444;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            padding: 10px;
            max-height: 300px;
            overflow-y: auto;
        }
    `;
    document.head.appendChild(style);
    
    // -------------------- 人物名ドロップダウン機能 --------------------
    
    // 登場人物名要素にクリックイベントを追加
    function setupNameDropdowns() {
        const nameElements = document.querySelectorAll('.script-serifu-name');
        nameElements.forEach(setupNameDropdown);
    }
    
    // 1つの名前要素にドロップダウン機能を設定
    function setupNameDropdown(nameElem) {
        if (!nameElem || nameElem.hasDropdownSetup) return;
        
        // クリックイベントでドロップダウンを表示
        nameElem.addEventListener('click', function(e) {
            e.stopPropagation(); // イベント伝播を停止
            showNameDropdown(this);
        });
        
        // フォーカスイベントでもドロップダウンを表示
        nameElem.addEventListener('focus', function(e) {
            showNameDropdown(this);
        });
        
        // セットアップ済みフラグを設定
        nameElem.hasDropdownSetup = true;
    }
    
    // 名前ドロップダウンを表示
    function showNameDropdown(nameElement) {
        // 既存のドロップダウンを削除
        removeNameDropdown();
        
        // 位置情報を取得
        const rect = nameElement.getBoundingClientRect();
        
        // ドロップダウンを作成
        const dropdown = document.createElement('div');
        dropdown.id = 'character-name-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        dropdown.style.left = (rect.left + window.scrollX) + 'px';
        dropdown.style.width = (rect.width + 80) + 'px';
        
        // 1. 入力セクション
        const inputSection = document.createElement('div');
        inputSection.style.marginBottom = '10px';
        
        const inputLabel = document.createElement('div');
        inputLabel.textContent = '登場人物名を入力:';
        inputLabel.style.fontSize = '12px';
        inputLabel.style.color = '#aaa';
        inputLabel.style.marginBottom = '5px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = nameElement.textContent;
        input.style.width = '100%';
        input.style.padding = '6px 8px';
        input.style.backgroundColor = '#333';
        input.style.color = '#fff';
        input.style.border = '1px solid #555';
        input.style.borderRadius = '3px';
        input.style.boxSizing = 'border-box';
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.value.trim()) {
                    nameElement.textContent = this.value;
                    
                    // よく使う名前リストに追加
                    addToRecentNames(this.value);
                    
                    removeNameDropdown();
                    
                    // フォーカスをセリフ内容に移動
                    const contentElement = nameElement.nextElementSibling;
                    if (contentElement) {
                        contentElement.focus();
                    }
                }
            }
        });
        
        inputSection.appendChild(inputLabel);
        inputSection.appendChild(input);
        
        // 2. 最近使用した登場人物セクション
        const recentNames = getRecentNames();
        if (recentNames.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.style.marginBottom = '10px';
            
            const recentLabel = document.createElement('div');
            recentLabel.textContent = '最近使用した登場人物:';
            recentLabel.style.fontSize = '12px';
            recentLabel.style.color = '#aaa';
            recentLabel.style.marginBottom = '5px';
            
            recentSection.appendChild(recentLabel);
            
            // 最近使った名前の一覧
            recentNames.forEach(name => {
                const item = createNameItem(name, nameElement);
                recentSection.appendChild(item);
            });
            
            dropdown.appendChild(inputSection);
            dropdown.appendChild(recentSection);
        } else {
            dropdown.appendChild(inputSection);
        }
        
        // 3. 登録済み登場人物セクション
        const registeredNames = getRegisteredNames();
        if (registeredNames.length > 0) {
            const regSection = document.createElement('div');
            
            const regLabel = document.createElement('div');
            regLabel.textContent = '登録済み登場人物:';
            regLabel.style.fontSize = '12px';
            regLabel.style.color = '#aaa';
            regLabel.style.marginBottom = '5px';
            
            regSection.appendChild(regLabel);
            
            // 登録済み名前の一覧（最近使った名前と重複しないもの）
            registeredNames.forEach(name => {
                if (!recentNames.includes(name)) {
                    const item = createNameItem(name, nameElement);
                    regSection.appendChild(item);
                }
            });
            
            // 登録済み名前が1つ以上ある場合のみ追加
            if (regSection.childElementCount > 1) {
                dropdown.appendChild(regSection);
            }
        }
        
        // ドキュメントに追加
        document.body.appendChild(dropdown);
        
        // 入力欄にフォーカス
        setTimeout(() => input.focus(), 10);
        
        // 外側クリックでドロップダウンを閉じる
        document.addEventListener('click', function closeOnOutsideClick(e) {
            if (!dropdown.contains(e.target) && e.target !== nameElement) {
                removeNameDropdown();
                document.removeEventListener('click', closeOnOutsideClick);
            }
        });
    }
    
    // 名前項目を作成
    function createNameItem(name, targetElement) {
        const item = document.createElement('div');
        item.textContent = name;
        item.style.padding = '6px 8px';
        item.style.margin = '2px 0';
        item.style.backgroundColor = '#333';
        item.style.color = '#fff';
        item.style.borderRadius = '3px';
        item.style.cursor = 'pointer';
        
        // ホバー効果
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#444';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#333';
        });
        
        // クリック時の処理


        item.addEventListener('click', function() {
            targetElement.textContent = name;
            
            // リストに追加
            addToRecentNames(name);
            
            removeNameDropdown();
            
            // フォーカスをセリフ内容に移動
            const contentElement = targetElement.nextElementSibling;
            if (contentElement) {
                contentElement.focus();
            }
        });
        
        return item;
    }
    
    // ドロップダウンを削除
    function removeNameDropdown() {
        const dropdown = document.getElementById('character-name-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
    }
    
    // 最近使用した名前リストを取得
    function getRecentNames() {
        try {
            const stored = localStorage.getItem('recentCharacterNames');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('最近使用した名前の取得エラー:', e);
        }
        return [];
    }
    
    // 最近使用した名前リストに追加
    function addToRecentNames(name) {
        if (!name || name === '表示名') return;
        
        try {
            // 現在のリストを取得
            let names = getRecentNames();
            
            // すでに存在する場合は削除（重複を避けるため）
            names = names.filter(item => item !== name);
            
            // 先頭に追加
            names.unshift(name);
            
            // 最大5件に制限
            if (names.length > 5) {
                names = names.slice(0, 5);
            }
            
            // 保存
            localStorage.setItem('recentCharacterNames', JSON.stringify(names));
        } catch (e) {
            console.error('最近使用した名前の保存エラー:', e);
        }
    }
    
    // 登録済み登場人物リストを取得
    function getRegisteredNames() {
        // 登場人物データを取得
        const characterItems = document.querySelectorAll('.character-item');
        const characters = [];
        
        characterItems.forEach(item => {
            const name = item.getAttribute('data-name');
            if (name) {
                characters.push(name);
            }
        });
        
        return characters;
    }
    
    // -------------------- セリフ追加（1行だけ）--------------------
    
    // セリフ追加済みフラグ（二重追加防止）
    let serifuAddedFlag = false;
    
    // エディタ領域にハイジャック用のイベントリスナーを追加
    function setupEnterKeyHandler() {
        // エディタ要素を取得
        const editArea = document.getElementById('scriptEditArea');
        if (!editArea) return;
        
        // エディタ全体にハイジャック用のイベントリスナーを追加（キャプチャフェーズ）
        editArea.addEventListener('keydown', handleEnterKey, true);
        
        console.log('エディタにENTERキーハンドラを設定しました');
    }
    
    // ENTERキーの処理
    function handleEnterKey(e) {
        // Enterキーかつシフトキーなしの場合
        if (e.key === 'Enter' && !e.shiftKey) {
            // アクティブ要素を取得
            const activeElement = document.activeElement;
            
            // セリフコンテンツかどうか確認
            if (activeElement && activeElement.classList && 
                activeElement.classList.contains('script-serifu-content')) {
                
                // イベントをキャンセル
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // 既にセリフが追加された場合は何もしない（二重追加防止）
                if (serifuAddedFlag) {
                    console.log('セリフ追加済みフラグを検出 - 無視します');
                    return false;
                }
                
                // セリフ追加済みフラグを立てる
                serifuAddedFlag = true;
                
                // フラグのリセットタイマー
                setTimeout(() => {
                    serifuAddedFlag = false;
                }, 500);
                
                console.log('セリフを1行だけ追加します');
                
                try {
                    // 親のセリフ要素を取得
                    const serifuElement = activeElement.closest('.scriptarea-serifu');
                    if (!serifuElement) return false;
                    
                    // キャラクター名を取得
                    const nameElement = serifuElement.querySelector('.script-serifu-name');
                    if (!nameElement) return false;
                    
                    const characterName = nameElement.textContent || '表示名';
                    
                    // 新しいセリフを作成
                    const newSerifu = document.createElement('div');
                    newSerifu.className = 'scriptarea-serifu';
                    
                    // 名前要素
                    const newName = document.createElement('div');
                    newName.className = 'script-serifu-name';
                    newName.setAttribute('contenteditable', 'true');
                    newName.textContent = characterName;
                    
                    // セリフ内容要素
                    const newContent = document.createElement('div');
                    newContent.className = 'script-serifu-content';
                    newContent.setAttribute('contenteditable', 'true');
                    newContent.textContent = '「」';
                    
                    // 組み立て
                    newSerifu.appendChild(newName);
                    newSerifu.appendChild(newContent);
                    
                    // 修正箇所: 常に直接セリフの後ろに挿入する(1行だけにする)
                    serifuElement.after(newSerifu);
                    
                    // 名前要素にドロップダウン機能を設定
                    setupNameDropdown(newName);
                    
                    // フォーカスを設定
                    setTimeout(function() {
                        // カーソルを「」の間に配置
                        newContent.focus();
                        
                        if (newContent.firstChild) {
                            const range = document.createRange();
                            range.setStart(newContent.firstChild, 1);
                            range.setEnd(newContent.firstChild, 1);
                            
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                        
                        // 行番号の更新
                        if (window.lineNumberManager) {
                            window.lineNumberManager.updateLineNumbers();
                        }
                        
                        // エディタの状態を保存
                        if (typeof saveEditorState === 'function') {
                            saveEditorState();
                        }
                    }, 10);
                } catch (error) {
                    console.error('セリフ追加エラー:', error);
                    serifuAddedFlag = false;
                }
                
                return false;
            }
        }
    }
    
    // -------------------- 初期化処理 --------------------
    
    // 初期化メイン関数
    function initialize() {
        // 既存の名前要素にドロップダウン機能を設定
        setupNameDropdowns();
        
        // ENTERキーハンドラを設定
        setupEnterKeyHandler();
        
        // DOM変更を監視して新しく追加された要素にも機能を適用
        const observer = new MutationObserver(function(mutations) {
            let hasNewSerifu = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // 要素ノード
                            // 新しいセリフ要素が追加された場合
                            if (node.classList && node.classList.contains('scriptarea-serifu')) {
                                hasNewSerifu = true;
                            }
                            
                            // 子孫にセリフ要素がある場合
                            if (node.querySelectorAll) {
                                const serifu = node.querySelectorAll('.scriptarea-serifu');
                                if (serifu.length > 0) {
                                    hasNewSerifu = true;
                                }
                            }
                        }
                    });
                }
            });
            
            if (hasNewSerifu) {
                setupNameDropdowns();
            }
        });
        
        // 監視設定
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // DOMの読み込み状態に応じて初期化を実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // 安全のため、少し遅らせても実行
    setTimeout(initialize, 500);
    
    console.log('セリフ機能のリセットと再実装が完了しました');
})();