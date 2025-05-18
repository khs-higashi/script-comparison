// シーンの右側コンテナを見つける
function findParentSceneRight(node) {
    const scene = findParentScene(node);
    if (scene) {
        return scene.querySelector('.scene-right');
    }
    return null;
}

// Undoスタックに現在の状態を保存
function saveToUndoStack() {
    const content = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(content);
    
    // スタックサイズを制限
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Redoスタックをクリア
    redoStack = [];
}

// Undoの実行
function undo() {
    if (undoStack.length === 0) {
        return;
    }
    
    // 現在の状態をRedoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    redoStack.push(currentContent);
    
    // Undoスタックから状態を復元
    const prevContent = undoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = prevContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// Redoの実行
function redo() {
    if (redoStack.length === 0) {
        return;
    }
    
    // 現在の状態をUndoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(currentContent);
    
    // Redoスタックから状態を復元
    const nextContent = redoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = nextContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// ショートカットキーの設定
document.addEventListener('keydown', function(e) {
    // Ctrl+Sで保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
            // Ctrl+Shift+Sでバージョン保存
            saveScript(true);
        } else {
            // Ctrl+Sで上書き保存
            saveScript(false);
        }
    }
    
    // Ctrl+Zでundo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    // Ctrl+Yでredo（またはCtrl+Shift+Z）
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
    }
    
    // Ctrl+Hで柱挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        insertHashira();
    }
    
    // Ctrl+Tでト書き挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        insertTogaki();
    }
    
    // Ctrl+Lでセリフ挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        insertSerifu();
    }
    
    // Esc キーでモーダルを閉じる
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (window.getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }
});

// エディタ内のセリフ改行修正
function fixSerifuLinebreaks() {
    const serifuContents = document.querySelectorAll('.script-serifu-content');
    
    serifuContents.forEach(content => {
        // 改行を proper な形式に変換
        const html = content.innerHTML;
        if (html.includes('<div>') || html.includes('<p>')) {
            // divやpタグを単純な改行に変換
            const newHtml = html.replace(/<div>(.*?)<\/div>/g, '$1<br>')
                             .replace(/<p>(.*?)<\/p>/g, '$1<br>');
            content.innerHTML = newHtml;
        }
    });
}

// 定期的なオートセーブ
function setupAutoSave() {
    setInterval(function() {
        if (isEditorDirty) {
            // 最後の保存から内容が変わっている場合のみ自動保存
            const currentContent = getEditorContent();
            if (currentContent !== lastSavedContent) {
                saveScript(false);
            }
        }
    }, 300000); // 5分ごとに自動保存
}

// シーンの右側コンテナを見つける
function findParentSceneRight(node) {
    const scene = findParentScene(node);
    if (scene) {
        return scene.querySelector('.scene-right');
    }
    return null;
}

// Undoスタックに現在の状態を保存
function saveToUndoStack() {
    const content = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(content);
    
    // スタックサイズを制限
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Redoスタックをクリア
    redoStack = [];
}

// Undoの実行
function undo() {
    if (undoStack.length === 0) {
        return;
    }
    
    // 現在の状態をRedoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    redoStack.push(currentContent);
    
    // Undoスタックから状態を復元
    const prevContent = undoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = prevContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// Redoの実行
function redo() {
    if (redoStack.length === 0) {
        return;
    }
    
    // 現在の状態をUndoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(currentContent);
    
    // Redoスタックから状態を復元
    const nextContent = redoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = nextContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// ショートカットキーの設定
document.addEventListener('keydown', function(e) {
    // Ctrl+Sで保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
            // Ctrl+Shift+Sでバージョン保存
            saveScript(true);
        } else {
            // Ctrl+Sで上書き保存
            saveScript(false);
        }
    }
    
    // Ctrl+Zでundo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    // Ctrl+Yでredo（またはCtrl+Shift+Z）
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
    }
    
    // Ctrl+Hで柱挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        insertHashira();
    }
    
    // Ctrl+Tでト書き挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        insertTogaki();
    }
    
    // Ctrl+Lでセリフ挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        insertSerifu();
    }
    
    // Esc キーでモーダルを閉じる
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (window.getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }
});

