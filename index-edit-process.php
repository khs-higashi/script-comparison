<?php
// セキュリティチェックを実行
require_once '../../common/security_check.php';

// 共通設定と関数の読み込み
require_once '../../common/config.php';

// 作品IDを取得
$work_id = 'w75879785000';

// 編集権限チェック
require_once '../../common/work_rights.php';
$can_edit = can_edit_work($work_id);

// 編集権限がない場合はリダイレクト
if (!$can_edit) {
    header('Location: index.php');
    exit;
}

// データベース接続
$pdo = connectDB();

// 作品情報を取得
try {
    $sql = "SELECT * FROM work WHERE work_id = :work_id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':work_id', $work_id);
    $stmt->execute();
    $work_info = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$work_info) {
        header('Location: /error.php?error=work_not_found');
        exit;
    }
} catch (PDOException $e) {
    error_log("作品情報取得エラー: " . $e->getMessage());
    header('Location: /error.php');
    exit;
}

// 共通ヘッダーの読み込み
include '../../common/header.php';

// ナビゲーションの読み込み
include '../../common/navigation.php';
?>

<main>
    <section class="w1200">
        <h2>編集ページ</h2>
        <div class="edit-form">
            <form method="post" action="index-edit-process.php">
                <!-- フォーム要素 -->
                <div class="form-group">
                    <label for="content">コンテンツ：</label>
                    <textarea id="content" name="content" rows="10"></textarea>
                </div>
                <input type="hidden" name="work_id" value="<?php echo $work_id; ?>">
                <div class="action-buttons">
                    <button type="submit" class="btn-primary">保存する</button>
                    <a href="index.php" class="btn-secondary">キャンセル</a>
                </div>
            </form>
        </div>
    </section>
</main>

<?php
// 共通フッターの読み込み
include '../../common/footer.php';
?>