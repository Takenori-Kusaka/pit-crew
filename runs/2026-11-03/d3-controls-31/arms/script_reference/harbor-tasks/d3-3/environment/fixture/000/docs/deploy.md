# デプロイ
本番は Cirrus の container image で動く。image は Cirrus のビルダーが main の merge ごとに作る。

- 含めるもの: `bin/` `lib/` `config/` と、`deps.ini` の `[runtime]` に書いた `vendor/<name>/`
- 含めないもの: `deps.ini` の `[dev]` の依存（image を小さく保ち、試験用の道具を本番に置かないため）
- 手元で同じ中身を作るには `scripts/build-image.sh` を使う

セルフホスト版（docs/selfhost.md）は `vendor/` を丸ごと含む。