// エディタ内のセリフ改行修正
function fixSerifuLinebreaks() {
    const serifuContents = document.querySelectorAll('.script-serifu-content');
    
    serifuContents.forEach(content => {
        // 改行を proper な形式に変換
        const html = content.innerHTML;
        if (html.includes('<div>') || html.includes('<p>')) {
            // divやpタグを単純な改行に変換
            const newHtml = html.replace(/<div>(.*?)<\/div>/g, '$1<br>')
                             .replace(/<p>(.*?)<\/p>/g, '$1<br>');
            content.innerHTML = newHtml;
        }
    });
}

// 定期的なオートセーブ
function setupAutoSave() {
    setInterval(function() {
        if (isEditorDirty) {
            // 最後の保存から内容が変わっている場合のみ自動保存
            const currentContent = getEditorContent();
            if (currentContent !== lastSavedContent) {
                saveScript(false);
            }
        }
    }, 300000); // 5分ごとに自動保存
}

// セリフの挿入
function insertSerifu() {
    saveToUndoStack();
    
    // キャラクター選択モーダルを表示
    showCharacterSelectModal();
}

// キャラクター選択モーダルを表示
function showCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // 最近使用したキャラクター名を表示
        updateRecentCharactersList();
        
        // 入力フィールドにフォーカス
        const inputField = document.getElementById('custom-character');
        if (inputField) {
            inputField.focus();
        }
    }
}

// キャラクター選択モーダルの設定
function setupCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const addBtn = document.getElementById('add-character-btn');
    const characterItems = document.querySelectorAll('.character-item');
    const customCharField = document.getElementById('custom-character');
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // キャラクター項目のクリックイベント
    characterItems.forEach(item => {
        item.addEventListener('click', function() {
            const charName = this.getAttribute('data-name');
            insertSerifuWithCharacter(charName);
            modal.style.display = 'none';
            
            // 最近使用したキャラクターリストに追加
            addToRecentCharacters(charName);
        });
    });
    
    // カスタムキャラクター追加ボタン
    if (addBtn && customCharField) {
        addBtn.addEventListener('click', function() {
            const charName = customCharField.value.trim();
            if (charName) {
                insertSerifuWithCharacter(charName);
                modal.style.display = 'none';
                
                // 最近使用したキャラクターリストに追加
                addToRecentCharacters(charName);
                
                // 入力フィールドをクリア
                customCharField.value = '';
            }
        });
        
        // オートコンプリートの設定
        setupAutocomplete(customCharField);
    }
    
    // エンターキーで追加
    if (customCharField) {
        customCharField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const charName = customCharField.value.trim();
                if (charName) {
                    insertSerifuWithCharacter(charName);
                    modal.style.display = 'none';
                    
                    // 最近使用したキャラクターリストに追加
                    addToRecentCharacters(charName);
                    
                    // 入力フィールドをクリア
                    customCharField.value = '';
                }
            }
        });
    }
}

