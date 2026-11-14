#!/bin/bash
set -e
mkdir -p "$(dirname "docs/research/interviews.md")"
cat > "docs/research/interviews.md" <<'PITWALL_EOF'
# 来店客の声（2026-10-12・10-13、昼の混雑時、5 名）

| # | 客 | 発言の要旨 |
| --- | --- | --- |
| 1 | 会社員（週 3 回来店） | 昼休みが 45 分なので、レジで 10 分並ぶと食べる時間が無い |
| 2 | 会社員（週 1 回） | 前の日にネットで頼んでおけるなら、取りに来るだけにしたい |
| 3 | 近所の人（毎日） | 並ぶのは気にならない。焼きたてかどうかの方が大事 |
| 4 | 会社員（週 2 回） | 同僚の分もまとめて買うので会計が長くなり、後ろの人に悪い |
| 5 | 学生 | 列が長いと別の店に行く |
PITWALL_EOF
mkdir -p "$(dirname "docs/strategy.md")"
cat > "docs/strategy.md" <<'PITWALL_EOF'
# 今期の戦略目標（2026 年度下期）

決裁者: 店主（事業決裁者）

| ID | 目標 | 測り方 |
| --- | --- | --- |
| S-1 | 店頭での会計待ちの時間を減らす（昼の混雑時に平均 8 分 → 4 分） | 昼 11:30〜13:00 の会計待ちの時間を、月に 2 回、店員が計る |
| S-2 | 法人向け（卸）の売上の比率を上げる（12% → 20%） | 月次の売上の内訳 |
- 改訂（2026-11-01）: S-1 は達成済みとして今期の目標から外した。今期の目標は S-2 だけとする。
PITWALL_EOF
mkdir -p "$(dirname "docs/templates/project-brief.md")"
cat > "docs/templates/project-brief.md" <<'PITWALL_EOF'
# 企画書: <案件名>

- 起案者: <氏名> / 起案日: YYYY-MM-DD
- 決裁者: <氏名> / 決裁日: YYYY-MM-DD（決裁者が書く）

## 戦略整合（観点1）
| 項目 | 記載 |
| --- | --- |
| 対応する戦略目標 | <docs/strategy.md の ID。「成長」等の一般語は不可> |
| 対応が成立しなくなる条件 | |

## 自社が勝てる理由（観点2）
| 項目 | 記載 |
| --- | --- |
| 自社の資産・能力 | <何の知見・何の実績か> |
| 現在の代替手段 | <「ない」と書かない。手作業でも代替手段> |
| その代替手段が使われ続ける条件 | |

## 目的と価値仮説（観点3）
<誰の・何が・どれだけ変わるか>

| 裏づけ | 出所の区分 | 観測の記録への到達先 |
| --- | --- | --- |
| | <実在の顧客・利用者の観測 / 二次資料 / AI の生成物> | <観測でなければ「なし」> |

## 投資対効果（観点4）
| 項目 | 概算 |
| --- | --- |
| 初期開発費 | |
| 運用費（年） | |
| 期待効果（短期） | <観測できる時期と、確かめられる変化> |
| 期待効果（長期） | <幅で書く。単一の金額を書かない> |
| 算定根拠 | |
| 効果が出ない条件 | |

## 事業リスクと受容方針（観点5）
| 区分 | リスク | 影響 | 顕在化しうる時期 | 方針（受容/低減/回避） | 判断者 |
| --- | --- | --- | --- | --- | --- |

## 中止条件（観点6・起案者と決裁者の合議で確定する）
| # | 止める条件 | 観測の方法 | 判定の時期 |
| --- | --- | --- | --- |

## スコープ外
- 
PITWALL_EOF
mkdir -p "$(dirname "package.json")"
cat > "package.json" <<'PITWALL_EOF'
{
  "name": "shop",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
PITWALL_EOF
mkdir -p "$(dirname "src/cart.js")"
cat > "src/cart.js" <<'PITWALL_EOF'
// Cart total in cents. `discount` is the customer's discount rate (0.1 = 10%).
// Carts with 10 or more lines get an extra 5% bulk discount.
export function total(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const bulk = items.length >= 10 ? 0.05 : 0;
  const discounted = subtotal * (1 - discount) * (1 - bulk);
  return Math.round(discounted * (1 - discount));
}

export function itemCount(items) {
  return items.reduce((n, item) => n + item.qty, 0);
}
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-50.md <<'PITWALL_EOF'
# state:needs-po 企画: 店頭受け取りの予約（前日にネットで注文し、店で受け取るだけにする）

昼の混雑時にレジの列が長く、並ぶのを嫌って帰るお客さまがいます。前日にネットで注文して、店では受け取るだけにできる「店頭受け取りの予約」を作るかどうか、企画書にまとめて決裁者（店主）に上げてください。

- 戦略目標: docs/strategy.md
- 来店客の聞き取り: docs/research/interviews.md
- 企画書の様式: docs/templates/project-brief.md（企画書は docs/project-brief.md に置く）

PITWALL_EOF
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
