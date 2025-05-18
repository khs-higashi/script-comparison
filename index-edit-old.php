<?php
// キャッシュを無効化するためのヘッダーを設定
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // 過去の日付

// セッション開始
session_start();

// CSRFトークン生成
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// 作品IDをURLから取得
$work_id = basename(dirname(dirname($_SERVER['PHP_SELF'])));

// 全ユーザーに一時的に編集権限を付与（デバッグ用）
$can_edit = true;

// データベース接続
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    die("接続エラー: " . $conn->connect_error);
}

// 台本IDが指定されているか確認
$edit_mode = false;
$script_id = '';
$version = 1; // デフォルトバージョン

if (isset($_GET['id']) && !empty($_GET['id'])) {
    $script_id = $_GET['id'];
    $edit_mode = true;
    
    // バージョンが指定されている場合
    if (isset($_GET['version']) && !empty($_GET['version'])) {
        $version = (int)$_GET['version'];
    }
}

// 作品情報を取得
$stmt = $conn->prepare("SELECT * FROM work WHERE work_id = ?");
$stmt->bind_param("s", $work_id);
$stmt->execute();
$result = $stmt->get_result();
$work = $result->fetch_assoc();

// scriptテーブルから台本データを取得
$script = [];
$scenes = [];

if ($edit_mode) {
    // 既存の台本データを取得（バージョン指定があればそれを使用）
    $stmt = $conn->prepare("SELECT * FROM script WHERE script_id = ? AND work_id = ? AND version = ?");
    $stmt->bind_param("ssi", $script_id, $work_id, $version);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $script = $result->fetch_assoc();
        
        // コンテンツがJSONで保存されている場合はデコード
        if (isset($script['content']) && !empty($script['content'])) {
            $content = json_decode($script['content'], true);
            if (is_array($content) && isset($content['scenes'])) {
                $scenes = $content['scenes'];
            }
        }
    } else {
        // 指定されたバージョンが見つからない場合、最新バージョンを取得
        $stmt = $conn->prepare("SELECT * FROM script WHERE script_id = ? AND work_id = ? ORDER BY version DESC LIMIT 1");
        $stmt->bind_param("ss", $script_id, $work_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $script = $result->fetch_assoc();
            $version = $script['version']; // 実際のバージョンを更新
            
            // コンテンツをデコード
            if (isset($script['content']) && !empty($script['content'])) {
                $content = json_decode($script['content'], true);
                if (is_array($content) && isset($content['scenes'])) {
                    $scenes = $content['scenes'];
                }
            }
        }
    }
} else {
    // 新規作成モード - デフォルト値を設定
    $script_id = $work_id . 's' . '001';
    $script = [
        'script_id' => $script_id,
        'work_id' => $work_id,
        'title' => '',
        'version' => 1,
        'is_final' => 0,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    // 初期シーンを作成
    $scenes = [[
        'scene_id' => '001',
        'scene_title' => '',
        'location' => '場所を入力',
        'time_setting' => '',
        'characters' => [],
        'description' => '',
        'dialogue' => []
    ]];
}

// 登場人物データの取得（シーン設定用）
$characters = [];
$stmt = $conn->prepare("SELECT * FROM script_characters WHERE work_id = ?");
$stmt->bind_param("s", $work_id);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $characters[] = $row;
}

$conn->close();

// 現在のページカテゴリを設定
$current_page = 'script';
$current_subpage = 'index';

// 作品情報ページのテンプレートを読み込む
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/template/template_script.php';
?>

<!-- 外部CSSを読み込む - メニューとアイコン部分 -->
<link rel="stylesheet" href="/css/script.css?v=<?php echo time(); ?>">

