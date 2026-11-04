# GRN-23 調査メモ（前のセッション、途中）
- 症状: 3 日おきの苗床 A1 が、水やりから 3 日目の bin/sched の出力に出てこない
- 見立て: bin/water-due の比較（-ge のところ）。sched は water-due の出力を見ているだけなので関係なさそう
- 再現テストは tests/water_due_test.sh に書いた（3 日おきの苗床）。verify は通っている
- 残り: 比較を直して commit

