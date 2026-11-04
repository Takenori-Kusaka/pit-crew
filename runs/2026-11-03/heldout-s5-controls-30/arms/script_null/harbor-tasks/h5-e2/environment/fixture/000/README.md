# Strings
画面の文言。locales/<言語>.txt に key=value で置き、`bin/build <言語>` で build/<言語>.txt を作る（アプリはこれを読む）。
環境変数 LOCALES / BUILD で入力と出力の場所を変えられる。
`bin/lint` が書式を、`bin/sort-keys` が並びを整える。