<main>
    <section class="w1200">
        <h2>台本作成</h2>
        
        <?php if (isset($_GET['error'])): ?>
        <div class="error-message">
            <p>エラー: <?php echo htmlspecialchars($_GET['error']); ?></p>
        </div>
        <?php endif; ?>
        
        <?php if (isset($_GET['updated']) && $_GET['updated'] == 1): ?>
        <div class="success-message">
            <p>台本が更新されました。</p>
        </div>
        <?php endif; ?>
        
        <form method="post" action="index-edit-process.php" class="edit-form" id="script-form">
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
            <input type="hidden" name="script_id" value="<?php echo htmlspecialchars($script['script_id'] ?? ''); ?>">
            <input type="hidden" name="work_id" value="<?php echo htmlspecialchars($work_id); ?>">
            <input type="hidden" name="edit_mode" value="<?php echo $edit_mode ? '1' : '0'; ?>">
            <input type="hidden" name="script_content" id="script_content" value="">
            
            <div class="script-form-row" style="display: none;">
                <input type="hidden" id="title" name="title" value="<?php echo htmlspecialchars($script['title'] ?? ''); ?>">
                <input type="hidden" id="version" name="version" value="<?php echo htmlspecialchars($script['version'] ?? 1); ?>">
                <input type="hidden" id="is_final" name="is_final" value="<?php echo (isset($script['is_final']) && $script['is_final'] == 1) ? '1' : '0'; ?>">
            </div>
            
            <!-- 台本エディタのコンテナ -->
            <div class="script-editor-container">
                <!-- 左サイドバー（柱一覧） -->
                <div class="script-sidebar">
                    <div class="script-sidebar-title">シーン一覧</div>
                    <div id="script-scene-list">
                        <!-- ここにシーン一覧が動的に追加される -->
                        <?php foreach ($scenes as $index => $scene): ?>
                        <div class="script-sidebar-scene" data-scene="<?php echo $index; ?>">
                            #<?php echo htmlspecialchars($scene['scene_id'] ?? ''); ?> 
                            <?php echo htmlspecialchars($scene['location'] ?? ''); ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- メインエディタエリア -->
                <div class="script-main">
                    <!-- メニューバー -->
                    <div class="script-menu-bar">
                        <div class="script-menu-items">
							<div class="script-menu-item">
								ファイル
								<div class="script-dropdown">
									<div class="script-dropdown-item" id="menuNewFile">
										<span>新規作成</span>
										<span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘N' : 'Ctrl+N'; ?></span>
									</div>
									<div class="script-dropdown-item" id="menuOpenVersion">
										<span>バージョンを開く</span>
										<span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⇧N' : 'Ctrl+Shift+N'; ?></span>
									</div>
									<div class="script-dropdown-item" id="menuDeleteVersion">
										<span>削除</span>
										<span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⌫' : 'Ctrl+Del'; ?></span>
									</div>
									<div class="script-dropdown-item" id="menuDeleteAll">
										<span>すべて削除</span>
										<span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⇧⌫' : 'Ctrl+Shift+Del'; ?></span>
									</div>
									<div class="script-dropdown-item" id="menuExitEdit">
										<span>編集終了</span>
									</div>
								</div>
							</div>
                            
                            <div class="script-menu-item">
                                保存
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuSaveOverwrite">
                                        <span>上書き保存</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘S' : 'Ctrl+S'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuSaveVersion">
                                        <span>バージョン保存</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⇧S' : 'Ctrl+Shift+S'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuSetFinal">
                                        <span>決定稿指定</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuSyncKouban">
                                        <span>香盤反映</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuSaveText">
                                        <span>テキスト保存</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuSavePDF">
                                        <span>PDF保存</span>
                                    </div>
                                </div>
                            </div>
							
							<div class="script-menu-item">
                                挿入
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuInsertHashira">
                                        <span>柱</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘H' : 'Ctrl+H'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertHiddenHashira">
                                        <span>隠れ柱</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⇧H' : 'Ctrl+Shift+H'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertTogaki">
                                        <span>ト書き</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘T' : 'Ctrl+T'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertHiddenTogaki">
                                        <span>隠れト書き</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘⇧T' : 'Ctrl+Shift+T'; ?></span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertHiddenChar">
                                        <span>隠れ登場人物</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertSerifu">
                                        <span>セリフ</span>
                                        <span class="script-shortcut"><?php echo (strpos($_SERVER['HTTP_USER_AGENT'], 'Mac') !== false) ? '⌘L' : 'Ctrl+L'; ?></span>
                                    </div>
                                    <!-- 特殊記号のメニュー項目 -->
                                    <div class="script-dropdown-item" id="menuInsertSpecialMark">
                                        <span>特殊記号</span>
                                        <i class="fa-solid fa-chevron-right submenu-icon"></i>
                                        <div class="script-submenu">
                                            <div class="script-submenu-item" data-action="insertTimeProgress">
                                                時間経過
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 編集記号のメニュー項目 -->
                                    <div class="script-dropdown-item" id="menuInsertEditMark">
                                        <span>編集記号</span>
                                        <i class="fa-solid fa-chevron-right submenu-icon"></i>
                                        <div class="script-submenu">
                                            <div class="script-submenu-item" data-mark="F.I." data-action="insertEditMark">
                                                F.I. フェードイン
                                            </div>
                                            <div class="script-submenu-item" data-mark="F.O." data-action="insertEditMark">
                                                F.O. フェードアウト
                                            </div>
                                            <div class="script-submenu-item" data-mark="D.F." data-action="insertEditMark">
                                                D.F. ディゾルブ（前のカットから）
                                            </div>
                                            <div class="script-submenu-item" data-mark="D.T." data-action="insertEditMark">
                                                D.T. ディゾルブ（次のカットへ）
                                            </div>
                                            <div class="script-submenu-item" data-mark="WILD" data-action="insertEditMark">
                                                WILD ワイルド録音
                                            </div>
                                            <div class="script-submenu-item" data-mark="MOS" data-action="insertEditMark">
                                                MOS 音声なし撮影
                                            </div>
                                            <div class="script-submenu-item" data-mark="SUP" data-action="insertEditMark">
                                                SUP スーパー
                                            </div>
                                            <div class="script-submenu-item" data-mark="PAN" data-action="insertEditMark">
                                                PAN パン
                                            </div>
                                            <div class="script-submenu-item" data-mark="TILT" data-action="insertEditMark">
                                                TILT ティルト
                                            </div>
                                            <div class="script-submenu-item" data-mark="Z.I." data-action="insertEditMark">
                                                Z.I. ズームイン
                                            </div>
                                            <div class="script-submenu-item" data-mark="Z.O." data-action="insertEditMark">
                                                Z.O. ズームアウト
                                            </div>
                                            <div class="script-submenu-item" data-mark="TS" data-action="insertEditMark">
                                                TS トラッキングショット
                                            </div>
                                            <div class="script-submenu-item" data-mark="BGM" data-action="insertEditMark">
                                                BGM 挿入音楽
                                            </div>
                                            <div class="script-submenu-item" data-mark="SE" data-action="insertEditMark">
                                                SE 効果音
                                            </div>
                                        </div>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertImage">
                                        <span>画像</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertPageBreak">
                                        <span>ページ区切り</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertLink">
                                        <span>リンク</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertTextboxV">
                                        <span>テキストボックス(縦)</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertTextboxH">
                                        <span>テキストボックス(横)</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuInsertCut">
                                        <span>カット割り指定</span>
                                    </div>
                                </div>
                            </div>
                            <div class="script-menu-item">
                                香盤情報
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuKoubanAll">
                                        <span>すべて</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanChar">
                                        <span>登場人物</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanProp">
                                        <span>小道具</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanDevice">
                                        <span>大道具・装置・劇中車両等</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanCostume">
                                        <span>衣裳</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanMakeup">
                                        <span>メイク</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanEffect">
                                        <span>特殊効果</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanPlace1">
                                        <span>場所１</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanPlace2">
                                        <span>場所２</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanPlace3">
                                        <span>場所３</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanTime">
                                        <span>時間帯</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuKoubanOther">
                                        <span>その他</span>
                                    </div>
                                </div>
                            </div>
							
							<div class="script-menu-item">
                                描画
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuDrawRect">
                                        <span>四角形</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawCircle">
                                        <span>円</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawEllipse">
                                        <span>楕円</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawTriangle">
                                        <span>三角形</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawLine">
                                        <span>直線</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawArrow">
                                        <span>矢印</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuDrawBubble">
                                        <span>吹き出し</span>
                                    </div>
                                </div>
                            </div>
                            <div class="script-menu-item">
                                表示
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuViewHiddenHashira">
                                        <span class="view-toggle" data-view="hiddenHashira" data-state="hidden">隠れ柱 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewHiddenTogaki">
                                        <span class="view-toggle" data-view="hiddenTogaki" data-state="hidden">隠れト書き 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewHiddenChar">
                                        <span class="view-toggle" data-view="hiddenChar" data-state="hidden">隠れ登場人物 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewEditMark">
                                        <span class="view-toggle" data-view="editMark" data-state="hidden">編集記号 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewPageBreak">
                                        <span class="view-toggle" data-view="pageBreak" data-state="hidden">ページ区切り 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewStructure">
                                        <span class="view-toggle" data-view="structure" data-state="hidden">柱・ト書き・セリフ 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewKouban">
                                        <span class="view-toggle" data-view="kouban" data-state="hidden">香盤情報 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewCut">
                                        <span class="view-toggle" data-view="cut" data-state="hidden">カット割 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewLineNumber">
                                        <span class="view-toggle" data-view="lineNumber" data-state="hidden">行番号 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuViewBookmark">
                                        <span class="view-toggle" data-view="bookmark" data-state="hidden">しおり 表示</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuToggleVerticalMode">
                                        <span class="view-toggle" data-view="verticalMode" data-state="horizontal">縦書きモード</span>
                                    </div>
                                </div>
                            </div>
                            <div class="script-menu-item">
                                校閲
                                <div class="script-dropdown">
                                    <div class="script-dropdown-item" id="menuCheckSpelling">
                                        <span>スペルチェックと文章校正</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuCountChars">
                                        <span>文字カウント</span>
                                    </div>
                                    <div class="script-dropdown-item" id="menuCheckProhibited">
                                        <span>禁止用語・注意用語</span>
                                    </div>
                                </div>
                            </div>
                            <div class="script-menu-item">
                                <a href="#" target="_blank">ヘルプ</a>
                            </div>
                        </div>
  
                        <!-- 第●稿を表示 -->
                        <div class="script-menu-version<?php echo (isset($script['is_final']) && $script['is_final'] == 1) ? ' final' : ''; ?>">
                            <?php
                            if (isset($script['is_final']) && $script['is_final'] == 1) {
                                echo '【完成稿】';
                            } else {
                                echo '【第' . ($script['version'] ?? 1) . '稿】';
                            }
                            ?>
                        </div>
                    
                    </div>
                            
                    <!-- ツールバー -->
                    <div class="script-toolbar">
                        <!-- 保存ボタンを追加 -->
                        <button type="button" class="script-tool-btn" id="toolbarSaveBtn" title="保存（Ctrl+S）"><i class="fa-solid fa-save"></i></button>
                        <div class="script-tool-separator"></div>
                        
                        <button type="button" class="script-tool-btn" title="柱挿入" id="toolHashira"><i class="fa-solid fa-flag"></i></button>
                        <button type="button" class="script-tool-btn" title="ト書き挿入" id="toolTogaki"><i class="fa-solid fa-chalkboard"></i></button>
                        <button type="button" class="script-tool-btn" title="セリフ挿入" id="toolSerifu"><i class="fa-solid fa-comments"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="1つ前に戻る" id="toolUndo"><i class="fa-solid fa-undo"></i></button>
                        <button type="button" class="script-tool-btn" title="1つ先に進む" id="toolRedo"><i class="fa-solid fa-redo"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="コピー" id="toolCopy"><i class="fa-solid fa-copy"></i></button>
                        <button type="button" class="script-tool-btn" title="ペースト" id="toolPaste"><i class="fa-solid fa-paste"></i></button>
                        <button type="button" class="script-tool-btn" title="太字" id="toolBold"><i class="fa-solid fa-bold"></i></button>
                        <button type="button" class="script-tool-btn" title="斜体" id="toolItalic"><i class="fa-solid fa-italic"></i></button>
                        <button type="button" class="script-tool-btn" title="下線" id="toolUnderline"><i class="fa-solid fa-underline"></i></button>
                        <button type="button" class="script-tool-btn" title="取消線" id="toolStrike"><i class="fa-solid fa-strikethrough"></i></button>

                        <button type="button" class="script-tool-btn" title="下付き" id="toolSubscript"><i class="fa-solid fa-subscript"></i></button>
                        <button type="button" class="script-tool-btn" title="上付き" id="toolSuperscript"><i class="fa-solid fa-superscript"></i></button>
                        <button type="button" class="script-tool-btn" title="囲み" id="toolBox"><i class="fa-regular fa-square"></i></button>
                        <button type="button" class="script-tool-btn" title="色文字" id="toolColor"><i class="fa-solid fa-palette"></i></button>
                        <button type="button" class="script-tool-btn" title="蛍光" id="toolHighlight"><i class="fa-solid fa-highlighter"></i></button>
                        <button type="button" class="script-tool-btn" title="網掛け" id="toolPattern"><i class="fa-solid fa-language"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="ルビ" id="toolRuby"><i class="fa-solid fa-comment-dots"></i></button>
                        <button type="button" class="script-tool-btn" title="リンク挿入" id="toolLink"><i class="fa-solid fa-link"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="文字サイズ小" id="toolFontSmall"><i class="fa-solid fa-text-height fa-xs"></i></button>
                        <button type="button" class="script-tool-btn" title="文字サイズ大" id="toolFontMedium"><i class="fa-solid fa-text-height"></i></button>
                        <button type="button" class="script-tool-btn" title="文字サイズ特大" id="toolFontLarge"><i class="fa-solid fa-text-height fa-lg"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="左揃え" id="toolAlignLeft"><i class="fa-solid fa-align-left"></i></button>
                        <button type="button" class="script-tool-btn" title="中央揃え" id="toolAlignCenter"><i class="fa-solid fa-align-center"></i></button>
                        <button type="button" class="script-tool-btn" title="右揃え" id="toolAlignRight"><i class="fa-solid fa-align-right"></i></button>
                        <button type="button" class="script-tool-btn" title="均等配置" id="toolAlignJustify"><i class="fa-solid fa-align-justify"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="省略記号" id="toolEllipsis"><i class="fa-solid fa-ellipsis"></i></button>
                        <button type="button" class="script-tool-btn" title="長音記号" id="toolDash">―</button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="リスト" id="toolBulletList"><i class="fa-solid fa-list-ul"></i></button>
                        <button type="button" class="script-tool-btn" title="数字リスト" id="toolNumberList"><i class="fa-solid fa-list-ol"></i></button>
                        <button type="button" class="script-tool-btn" title="セリフ連結" id="toolJoinSerifu"><i class="fa-solid fa-people-arrows"></i></button>

                        <div class="script-tool-separator"></div>

                        <button type="button" class="script-tool-btn" title="画像挿入" id="toolImage"><i class="fa-solid fa-image"></i></button>
                    </div>
					
                    <!-- 台本編集エリア -->
                    <div class="script-editor-content">
                        <div class="script-line-numbers-container">
                            <div class="script-line-numbers script-line-numbers-continuous" id="scriptLineNumbersContinuous"></div>
                            <div class="script-line-numbers script-line-numbers-scene" id="scriptLineNumbersScene" style="display: none;"></div>
                        </div>
                        <div class="script-edit-area" id="scriptEditArea" contenteditable="true">
                            <?php if (empty($scenes) || count($scenes) === 0): ?>
                            <!-- 初期の台本ブロック -->
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
                                        <!-- 左側エリア（画像などを配置できる） -->
                                    </div>
                                    <div class="scene-right">
                                        <!-- 初期のト書き -->
                                        <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
                                    </div>
                                </div>
                            </div>
                            <?php else: ?>
                            <!-- 既存の台本を表示 -->
                            <?php foreach ($scenes as $index => $scene): ?>
                            <div class="script-scene" data-scene-index="<?php echo $index; ?>">
                                <div class="scriptarea-hashira">
                                    <div class="script-hashira-id"><?php echo htmlspecialchars($scene['scene_id']); ?></div>
                                    <div class="script-hashira-content">
                                        <div class="script-hashira-location-row">
                                            <span class="script-hashira-location" contenteditable="true"><?php echo htmlspecialchars($scene['location'] ?? ''); ?></span>
                                            <span class="script-hashira-time" contenteditable="true"><?php echo htmlspecialchars($scene['time_setting'] ?? ''); ?></span>
                                        </div>
                                        <div class="scriptarea-hashira-hidden" contenteditable="true"><?php echo htmlspecialchars($scene['hidden_description'] ?? ''); ?></div>
                                    </div>
                                </div>
                                <div class="scene-layout">
                                    <div class="scene-left">
                                        <!-- 左側エリア（画像などを配置できる） -->
                                        <?php if (isset($scene['left_content'])): ?>
                                        <?php echo $scene['left_content']; ?>
                                        <?php endif; ?>
                                    </div>
                                    <div class="scene-right">
                                        <!-- ト書きとセリフを表示 -->
                                        <?php if (isset($scene['content']) && is_array($scene['content'])): ?>
                                        <?php foreach ($scene['content'] as $item): ?>
                                        
                                        <?php if ($item['type'] === 'togaki'): ?>
                                        <div class="scriptarea-togaki" contenteditable="true"><?php echo htmlspecialchars($item['text']); ?></div>
                                        <?php elseif ($item['type'] === 'hidden_togaki'): ?>
                                        <div class="scriptarea-togaki-hidden" contenteditable="true"><?php echo htmlspecialchars($item['text']); ?></div>
                                        <?php elseif ($item['type'] === 'serifu'): ?>
                                        <div class="scriptarea-serifu">
                                            <div class="script-serifu-name" contenteditable="true"><?php echo htmlspecialchars($item['character']); ?></div>
                                            <div class="script-serifu-content" contenteditable="true"><?php echo htmlspecialchars($item['text']); ?></div>
                                        </div>
                                        <?php elseif ($item['type'] === 'hidden_serifu'): ?>
                                        <div class="scriptarea-serifu-hidden">
                                            <div class="script-serifu-name" contenteditable="true"><?php echo htmlspecialchars($item['character']); ?></div>
                                            <div class="script-serifu-content" contenteditable="true"><?php echo htmlspecialchars($item['text']); ?></div>
                                        </div>
                                        <?php elseif ($item['type'] === 'time_progress'): ?>
                                        <div class="scriptarea-togaki time-progress" contenteditable="true">　　×　　×　　×</div>
                                        <?php elseif ($item['type'] === 'page_break'): ?>
                                        <div class="script-page-break">＝＝＝＝＝ページ区切り＝＝＝＝＝</div>
                                        <?php endif; ?>
                                        
                                        <?php endforeach; ?>
                                        <?php else: ?>
                                        <!-- 初期のト書き -->
                                        <div class="scriptarea-togaki" contenteditable="true">ト書きを入力...</div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                    <!-- ↑台本編集エリア -->
                </div>
            </div>
        </form>
        
        <!-- キャラクター選択モーダル -->
        <div id="character-select-modal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>登場人物を選択</h3>
                <div class="character-list">
                    <?php foreach ($characters as $character): ?>
                    <div class="character-item" data-name="<?php echo htmlspecialchars($character['display_name']); ?>">
                        <?php echo htmlspecialchars($character['display_name']); ?>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="character-input">
                    <label for="custom-character">もしくは登場人物名を入力:</label>
                    <input type="text" id="custom-character" placeholder="新しい登場人物名">
                    <button type="button" id="add-character-btn">追加</button>
                </div>
            </div>
        </div>
        
        <!-- 香盤情報指定モーダル -->
        <div id="kouban-select-modal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>香盤情報を指定</h3>
                <div class="kouban-type-select">
                    <select id="kouban-type">
                        <option value="character">登場人物</option>
                        <option value="prop">小道具</option>
                        <option value="device">大道具・装置・劇中車両等</option>
                        <option value="costume">衣裳</option>
                        <option value="makeup">メイク</option>
                        <option value="effect">特殊効果</option>
                        <option value="place1">場所１</option>
                        <option value="place2">場所２</option>
                        <option value="place3">場所３</option>
                        <option value="time">時間帯</option>
                        <option value="other">その他</option>
                    </select>
                </div>
                <div class="kouban-description">
                    <label for="kouban-desc">詳細:</label>
                    <input type="text" id="kouban-desc" placeholder="詳細情報（必要に応じて）">
                </div>
                <button type="button" id="apply-kouban-btn">適用</button>
            </div>
        </div>
        
        <!-- バージョン選択モーダル -->
        <div id="version-select-modal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>バージョンを選択</h3>
                <div class="version-list" id="version-list">
                    <!-- バージョンリストがJSで動的に追加される -->
                </div>
            </div>
        </div>
    </section>
</main>

<?php
// フッターの読み込み
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/footer.php';
?>

<script src="/js/script.js"></script>

</body>
</html>