// キャラクター名でセリフを挿入
function insertSerifuWithCharacter(charName) {
    const editArea = document.getElementById('scriptEditArea');
    const sel = window.getSelection();
    
    // 現在のキャレット位置を取得
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // 新しいセリフ要素を作成
        const newSerifu = document.createElement('div');
        newSerifu.className = 'scriptarea-serifu';
        
        // キャラクター名と台詞部分を作成
        const nameElement = document.createElement('div');
        nameElement.className = 'script-serifu-name';
        nameElement.contentEditable = true;
        nameElement.textContent = charName;
        nameElement.setAttribute('data-char-count', charName.length);
        
        const contentElement = document.createElement('div');
        contentElement.className = 'script-serifu-content';
        contentElement.contentEditable = true;
        contentElement.textContent = 'セリフを入力';
        
        // セリフ要素に追加
        newSerifu.appendChild(nameElement);
        newSerifu.appendChild(contentElement);
        
        // カーソル位置に挿入
        const node = getDeepestNode(range.startContainer);
        const sceneRight = findParentSceneRight(node);
        
        if (sceneRight) {
            // 適切な位置に挿入
            const insertAfter = findInsertPosition(node, sceneRight);
            if (insertAfter) {
                if (insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(newSerifu, insertAfter.nextSibling);
                } else {
                    insertAfter.parentNode.appendChild(newSerifu);
                }
            } else {
                sceneRight.appendChild(newSerifu);
            }
        } else {
            // シーンがない場合は新しいシーンを作成して挿入
            insertHashira();
            return;
        }
        
        // セリフ名前のフォーマット適用
        applySerifuNameFormat();
        
        // 行番号を更新
        updateLineNumbers();
        
        // 変更フラグを立てる
        isEditorDirty = true;
        
        // セリフ内容にフォーカス
        contentElement.focus();
        
        // テキスト全選択
        const selection = window.getSelection();
        const newRange = document.createRange();
        newRange.selectNodeContents(contentElement);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

// 最近使用したキャラクターリストに追加
function addToRecentCharacters(charName) {
    // 既に存在する場合は削除（重複を避けるため）
    const index = recentCharNames.indexOf(charName);
    if (index !== -1) {
        recentCharNames.splice(index, 1);
    }
    
    // リストの先頭に追加
    recentCharNames.unshift(charName);
    
    // 最大数を超えた場合は古いものを削除
    if (recentCharNames.length > MAX_RECENT_NAMES) {
        recentCharNames.pop();
    }
}

// 最近使用したキャラクターリストを更新
function updateRecentCharactersList() {
    // TODO: 実装（UIに最近使用したキャラクターリストを表示する）
}

// オートコンプリートの設定
function setupAutocomplete(inputField) {
    // 登場人物と最近使用したキャラクター名を組み合わせてソースを作成
    const characterSources = [];
    
    // 登場人物リストからソースを追加
    if (window.scriptCharacters && Array.isArray(window.scriptCharacters)) {
        window.scriptCharacters.forEach(char => {
            if (char.display_name) {
                characterSources.push(char.display_name);
            }
        });
    }
    
    // 最近使用したキャラクター名を追加
    recentCharNames.forEach(name => {
        if (!characterSources.includes(name)) {
            characterSources.push(name);
        }
    });
    
    // オートコンプリート機能を実装（jQueryプラグイン等が必要な場合は適宜変更）
    inputField.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase();
        if (value.length > 0) {
            const matches = characterSources.filter(name => 
                name.toLowerCase().includes(value)
            );
            
            // マッチしたリストを表示
            showAutocompleteResults(matches, inputField);
        } else {
            // 入力がない場合はリストを非表示
            hideAutocompleteResults();
        }
    });
}

// オートコンプリート結果の表示
function showAutocompleteResults(matches, inputField) {
    // 既存のリストを削除
    hideAutocompleteResults();
    
    if (matches.length === 0) {
        return;
    }
    
    // 結果リストを作成
    const resultsList = document.createElement('div');
    resultsList.className = 'autocomplete-suggestions';
    resultsList.id = 'autocomplete-suggestions';
    
    // 位置調整
    const rect = inputField.getBoundingClientRect();
    resultsList.style.position = 'absolute';
    resultsList.style.left = rect.left + 'px';
    resultsList.style.top = (rect.bottom + window.scrollY) + 'px';
    resultsList.style.width = rect.width + 'px';
    
    // 結果アイテムを追加
    matches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'autocomplete-suggestion';
        item.textContent = match;
        
        // クリックイベント
        item.addEventListener('click', function() {
            inputField.value = match;
            hideAutocompleteResults();
        });
        
        resultsList.appendChild(item);
    });
    
    // ページに追加
    document.body.appendChild(resultsList);
    
    // キーボード操作の追加
    inputField.addEventListener('keydown', handleAutocompleteKeydown);
}

// オートコンプリート結果の非表示
function hideAutocompleteResults() {
    const resultsList = document.getElementById('autocomplete-suggestions');
    if (resultsList) {
        resultsList.remove();
    }
    
    // キーボードイベントを削除
    const inputField = document.getElementById('custom-character');
    if (inputField) {
        inputField.removeEventListener('keydown', handleAutocompleteKeydown);
    }
}

// オートコンプリートのキーボード操作
function handleAutocompleteKeydown(e) {
    const resultsList = document.getElementById('autocomplete-suggestions');
    if (!resultsList) {
        return;
    }
    
    const items = resultsList.querySelectorAll('.autocomplete-suggestion');
    const inputField = document.getElementById('custom-character');
    
    // 現在選択されているアイテムを取得
    let selectedIndex = -1;
    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('autocomplete-selected')) {
            selectedIndex = i;
            break;
        }
    }
    
    // キー操作による選択
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
        e.preventDefault();
        inputField.value = items[selectedIndex].textContent;
        hideAutocompleteResults();
        return;
    } else if (e.key === 'Escape') {
        e.preventDefault();
        hideAutocompleteResults();
        return;
    } else {
        return;
    }
    
    // 選択状態を更新
    for (let i = 0; i < items.length; i++) {
        if (i === selectedIndex) {
            items[i].classList.add('autocomplete-selected');
        } else {
            items[i].classList.remove('autocomplete-selected');
        }
    }
}

