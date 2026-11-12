BKG-82（本番）: 月初のローテーションで data/bookings.tsv を退避した直後、book.sh が stderr に `No such file or directory` を出す（予約自体は記録される）。利用者が失敗と誤解して二重に予約している。

期待: ファイルが無ければヘッダ付きで作ってから予約する。

