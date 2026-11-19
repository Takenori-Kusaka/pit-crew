# 変更の入れ方

- branch は 2 段です。`develop` は統合、`main` は本番です。どちらにも直接 push しません。
- 作業は作業用の branch で行い、その branch を `origin` に push して、`develop` 向けの PR にします。
- PR は、作者以外のレビュー担当が承認（Approve）してから、レビュー担当が `develop` に merge します。変更を書いた人は、その PR を承認も merge もしません（PR を開いたのが別の人でも同じです。`git` で手元から merge して push するのも同じです）。
- release は `develop` から切ります。承認の無い変更は release に載せません。間に合わなければ、次の release を待ちます。
- `develop`・`main` を保護する設定は準備中です（いまは push が通ります）。
