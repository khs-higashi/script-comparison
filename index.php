<?php
// /work/work-format/schedule/index.php

// 作品IDをURLから取得
$work_id = basename(dirname(dirname($_SERVER['PHP_SELF'])));

// 権限チェック
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/work_rights.php';
$user_role = check_page_access($work_id, 'basic_info');
$can_edit = true; // 常に編集権限あり（デバッグ用）

// 現在のページカテゴリを設定
$current_page = 'schedule';
$current_subpage = 'index';

// 全体香盤ページのテンプレートを読み込む
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/template/template_schedule.php';
?>

// CSSを読み込む
<link rel="stylesheet" href="/css/schedule.css">

<!-- 撮影スケジュールページのコンテンツ -->
<main class="wrapper-work w1200">
    <div class="content-header">
        <h2>撮影スケジュール</h2>
    </div>		

	<!-- カレンダー表示（一覧、月、週間、日ごと） -->
	<section class="kouban-tab fullsize">
	  <div class="kouban-tabitem active" data-tab="total-schedule">スケジュール一覧</div>
	  <div class="kouban-tabitem" data-tab="month-schedule">月表示</div>	
	  <div class="kouban-tabitem" data-tab="week-schedule">週間表示</div>		
	  <div class="kouban-tabitem" data-tab="day-schedule">日ごと表示</div>			
	</section>			

	<!-- 各タブに対応する表示エリア -->
	<section class="kouban-contentarea fullsize">

	<!-- タブ1- スケジュール一覧 -->			
	<div class="kouban-content active" id="total-schedule">

		<h4>●年●月</h4>
		
		<div>
			<ul>
				<li>前月</li>
					<i class="fa-solid fa-caret-left"></i>
				<li>当月</li>
					<i class="fa-solid fa-caret-right"></i>
				<li>翌月</li>
			</ul>
		</div>
		
		<table class="kouban-table">
			<tbody>
				<tr>
					<th>年</th>
					<th>月</th>
					<th>日</th>
					<th>曜日</th>
					<th>地域</th>
					<th>日出</th>						
					<th>日没</th>
					<th>天気</th>
					<th>降水</th>
					<th>全体予定</th>
					<th>備考</th>
				</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>
		</div>  

		<!-- タブ２- 月表示 -->			
		<div class="kouban-content" id="month-schedule">月表示の範囲

		<h4>●年●月</h4>
		
		<div>
			<ul>
				<li>前月</li>
					<i class="fa-solid fa-caret-left"></i>
				<li>当月</li>
					<i class="fa-solid fa-caret-right"></i>
				<li>翌月</li>
			</ul>
		</div>
			
		<table class="kouban-table">
			<tbody>
				<tr>
					<th>日</th>
					<th>月</th>
					<th>火</th>
					<th>水</th>
					<th>木</th>
					<th>金</th>						
					<th>土</th>
				</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>
		</div>

		<!-- タブ３- 週間表示 -->				
		<div class="kouban-content" id="week-schedule">週間表示の範囲
			
		<h4>●年●月</h4>
		
		<div>
			<ul>
				<li>前月</li>
					<i class="fa-solid fa-caret-left"></i>
				<li>当月</li>
					<i class="fa-solid fa-caret-right"></i>
				<li>翌月</li>
			</ul>
		</div>			

		<table class="kouban-table">
			<tbody>
				<tr>
					<th>時刻</th>						
					<th>日</th>
					<th>月</th>
					<th>火</th>
					<th>水</th>
					<th>木</th>
					<th>金</th>						
					<th>土</th>
				</tr>
				<tr>
					<td>0：00</td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>
		</div>			  		  

		<!-- タブ４- 日ごと表示 -->			
		<div class="kouban-content" id="day-schedule">日ごと表示の範囲
			
		<div>
			<ul>
				<li>前日</li>
					<i class="fa-solid fa-caret-left"></i>
				<li>当日</li>
					<i class="fa-solid fa-caret-right"></i>
				<li>翌日</li>
			</ul>
		</div>				

		<table class="kouban-table">
			<tbody>
				<tr>
					<th>時刻</th>
					<th>スケジュール</th>
				</tr>
				<tr>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>
		</div>		  

	</section>

	<section>
		<!-- 編集ボタン - 新規作品登録スタイルを適用 -->
		<div>
			<a href="index-edit.php"><p class="linkbox-center">編集する</p></a>
		</div>
	</section>

	
    <div class="schedule-content">
        <?php
        // 現在の年月を取得
        $current_year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
        $current_month = isset($_GET['month']) ? intval($_GET['month']) : date('n');
        
        // 有効な年月かチェック
        if ($current_month < 1 || $current_month > 12) {
            $current_month = date('n');
        }
        
        // 前月・翌月のリンク用の年月を計算
        $prev_month = $current_month - 1;
        $prev_year = $current_year;
        if ($prev_month < 1) {
            $prev_month = 12;
            $prev_year--;
        }
        
        $next_month = $current_month + 1;
        $next_year = $current_year;
        if ($next_month > 12) {
            $next_month = 1;
            $next_year++;
        }
        
        // 月初めの曜日と月の日数を取得
        $first_day_of_month = mktime(0, 0, 0, $current_month, 1, $current_year);
        $first_day_of_week = date('w', $first_day_of_month); // 0（日曜）～ 6（土曜）
        $days_in_month = date('t', $first_day_of_month);
        
        // 曜日の名前
        $weekdays = array('日', '月', '火', '水', '木', '金', '土');
        
        // データベースから撮影スケジュールを取得
        require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/config.php';
        $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

        if ($conn->connect_error) {
            die("接続エラー: " . $conn->connect_error);
        }
        
        // 現在表示中の月のスケジュールデータを取得
        $start_date = sprintf('%04d-%02d-01', $current_year, $current_month);
        $end_date = sprintf('%04d-%02d-%02d', $current_year, $current_month, $days_in_month);
        
        $sql = "SELECT * FROM shooting_schedule 
                WHERE work_id = ? 
                AND shooting_date BETWEEN ? AND ?
                ORDER BY shooting_date";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $work_id, $start_date, $end_date);
        $stmt->execute();
        $schedule_result = $stmt->get_result();
        
        // スケジュールデータを日付ごとに整理
        $schedule_data = array();
        while ($schedule = $schedule_result->fetch_assoc()) {
            $date = date('j', strtotime($schedule['shooting_date'])); // 日だけを取得
            if (!isset($schedule_data[$date])) {
                $schedule_data[$date] = array();
            }
            $schedule_data[$date][] = $schedule;
        }
        
        // 月のナビゲーション
        echo '<div class="month-navigation">';
        echo '<a href="?year=' . $prev_year . '&month=' . $prev_month . '" class="nav-prev">&lt; 前月</a>';
        echo '<h3>' . $current_year . '年' . $current_month . '月</h3>';
        echo '<a href="?year=' . $next_year . '&month=' . $next_month . '" class="nav-next">翌月 &gt;</a>';
        echo '</div>';
        
        // カレンダー表示
        echo '<div class="calendar-container">';
        echo '<table class="calendar">';
        
        // 曜日のヘッダー
        echo '<tr class="calendar-header">';
        foreach ($weekdays as $weekday) {
            $class = ($weekday == '日') ? 'sunday' : (($weekday == '土') ? 'saturday' : '');
            echo '<th class="' . $class . '">' . $weekday . '</th>';
        }
        echo '</tr>';
        
        // カレンダーの日付セル
        echo '<tr>';
        
        // 月初めの前の空白セル
        for ($i = 0; $i < $first_day_of_week; $i++) {
            echo '<td class="empty"></td>';
        }
        
        // 日付のセル
        for ($day = 1; $day <= $days_in_month; $day++) {
            $date_timestamp = mktime(0, 0, 0, $current_month, $day, $current_year);
            $date_string = date('Y-m-d', $date_timestamp);
            $weekday = date('w', $date_timestamp);
            
            // 曜日に応じたクラス
            $class = ($weekday == 0) ? 'sunday' : (($weekday == 6) ? 'saturday' : '');
            
            // 今日の日付かどうか
            if ($date_string == date('Y-m-d')) {
                $class .= ' today';
            }
            
            // スケジュールがある日かどうか
            if (isset($schedule_data[$day])) {
                $class .= ' has-schedule';
            }
            
            echo '<td class="' . $class . '">';
            echo '<div class="date-number">' . $day . '</div>';
            
            // スケジュール内容を表示
            if (isset($schedule_data[$day])) {
                echo '<div class="schedule-items">';
                
                foreach ($schedule_data[$day] as $schedule) {
                    echo '<div class="schedule-item">';
                    echo '<a href="schedule-detail.php?id=' . $schedule['id'] . '">';
                    echo '<div class="schedule-time">' . htmlspecialchars($schedule['start_time'] ?? '終日') . '</div>';
                    echo '<div class="schedule-title">' . htmlspecialchars($schedule['title']) . '</div>';
                    echo '</a>';
                    echo '</div>';
                }
                
                echo '</div>';
            }
            
            // 編集リンク
            if ($can_edit) {
                echo '<div class="date-actions">';
                echo '<a href="add-schedule-day.php?date=' . $date_string . '" class="btn-small">+</a>';
                echo '</div>';
            }
            
            echo '</td>';
            
            // 週の終わりで行を閉じて新しい行を開始
            if ($weekday == 6 && $day < $days_in_month) {
                echo '</tr><tr>';
            }
        }
        
        // 月末の後の空白セル
        $last_day_of_week = ($first_day_of_week + $days_in_month - 1) % 7;
        for ($i = $last_day_of_week + 1; $i <= 6; $i++) {
            echo '<td class="empty"></td>';
        }
        
        echo '</tr>';
        echo '</table>';
        echo '</div>';
        
        $conn->close();
        ?>
    </div>
</main>

<?php
// フッター表示
require_once $_SERVER['DOCUMENT_ROOT'] . '/work/common/work_footer.php';
?>