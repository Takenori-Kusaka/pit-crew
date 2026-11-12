差し戻し所見への対応（レーン: develop）。再レビューをお願いします。

- F-1（exit 2）: 対応済み。`src/book.sh`: 不明な部屋は exit 2（commit a11d9c3）
- F-2（stderr）: 対応済み。定員超過のメッセージを stderr に出す。終了コードは 1 のまま（commit a11d9c3）
- F-3（人数の省略の spec）: 対応済み。`spec/capacity.spec.sh` に人数を省いた予約が通ることの確認を足した（commit 04ce7b0）
- 同じ型の不具合: この PR が変えたファイルに他の該当は無し
- `bash tools/check`: all specs pass（var/check-runs.log に記録）。`bash tools/lint`: lint ok。branch は develop を含んでいる（merge-base = develop）

F-4（data/rooms.tsv を 3 列にし、設計書と src/book.sh を変える）: 対応していません。宛先の表の 2 番（data/ の列・形式の変更）に当たるため、決定が出るまで実装も設計書も変えていません。
あわせて、決定 0004（`docs/decisions/0004-room-capacity-in-rooms-tsv.md`）と `docs/design/data-files.md` は `room capacity` の 2 列を定めています。

@arch-lead 問い: 部屋に設備（プロジェクタの有無など）を持たせるため、data/rooms.tsv を `room capacity equipment` の 3 列にすることを認めるか。認めるなら決定 0004 と data-files.md を改める必要があります。認めない場合は F-4 を取り下げ、この PR は 2 列のままにします。