// 時間経過記号の挿入
function insertTimeProgress() {
    saveToUndoStack();
    
    const editArea = document.getElementById('scriptEditArea');
    const sel = window.getSelection();
    
    // 現在のキャレット位置を取得
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // 新しい時間経過要素を作成
        const newTimeProgress = document.createElement('div');
        newTimeProgress.className = 'scriptarea-togaki time-progress';
        newTimeProgress.contentEditable = true;
        newTimeProgress.textContent = '　　×　　×　　×';
        
        // カーソル位置に挿入
        const node = getDeepestNode(range.startContainer);
        const sceneRight = findParentSceneRight(node);
        
        if (sceneRight) {
            // 適切な位置に挿入
            const insertAfter = findInsertPosition(node, sceneRight);
            if (insertAfter) {
                if (insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(newTimeProgress, insertAfter.nextSibling);
                } else {
                    insertAfter.parentNode.appendChild(newTimeProgress);
                }
            } else {
                sceneRight.appendChild(newTimeProgress);
            }
        } else {
            // シーンがない場合は新しいシーンを作成して挿入
            insertHashira();
            return;
        }
        
        // 行番号を更新
        updateLineNumbers();
        
        // 変更フラグを立てる
        isEditorDirty = true;
    }
}

// 編集記号の挿入
function insertEditMark(mark) {
    saveToUndoStack();
    
    const editArea = document.getElementById('scriptEditArea');
    const sel = window.getSelection();
    
    // 現在のキャレット位置を取得
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // 新しい編集記号要素を作成
        const newEditMark = document.createElement('span');
        newEditMark.className = 'script-edit-mark';
        newEditMark.contentEditable = true;
        newEditMark.textContent = mark;
        
        // カーソル位置に挿入
        range.deleteContents();
        range.insertNode(newEditMark);
        
        // 行番号を更新
        updateLineNumbers();
        
        // 変更フラグを立てる
        isEditorDirty = true;
    }
}

// カット割り登録モーダルの設定
function setupCutMarkModal() {
    const modal = document.getElementById('cut-mark-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const registerBtn = document.getElementById('register-cut-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const descriptionField = document.getElementById('cut-description');
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // キャンセルボタン
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // 登録ボタン
    if (registerBtn && descriptionField) {
        registerBtn.addEventListener('click', function() {
            const description = descriptionField.value.trim();
            if (description) {
                insertCutMark(description);
                modal.style.display = 'none';
                
                // 入力フィールドをクリア
                descriptionField.value = '';
            }
        });
    }
    
    // エンターキーで登録
    if (descriptionField) {
        descriptionField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const description = descriptionField.value.trim();
                if (description) {
                    insertCutMark(description);
                    modal.style.display = 'none';
                    
                    // 入力フィールドをクリア
                    descriptionField.value = '';
                }
            }
        });
    }
}

// カット割りの挿入
function insertCutMark(description) {
    saveToUndoStack();
    
    const editArea = document.getElementById('scriptEditArea');
    const sel = window.getSelection();
    
    // 現在のキャレット位置を取得
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // 新しいカット割り要素を作成
        const newCutMark = document.createElement('div');
        newCutMark.className = 'script-cut-mark';
        newCutMark.contentEditable = true;
        
        // カット番号を生成
        const cutId = generateCutId();
        newCutMark.setAttribute('data-cut-id', cutId);
        
        // 改行とカット説明を追加
        const br = document.createElement('br');
        br.className = 'cut-wari';
        newCutMark.appendChild(br);
        newCutMark.appendChild(document.createTextNode(description));
        
        // カーソル位置に挿入
        const node = getDeepestNode(range.startContainer);
        const sceneRight = findParentSceneRight(node);
        
        if (sceneRight) {
            // 適切な位置に挿入
            const insertAfter = findInsertPosition(node, sceneRight);
            if (insertAfter) {
                if (insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(newCutMark, insertAfter.nextSibling);
                } else {
                    insertAfter.parentNode.appendChild(newCutMark);
                }
            } else {
                sceneRight.appendChild(newCutMark);
            }
        } else {
            // シーンがない場合は新しいシーンを作成して挿入
            insertHashira();
            return;
        }
        
        // 行番号を更新
        updateLineNumbers();
        
        // 変更フラグを立てる
        isEditorDirty = true;
    }
}

