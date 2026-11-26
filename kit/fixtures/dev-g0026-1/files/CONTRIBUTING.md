# 変更の入れ方

- テストは `npm test`（`node --test`）で回します。
- 作業は作業用の branch で行い、PR にします。`main` には、レビューの後に入れます。

## PR の branch は共有の branch です

- レビュー担当は、小さな直し（表記・テスト）を、PR の branch に直接 push することがあります。手元の branch が remote の先端と同じだとは限りません。
- push の前に、remote を取り込みます（`git fetch` / `git pull --rebase`）。push が拒否されたら、`--force` で押し切らず、まず取り込みます。
- main に rebase し直すときは、先に PR の branch の remote の先端（`origin/<branch>`）を取り込んでから、main の上に載せ直します。
- rebase した後の push は `--force-with-lease` にします。ただし、fetch した後の `--force-with-lease` は、取り込んでいない他の人の commit を守りません（lease は fetch した先端と比べるだけです）。push した後、remote の branch にほかの人の commit が残っているかを確かめます。
- 前に、レビュー担当の直しを `--force` で消してしまい、同じ不具合が本番に出ました。
