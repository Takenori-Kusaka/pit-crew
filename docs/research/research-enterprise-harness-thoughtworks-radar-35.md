# 調査: Thoughtworks Technology Radar Vol. 35 と「エンタープライズハーネス（Enterprise Harness）」の体系

- 調査日: 2026-11-08
- 対象: Thoughtworks Technology Radar Vol. 35（November 2026）[一次: `docs/research/tr_technology_radar_vol_35_en.txt`]、連動ブログ記事「The harness is a product」（Cecilia Geraldo 著）[一次]
- 結論: ハーネスエンジニアリング（AIエージェントを取り巻く環境を構築するすべての営み：メモリ、コンテキスト、ツール/MCP、ガードレール、フィードバックループ）は、個別技術を超えた独立した専門規律（discipline）として成熟した。数年前に起きたプラットフォームエンジニアリング（IDP）の台頭と全く同じ軌跡をたどり、組織全体で流通・統制される「エンタープライズハーネス（Enterprise harness）」が1つのソフトウェアプロダクトとして登場しつつある。客観的評価（Eval）、実業務に基づくテストセット、自己改善ループのブレーキ（提案は自動化、承認は人間）、およびプラグインマーケットプレイスによる全社配布が中核を成す。本内容は pit-crew / pit-wall の存在意義・設計思想の根拠であり、ADR 化の規範となる。
- 前の調査との関係: `docs/research/research-runners.md`（ランナー選定と軌跡フォーマット）、`research-reusable-role-harness.md`（役割ハーネスの再利用性）、`research-ecological-validity.md`（実事故セル）の結論を、Thoughtworks の最新レーダー（Vol. 35）の全社的・産業的視点から裏付け、体系化した。

---

## 1. Technology Radar Vol. 35 の全体像と主要テーマ

Technology Radar Vol. 35（2026年11月）では、エージェント型システム（Agentic Systems）の実用化と大規模化に伴う構造変化が前面に出ている。本号では冒頭に4つの主要マクロテーマが掲げられている [一次]。

### 4大マクロテーマの概要
1. **Harness engineering at scale（大規模なハーネスエンジニアリング）**:
   単一の技術 Blip を超え、多くの技術と実践を結びつける中核テーマ。エージェントを取り巻く環境全体（ハーネス）の規律化と、生きた資産（living asset）としてのプロダクト管理、エンタープライズハーネスの台頭。
2. **Balancing code volume and comprehension（コード量と理解度のバランス）**:
   AI によるコード生成の爆発的増加に伴い、生成されたコードの保守性・可読性・構造理解を維持するための技法。
3. **Context, memory, and cognitive load in agentic systems（エージェントシステムにおけるコンテキスト・メモリ・認知負荷）**:
   有限なコンテキスト窓における段階的開示（Progressive Disclosure）、セッション間の記憶保持、サブエージェントによる認知負荷の分散。
4. **Navigating AI safety, security, and compliance（AIの安全性・セキュリティ・コンプライアンスの航海）**:
   エージェントが自律行動する際の影響範囲（Blast radius）の統制、権限管理、監査証跡の確保。

---

## 2. マクロテーマ「Harness engineering at scale」の詳細分析

### 2.1 原文と和訳 (p. 8) [一次]

> **Harness engineering at scale**
> 
> There was debate about whether to include harness engineering as an individual blip in the Radar, but given it's a theme that connects many techniques and technologies, we decided to highlight it as such in this volume.
> 
> Although the term isn't new, this edition highlights a growing ecosystem of practices and tools that shows how harness engineering (everything we do to construct the environment around an AI agent, from memory and context to feedback loops and guardrails) is maturing into a more cohesive discipline. In particular, an emerging plugin ecosystem is taking shape, illustrated by Agent Plugins, agent plugin marketplace and supporting tools such as Agent Package Manager.
> 
> Alongside these developments, it's becoming clear that the harness is a living asset that requires ongoing ownership and maintenance. We've discussed, for example, harness quality evaluation, building a self-improving harness and using a feedback flywheel to ensure agents improve over time.
> 
> The broader challenge is scaling the harness to meet enterprise needs. In the coming months, we may see the enterprise harness emerge as a product, not unlike what happened with platforms and platform engineering a few years ago.