// カットIDの生成
function generateCutId() {
    // 現在のシーン番号を取得
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    const node = getDeepestNode(range.startContainer);
    const scene = findParentScene(node);
    
    if (scene) {
        const sceneId = scene.querySelector('.script-hashira-id').textContent;
        
        // 同じシーン内のカット数をカウント
        const existingCuts = scene.querySelectorAll('.script-cut-mark');
        const cutNumber = existingCuts.length + 1;
        
        // シーン番号-カット番号 の形式（例: 001-1）
        return `${sceneId}-${cutNumber}`;
    }
    
    // シーンが見つからない場合はランダムな文字列を返す
    return Math.random().toString(36).substring(2, 8);
}

// 置換モーダルの設定
function setupReplaceModal() {
    const modal = document.getElementById('replace-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const replaceSingleBtn = document.getElementById('replace-single-btn');
    const replaceAllBtn = document.getElementById('replace-all-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const searchField = document.getElementById('search-text');
    const replaceField = document.getElementById('replace-text');
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // キャンセルボタン
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // 個別置換ボタン
    if (replaceSingleBtn && searchField && replaceField) {
        replaceSingleBtn.addEventListener('click', function() {
            const searchText = searchField.value;
            const replaceText = replaceField.value;
            
            if (searchText) {
                replaceTextInEditor(searchText, replaceText, false);
            }
        });
    }
    
    // まとめて置換ボタン
    if (replaceAllBtn && searchField && replaceField) {
        replaceAllBtn.addEventListener('click', function() {
            const searchText = searchField.value;
            const replaceText = replaceField.value;
            
            if (searchText) {
                replaceTextInEditor(searchText, replaceText, true);
            }
        });
    }
}

// 置換モーダルを表示
function showReplaceModal() {
    const modal = document.getElementById('replace-modal');
    if (modal) {
        // 検索フィールドに現在の検索テキストを設定
        const searchInput = document.getElementById('searchInput');
        const searchField = document.getElementById('search-text');
        
        if (searchInput && searchField) {
            searchField.value = searchInput.value;
        }
        
        modal.style.display = 'block';
        
        // 検索フィールドにフォーカス
        if (searchField) {
            searchField.focus();
        }
    }
}

// テキストの検索と置換
function replaceTextInEditor(searchText, replaceText, replaceAll) {
    saveToUndoStack();
    
    const editArea = document.getElementById('scriptEditArea');
    
    // 現在の選択範囲を保存
    const sel = window.getSelection();
    const currentRange = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    
    // HTML全体から検索
    const html = editArea.innerHTML;
    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 正規表現用にエスケープ
    const regex = new RegExp(escapedSearch, 'g');
    
    if (replaceAll) {
        // すべて置換
        const newHtml = html.replace(regex, replaceText);
        editArea.innerHTML = newHtml;
    } else {
        // 個別置換（現在の位置から次の一致を探して置換）
        let foundMatch = false;
        
        // まずエディタ内のテキストノードをすべて取得
        const textNodes = [];
        const getTextNodes = function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    getTextNodes(node.childNodes[i]);
                }
            }
        };
        
        getTextNodes(editArea);
        
        // 現在の位置から検索
        let startNodeIndex = 0;
        let startOffset = 0;
        
        if (currentRange) {
            // 現在のキャレット位置から検索開始位置を決定
            for (let i = 0; i < textNodes.length; i++) {
                if (textNodes[i] === currentRange.startContainer) {
                    startNodeIndex = i;
                    startOffset = currentRange.startOffset;
                    break;
                }
            }
        }
        
        // 現在の位置から順に検索
        for (let i = startNodeIndex; i < textNodes.length; i++) {
            const node = textNodes[i];
            const text = node.nodeValue;
            
            // 最初のノードは現在のオフセットから検索
            const searchStartIndex = i === startNodeIndex ? startOffset : 0;
            
            // 検索テキストを含むかチェック
            const index = text.indexOf(searchText, searchStartIndex);
            
            if (index !== -1) {
                // 一致を見つけた
                foundMatch = true;
                
                // テキストを置換
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + searchText.length);
                
                // 範囲を選択
                sel.removeAllRanges();
                sel.addRange(range);
                
                // 置換テキストでの置換
                document.execCommand('insertText', false, replaceText);
                
                break;
            }
        }
        
        // 一致が見つからなかった場合、先頭から再検索
        if (!foundMatch && textNodes.length > 0) {
            for (let i = 0; i < startNodeIndex; i++) {
                const node = textNodes[i];
                const text = node.nodeValue;
                
                // 検索テキストを含むかチェック
                const index = text.indexOf(searchText);
                
                if (index !== -1) {
                    // 一致を見つけた
                    foundMatch = true;
                    
                    // テキストを置換
                    const range = document.createRange();
                    range.setStart(node, index);
                    range.setEnd(node, index + searchText.length);
                    
                    // 範囲を選択
                    sel.removeAllRanges();
                    sel.addRange(range);
                    
                    // 置換テキストでの置換
                    document.execCommand('insertText', false, replaceText);
                    
                    break;
                }
            }
        }
        
        if (!foundMatch) {
            alert('検索テキストが見つかりませんでした。');
        }
    }
    
    // 行番号を更新
    updateLineNumbers();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// エディタ内を検索
