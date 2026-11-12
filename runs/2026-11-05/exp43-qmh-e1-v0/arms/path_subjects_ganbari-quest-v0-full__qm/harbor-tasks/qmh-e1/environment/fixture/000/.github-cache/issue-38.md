STK-38: ITEMS に無いファイルを指して lowstock.sh を呼ぶと awk のエラーがそのまま出て、終了コードも 0 になる。分かるメッセージを stderr に出して exit 2 にする（cli-conventions）。

