# Log rotation
`bin/rotate <ログ dir> <退避先 dir> <名前> <日付>` はログを世代送りし（name.1, name.2, ...）、最新の世代を退避先に name.<日付> で写す。
ローカルの世代送りは lib/local.sh、退避先への写しは lib/archive.sh。