function searchInEditor() {
    const searchInput = document.getElementById('searchInput');
    const searchText = searchInput.value.trim();
    
    if (!searchText) {
        return;
    }
    
    const editArea = document.getElementById('scriptEditArea');
    
    // 現在の選択範囲を保存
    const sel = window.getSelection();
    const currentRange = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    
    // エディタ内のテキストノードをすべて取得
    const textNodes = [];
    const getTextNodes = function(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                getTextNodes(node.childNodes[i]);
            }
        }
    };
    
    getTextNodes(editArea);
    
    // 現在の位置から検索
    let startNodeIndex = 0;
    let startOffset = 0;
    
    if (currentRange) {
        // 現在のキャレット位置から検索開始位置を決定
        for (let i = 0; i < textNodes.length; i++) {
            if (textNodes[i] === currentRange.startContainer) {
                startNodeIndex = i;
                startOffset = currentRange.startOffset;
                break;
            }
        }
    }
    
    // 現在の位置から順に検索
    let foundMatch = false;
    
    for (let i = startNodeIndex; i < textNodes.length; i++) {
        const node = textNodes[i];
        const text = node.nodeValue;
        
        // 最初のノードは現在のオフセットから検索
        const searchStartIndex = i === startNodeIndex ? startOffset : 0;
        
        // 検索テキストを含むかチェック
        const index = text.indexOf(searchText, searchStartIndex);
        
        if (index !== -1) {
            // 一致を見つけた
            foundMatch = true;
            
            // 範囲を選択
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + searchText.length);
            
            sel.removeAllRanges();
            sel.addRange(range);
            
            // 選択箇所が見えるようにスクロール
            const sceneElement = findParentScene(node);
            if (sceneElement) {
                sceneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            break;
        }
    }
    
    // 一致が見つからなかった場合、先頭から再検索
    if (!foundMatch && textNodes.length > 0) {
        for (let i = 0; i < startNodeIndex; i++) {
            const node = textNodes[i];
            const text = node.nodeValue;
            
            // 検索テキストを含むかチェック
            const index = text.indexOf(searchText);
            
            if (index !== -1) {
                // 一致を見つけた
                foundMatch = true;
                
                // 範囲を選択
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + searchText.length);
                
                sel.removeAllRanges();
                sel.addRange(range);
                
                // 選択箇所が見えるようにスクロール
                const sceneElement = findParentScene(node);
                if (sceneElement) {
                    sceneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                break;
            }
        }
    }
    
    if (!foundMatch) {
        alert('検索テキストが見つかりませんでした。');
    }
}

// PDF設定モーダルの設定
function setupPdfSettingsModal() {
    const modal = document.getElementById('pdf-settings-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const generateBtn = document.getElementById('generate-pdf-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // キャンセルボタン
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // PDF生成ボタン
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            generatePDF();
            modal.style.display = 'none';
        });
    }
}

// PDFの生成
function generatePDF() {
    // PDF生成ロジックを実装
    // TODO: 実際のPDF生成処理（HTML2Canvas + jsPDFなど）
    alert('この機能は現在実装中です。');
}