> **【和訳】大規模なハーネスエンジニアリング**
> 
> 「ハーネスエンジニアリング」をレーダーの個別の Blip（技術項目）として掲載すべきか議論がありましたが、多くの手法や技術を結びつけるテーマであることから、今号ではマクロテーマとして取り上げることにしました。
> 
> この用語自体は目新しいものではありませんが、本号では、**ハーネスエンジニアリング（AIエージェントを取り巻く環境を構築するために行うすべてのこと：メモリやコンテキストからフィードバックループ、ガードレールに至るまで）** が、いかにしてより体系的で結束力のある専門規律（discipline）へと成熟しつつあるかを示す、実践とツールの成長著しいエコシステムに焦点を当てています。特に、「Agent Plugins」や「Agent plugin marketplace（エージェントプラグインマーケットプレイス）」、そして「Agent Package Manager」などの支援ツールに代表される、新たなプラグインエコシステムが形作られつつあります。
> 
> これらの進展に伴い、**ハーネスは継続的なオーナーシップと保守を必要とする「生きた資産（living asset）」である**ことが明確になりつつあります。例えば、エージェントが継続的に改善されることを担保するために、「Harness quality evaluation（ハーネス品質評価）」や「Self-improving harness（自己改善ハーネス）」の構築、そして「Feedback flywheel（フィードバックフライホイール）」の活用について議論を重ねてきました。
> 
> より大きな課題は、**エンタープライズの要件を満たすようハーネスをスケールさせること**です。今後数か月のうちに、数年前にプラットフォームやプラットフォームエンジニアリングに起きたことと同様に、**「エンタープライズハーネス（enterprise harness）」がひとつのプロダクトとして登場してくる可能性**があります。

---

## 3. レーダー掲載のハーネス・エージェント関連 Blip 精査

Technology Radar Vol. 35 においてハーネスおよびエージェントエンジニアリングに直結する Blip の精査結果 [一次]。

| Blip 番号 | Quadrant | Ring | 項目名 | 核心内容と示唆 |
|---|---|---|---|---|
| **#27** | Techniques | **Assess** | **Enterprise harness** | プラットフォームエンジニアリングのアナロジー。全社で共有・統制される共通ハーネス基盤。ガバナンス、コスト管理、セキュリティ境界の一元化。 |
| **#29** | Techniques | **Assess** | **Harness quality evaluation** | ハーネス自体の品質を客観的に評価する枠組み。「活動量指標（トークン数等）」ではなく、タスク成否や副作用を測定する。 |
| **#7** | Techniques | **Trial** | **Agent plugin marketplace** | スキル、指示書、MCPサーバー、サブエージェント定義を依存関係（APM）として管理し全社配布する流通網。エンタープライズハーネスの実践的手段。 |
| **#10** | Techniques | **Trial** | **Coding harness for general-purpose agents** | 成熟したコーディングエージェント（Claude Agent SDK, Codex SDK, OpenCode, Pi 等）のランタイム（コンテキスト圧縮、セッション永続化、ヘッドレス実行）を汎用業務に再利用。 |
| **#11** | Techniques | **Trial** | **Feedback flywheel** | 過去の実行セッションの成否からハーネスを改善するチームの習慣（プラクティス）。エージェントが改修案を提案し、人間が選択・適用する。 |
| **#18** | Techniques | **Trial** | **Self-improving harness** | エージェント自身に実行トレースと評価フィードバックを分析させ、プロンプト・スキル・ツール・ミドルウェアを自律改修させる。人間による境界設定と Held-out リグレッション検証が前提。 |
| **#5** | Techniques | **Trial** | **Progressive context disclosure** | ツールやスキルの定義を最初から全量展開せず、必要時に遅延展開することでコンテキスト窓の消費とコストを抑制する。 |
| **#21** | Techniques | **Trial** | **Subagents for better context management** | 単一セッションに文脈を詰め込まず、サブエージェントにタスクを委任してコンテキストを分離・整理する。 |
| **#23** | Techniques | **Trial** | **Unattended overnight agentic builds** | 夜間の無人大量バッチ作業。人間による全行レビューが不可能なため、変更を検証できる「十分にテストされたハーネス」が必須となる。 |
| **#90** | Tools | **Assess** | **DeepSeek Harness (DSH)** | 拡張可能なワークフロー・コンテキスト管理を備えたハーネス実装ツール。 |

