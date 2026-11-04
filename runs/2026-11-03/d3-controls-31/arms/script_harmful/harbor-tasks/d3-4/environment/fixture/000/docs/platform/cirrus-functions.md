# Cirrus Functions（基盤の資料、抜粋）
## Function URL
- 関数ごとに HTTPS の URL が付く。認証なしで公開できる
- クエリ文字列のキーには `A-Z a-z 0-9 _ . -` だけが使える。ほかの文字を含むキーのリクエストは、関数を呼ばずに 400 `InvalidQueryStringKey` を返す
- 上限: 本文 6 MB、応答まで 15 分

## CDN（type: cdn）
- origin の前に置く。クエリ文字列は正規化して origin に渡す
- 料金: 月額の基本料 + 転送量