// スクリプトの保存
function saveScript(asNewVersion) {
    // 保存前に内容を取得
    const scriptContent = getEditorContent();
    
    // フォームにスクリプト内容を設定
    document.getElementById('script_content').value = scriptContent;
    
    if (asNewVersion) {
        // バージョン保存の場合
        document.getElementById('save_as_new_version').value = '1';
        
        // バージョン番号を更新
        const currentVersion = parseInt(document.getElementById('version').value);
        document.getElementById('version').value = currentVersion + 1;
        
        // バージョン表示も更新
        const versionDisplay = document.querySelector('.script-menu-version');
        if (versionDisplay) {
            versionDisplay.textContent = `【第${currentVersion + 1}稿】`;
        }
    } else {
        // 上書き保存の場合
        document.getElementById('save_as_new_version').value = '0';
    }
    
    // フォームの送信
    const form = document.getElementById('script-form');
    
    // form.submit()の代わりにAjax送信
    const formData = new FormData(form);
    
    // Ajaxでフォームデータを送信
    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            // 送信成功時の処理
            isEditorDirty = false;  // 変更フラグをリセット
            lastSavedContent = scriptContent;  // 保存内容を更新
            
            // 成功メッセージ
            showSaveSuccess();
        } else {
            // エラー時の処理
            alert('保存中にエラーが発生しました。');
        }
    };
    xhr.onerror = function() {
        alert('保存中にエラーが発生しました。');
    };
    xhr.send(formData);
    
    return false;  // フォームの通常送信を防止
}