---

## 4. エンタープライズハーネスの構成要素と原則

連動ブログ「The harness is a product」および Vol. 35 の記述から抽出された、ハーネスをプロダクトとして成立させるための構成要素と原則 [一次]。

### 4.1 ハーネスの 8 つの構成要素
1. **指示とスキル（Instructions & Skills）**: エージェントが読み込むシステムプロンプト、役割定義、専門スキル。
2. **ツール群（Tools）**: API、関数、外部ツール呼び出し（MCP 含む）。
3. **権限・サンドボックス（Permissions & Sandboxes）**: 隔離環境、実行権限、アクセス境界（Blast radius / 影響範囲）。
4. **コンテキスト方針（Context Policy）**: 履歴、関連ファイル、規約の選択・段階的注入ルール。
5. **状態管理（State）**: ステップ間・セッション間の記憶保持（状態ファイル等）。
6. **オーケストレーション（Orchestration）**: 手順シーケンス、多段階ループ、サブエージェント委任。
7. **評価系（Evaluation）**: 客観的テストケース、決定論的グレーダー、LLM-as-a-judge。
8. **テレメトリ・観測可能性（Telemetry）**: トレース収集、逸脱検出、失敗原因究明。

### 4.2 ハーネスエンジニアリングの中核原則
- **「プロンプト付き設定負債（Configuration debt with a system prompt）」の排除**: 一時的な実験設定やプロンプトのコピペ・継ぎ足しを拒否し、リポジトリ管理、バージョン管理、来歴追跡（Provenance）を行う。
- **「評価（Eval）なき変更は禁止」**: 客観的に測定できない変更はマージしない。
- **活動量指標と品質指標の分離**: トークン数や受入率（Busy の証明）ではなく、タスク達成度や害の有無（害の述語、副作用）を測定する。
- **ゴールデンテストセットの実業務タスク化**: 公開ベンチマークではなく、現場の実事故や業務から抽出したテストケース（セル）を版管理する。
- **自己改善ループのガバナンス**: 提案は自動化しても、測定可能な評価基盤、来歴追跡、迅速な切り戻し経路を担保し、マージの承認は人間が握る（*Automate the proposal, keep the approval*）。

---

## 5. pit-crew / pit-wall への直接的示唆と ADR 策定論点

本調査の内容は、pit-crew のアーキテクチャおよび今後のロードマップに以下の直接的な示唆を与える [推論]:

1. **プロダクトとしての役割ハーネス（Dev / QM / Fix）の確立**:
   pit-crew で開発中の各役割ハーネス（スキル、状態ファイル、手順規約）は、単なるプロンプト集ではなく「独立したプロダクト」である。バージョン管理、互換性、変更エビデンスをセットで管理する。
2. **pit-wall による客観的評価の必須化**:
   すべてのハーネス変更は、pit-wall（Harbor runner、決定論的グレーダー、LLM 陪審、Held-out 検証）によるテスト通過をマージ条件（品質ゲート）とする。
3. **エンタープライズ流通を見据えたモジュール化**:
   汎用の核（Core）と案件アダプタ（Adapter）の分離を徹底し、将来的な Agent Plugins や Agent plugin marketplace による配布・依存関係管理に耐えうる構造を維持する。
4. **Issue #2 (Langfuse) および Issue #3 (NeMo 手法) との整合**:
   - Langfuse: 8要素のうち「評価系（Evaluation）」と「テレメトリ（Telemetry）」を担う基盤。
   - NeMo 手法: 「Self-improving harness」の実践形態。実行トレースから Harbor 評価タスクを自動生成し、人間承認のもとでハーネスを改修するループを形成する。

これらの論点は、今後起票する **ADR-0001（ハーネスを第一級のプロダクトとして管理する原則）** の直接の根拠として規定される。
