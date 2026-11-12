BKG-100: 引数を付け忘れると src/book.sh と src/remind.sh が bash のエラー（unbound variable）で落ちる。

どちらも、引数の数が合わないときは使い方の誤りとして扱う（docs/design/cli-conventions.md §使い方・入力の誤り）。