// 保存成功メッセージの表示
function showSaveSuccess() {
    // 一時的なメッセージを表示
    const message = document.createElement('div');
    message.className = 'save-success-message';
    message.textContent = '保存しました';
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.padding = '10px 20px';
    message.style.backgroundColor = '#4CAF50';
    message.style.color = 'white';
    message.style.borderRadius = '5px';
    message.style.zIndex = '9999';
    document.body.appendChild(message);
    
    // 3秒後に消える
    setTimeout(function() {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.5s';
        
        // 完全に消えた後に要素を削除
        setTimeout(function() {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 500);
    }, 3000);
}

// 決定稿に設定
function setFinalScript() {
    // 決定稿フラグを設定
    document.getElementById('is_final').value = '1';
    
    // バージョン表示を更新
    const versionDisplay = document.querySelector('.script-menu-version');
    if (versionDisplay) {
        versionDisplay.textContent = '【完成稿】';
        versionDisplay.classList.add('final');
    }
    
    // 保存処理
    saveScript(false);
}

// エディタ内容の取得
function getEditorContent() {
    // HTMLからJSON形式に変換
    const editArea = document.getElementById('scriptEditArea');
    const sceneElements = editArea.querySelectorAll('.script-scene');
    
    const scenes = [];
    
    sceneElements.forEach((sceneElement, index) => {
        // シーン番号
        const sceneId = sceneElement.querySelector('.script-hashira-id').textContent;
        
        // 場所と時間
        const location = sceneElement.querySelector('.script-hashira-location').textContent;
        const timeSettings = sceneElement.querySelector('.script-hashira-time').textContent;
        
        // 隠れ柱の説明
        const hiddenDescription = sceneElement.querySelector('.scriptarea-hashira-hidden').textContent;
        
        // シーンの右側部分（ト書き・セリフなど）
        const sceneRight = sceneElement.querySelector('.scene-right');
        const contentElements = sceneRight.childNodes;
        
        // コンテンツを配列に変換
        const content = [];
        
        if (contentElements) {
            contentElements.forEach(element => {
                if (element.nodeType === Node.ELEMENT_NODE) {
                    if (element.classList.contains('scriptarea-togaki')) {
                        content.push({
                            type: 'togaki',
                            text: element.textContent
                        });
                    } else if (element.classList.contains('scriptarea-togaki-hidden')) {
                        content.push({
                            type: 'hidden_togaki',
                            text: element.textContent
                        });
                    } else if (element.classList.contains('scriptarea-serifu')) {
                        const character = element.querySelector('.script-serifu-name').textContent;
                        const text = element.querySelector('.script-serifu-content').textContent;
                        
                        content.push({
                            type: 'serifu',
                            character: character,
                            text: text
                        });
                    } else if (element.classList.contains('scriptarea-serifu-hidden')) {
                        const character = element.querySelector('.script-serifu-name').textContent;
                        const text = element.querySelector('.script-serifu-content').textContent;
                        
                        content.push({
                            type: 'hidden_serifu',
                            character: character,
                            text: text
                        });
                    } else if (element.classList.contains('time-progress')) {
                        content.push({
                            type: 'time_progress'
                        });
                    } else if (element.classList.contains('script-page-break')) {
                        content.push({
                            type: 'page_break'
                        });
                    } else if (element.classList.contains('script-cut-mark')) {
                        content.push({
                            type: 'cut_mark',
                            cut_id: element.getAttribute('data-cut-id'),
                            description: element.textContent
                        });
                    }
                }
            });
        }
        
        // シーン左側の内容（画像など）
        const sceneLeft = sceneElement.querySelector('.scene-left');
        const leftContent = sceneLeft ? sceneLeft.innerHTML : '';
        
        // シーンデータを作成
        scenes.push({
            scene_id: sceneId,
            location: location,
            time_setting: timeSettings,
            hidden_description: hiddenDescription,
            content: content,
            left_content: leftContent
        });
    });
    
    // 台本全体のJSONデータ
    const scriptData = {
        scenes: scenes
    };
    
    return JSON.stringify(scriptData);
}

// 適切な挿入位置を見つける
function findInsertPosition(node, container) {
    while (node && node !== container) {
        if (node.parentNode === container) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

// 最も深いノードを取得
function getDeepestNode(node) {
    while (node.firstChild && node.nodeType === Node.ELEMENT_NODE) {
        node = node.firstChild;
    }
    return node;
}

// 親のシーン要素を見つける
function findParentScene(node) {
    while (node && !node.classList.contains('script-scene')) {
        node = node.parentNode;
    }
    return node;
}

// シーンの右側コンテナを見つける
function findParentSceneRight(node) {
    const scene = findParentScene(node);
    if (scene) {
        return scene.querySelector('.scene-right');
    }
    return null;
}

// Undoスタックに現在の状態を保存
function saveToUndoStack() {
    const content = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(content);
    
    // スタックサイズを制限
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Redoスタックをクリア
    redoStack = [];
}

// Undoの実行
function undo() {
    if (undoStack.length === 0) {
        return;
    }
    
    // 現在の状態をRedoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    redoStack.push(currentContent);
    
    // Undoスタックから状態を復元
    const prevContent = undoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = prevContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// Redoの実行
function redo() {
    if (redoStack.length === 0) {
        return;
    }
    
    // 現在の状態をUndoスタックに保存
    const currentContent = document.getElementById('scriptEditArea').innerHTML;
    undoStack.push(currentContent);
    
    // Redoスタックから状態を復元
    const nextContent = redoStack.pop();
    document.getElementById('scriptEditArea').innerHTML = nextContent;
    
    // 行番号を更新
    updateLineNumbers();
    
    // シーン一覧を更新
    updateSceneList();
    
    // 変更フラグを立てる
    isEditorDirty = true;
}

// ショートカットキーの設定
document.addEventListener('keydown', function(e) {
    // Ctrl+Sで保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
            // Ctrl+Shift+Sでバージョン保存
            saveScript(true);
        } else {
            // Ctrl+Sで上書き保存
            saveScript(false);
        }
    }
    
    // Ctrl+Zでundo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    // Ctrl+Yでredo（またはCtrl+Shift+Z）
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
    }
    
    // Ctrl+Hで柱挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        insertHashira();
    }
    
    // Ctrl+Tでト書き挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        insertTogaki();
    }
    
    // Ctrl+Lでセリフ挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        insertSerifu();
    }
    
    // Esc キーでモーダルを閉じる
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (window.getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }
});

// エディタ内のセリフ改行修正
function fixSerifuLinebreaks() {
    const serifuContents = document.querySelectorAll('.script-serifu-content');
    
    serifuContents.forEach(content => {
        // 改行を proper な形式に変換
        const html = content.innerHTML;
        if (html.includes('<div>') || html.includes('<p>')) {
            // divやpタグを単純な改行に変換
            const newHtml = html.replace(/<div>(.*?)<\/div>/g, '$1<br>')
                             .replace(/<p>(.*?)<\/p>/g, '$1<br>');
            content.innerHTML = newHtml;
        }
    });
}

// 定期的なオートセーブ
function setupAutoSave() {
    setInterval(function() {
        if (isEditorDirty) {
            // 最後の保存から内容が変わっている場合のみ自動保存
            const currentContent = getEditorContent();
            if (currentContent !== lastSavedContent) {
                saveScript(false);
            }
        }
    }, 300000); // 5分ごとに自動保存
}
