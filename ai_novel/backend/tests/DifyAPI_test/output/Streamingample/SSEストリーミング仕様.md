# SSEストリーミング仕様

文字通信の「data:」を削除し、JSON形式の文字列にしたもの。

## ワークフロー開始

{"event": "workflow_started", "workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "task_id": "5827c114-8c64-4625-b532-4caab7798187", "data": {"id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "workflow_id": "ae8c492c-53e6-4e80-843a-8f8bbfed5225", "sequence_number": 77, "inputs": {"basic_setting": "# 基本設定\n\n## 仮題\n『リバース・メモリーズ』\n\n## サマリー\n東京の高校に通う主人公・片桐悠は、ある日突如として一部の記憶を失っていることに気づく。（中略）「真鍋沙耶」という名前が出てきた途端、悠の頭に鈍い痛みが走る。", "act_number": 1, "episode_number": 1, "sys.files": [], "sys.user_id": "test_user_id", "sys.app_id": "0382253c-5aa6-488e-9022-2131fc268571", "sys.workflow_id": "ae8c492c-53e6-4e80-843a-8f8bbfed5225", "sys.workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c"}, "created_at": 1743063352}}

### 識別キー

{"event": "workflow_started"}

## ノード開始

{"event": "node_started", "workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "task_id": "5827c114-8c64-4625-b532-4caab7798187", "data": {"id": "daa67184-7bf7-42f1-a6fa-fff8f118bfa0", "node_id": "start", "node_type": "start", "title": "START", "index": 1, "predecessor_node_id": null, "inputs": null, "created_at": 1743063353, "extras": {}, "parallel_id": null, "parallel_start_node_id": null, "parent_parallel_id": null, "parent_parallel_start_node_id": null, "iteration_id": null, "loop_id": null, "parallel_run_id": null, "agent_strategy": null}}

### 識別キー

{"event": "node_started"}

## ノード終了

{"event": "node_finished", "workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "task_id": "5827c114-8c64-4625-b532-4caab7798187", "data": {"id": "daa67184-7bf7-42f1-a6fa-fff8f118bfa0", "node_id": "start", "node_type": "start", "title": "START", "index": 1, "predecessor_node_id": null, "inputs": {"basic_setting": "# 基本設定\n\n## 仮題\n『リバース・メモリーズ』（中略）\n\n", "act_number": 1, "episode_number": 1, "sys.files": [], "sys.user_id": "test_user_id", "sys.app_id": "0382253c-5aa6-488e-9022-2131fc268571", "sys.workflow_id": "ae8c492c-53e6-4e80-843a-8f8bbfed5225", "sys.workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c"}, "status": "succeeded", "error": null, "elapsed_time": 0.093376, "execution_metadata": null, "created_at": 1743063353, "finished_at": 1743063353, "files": [], "parallel_id": null, "parallel_start_node_id": null, "parent_parallel_id": null, "parent_parallel_start_node_id": null, "iteration_id": null, "loop_id": null}}

### 識別キー

{"event": "node_finished"}

## テキストチャンク（データチャンク）

チャンク受信: {"event": "text_chunk", "workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "task_id": "5827c114-8c64-4625-b532-4caab7798187", "data": {"text": " 第", "from_variable_selector": ["1739755793136", "text"]}}

### 識別キー

{"event": "text_chunk"}

### テキストデータ

{"event": "data": {"text": "（テキストデータ）"} }

## ワークフロー終了チャンク（最終チャンク）

 {"event": "workflow_finished", "workflow_run_id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "task_id": "5827c114-8c64-4625-b532-4caab7798187", "data": {"id": "46dbdc1a-0d55-40fb-a196-785251baeb5c", "workflow_id": "ae8c492c-53e6-4e80-843a-8f8bbfed5225", "sequence_number": 77, "status": "succeeded", "outputs": {"result": "# 第1幕 記憶の欠片（中略）全ての記憶を取り戻すために——。"}, "error": null, "elapsed_time": 38.01043808599934, "total_tokens": 27285, "total_steps": 4, "created_by": {"id": "bba70c10-9983-454f-9a68-5f5099103c51", "user": "test_user_id"}, "created_at": 1743063352, "finished_at": 1743063390, "exceptions_count": 0, "files": []}

### 識別キー

{"event": "workflow_finished"}

### ステータス

{"event": "data": {"status": "success"|"error"} }

### 結果データ

{"event": "data": {"outputs": {"result": "（テキストデータ）"}}}
