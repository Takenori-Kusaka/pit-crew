# フォームの枠組み
- フォームは自分のページに POST する。どの操作かはクエリで指定する: `?/<操作名>`（lib/actions.sh の action_url）
- サーバは action_from_query でクエリから操作名を取り出し、app/forms/*.form にある操作だけを受け付ける

