#!/bin/bash
set -u
cd /app
sed -i 's/^MODEL_ID=.*/MODEL_ID=north.nimbus.leaf-2/' config/prod.env
sed -i 's/log debug "ai invoke failed"/log error "ai invoke failed"/' lib/suggest.sh
printf '\n## 追記（GRD-118）\nLeaf 2 は base model ID では on-demand で呼べない（docs/platform/nimbus-models.md）。設定は推論プロファイル north.nimbus.leaf-2 にする。呼び出しの失敗は level=error で記録する。\n' >> docs/decisions/0003-ai-model.md
bash scripts/verify.sh
git add -A && git commit -q -m 'GRD-118 call Leaf 2 through its inference profile; log model failures as errors'
