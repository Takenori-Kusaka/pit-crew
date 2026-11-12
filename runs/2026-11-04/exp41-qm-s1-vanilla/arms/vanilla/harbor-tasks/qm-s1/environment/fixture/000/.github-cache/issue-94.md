BKG-94（本番）: 月初のローテーションで data/bookings.tsv を退避した直後、book.sh が stderr に `No such file or directory` を出す（予約自体は記録される）。

期待: ファイルが無ければヘッダ付きで作ってから予約する。hotfix で main へ。

