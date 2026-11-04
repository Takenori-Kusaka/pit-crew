# 同種欠陥の横展開探索と、作業前の base 確認：一次資料の確認

調査日: 2026-11-02

## 目的

Dev の作業手順に入れる規則 2 つの裏付けを一次資料で確かめる。(A)「欠陥を 1 つ見つけたら、同じ種類の欠陥を他の場所でも探す」。社内実験では、エージェントが同じ式の文字列だけを grep し、名前も書き方も違う helper にある意味上同じ欠陥（例: `round_tenth()` の `($1 * 9 + 9) / 10` と、別所の `($1 * 90 + 99) / 100`。どちらも切り上げ）を見落とした。そこで、意味で探す・履歴で探す手順が文献で支えられるかを確かめる。(B)「作業前に base を確認し、ブランチ比較は two-dot ではなく three-dot（merge-base 起点）の diff で行う」。git 公式文書の定義を確かめる。

前の調査との関係（2026-11-02 追記）: (A) の「同じ型を探す」は `research-dev-quality-bar.md`（t-wada「テストをすり抜けた不具合は見落としていた視点を示す。同じ種類の誤りが他にないか」）と `research-ganbari-role-process-inventory.md`（GQ の横展開 dp/lateral。同じ文字列の grep で全件を確かめる手順）で扱っていた。どちらも「何で探すか」（意味・構造・履歴）は扱っておらず、今回の新しい点はそこと実証研究の数値。(B) の three-dot は `research-ganbari-incidents.md`（I-12・I-23 と、生まれた規則「three-dot で見る」）で扱っていた。今回の新しい点は git 公式の定義。前の調査にあって今回扱わなかった点: GQ の並行実装ペアの一覧（案件固有）。このファイルの調査を頼んだとき、読むべき既存の調査を指示に含めなかった（README の規則に反した。`docs/log/2026-11-02.md`）

印の意味: [一次・確認済み] = 一次資料を開いて記述を確認した / [二次] = 他の文献の引用でしか確認していない / [未確認] = 開けなかった / [推論] = 資料からの筆者の推論。

## (A) 同種欠陥の横展開探索

| 主張 | 出典 | 引用・要約 | 印 |
|---|---|---|---|
| 解決済みバグの 22〜33% は修正が 1 回で終わらず、補足修正が入った | Park, Kim, Ray, Bae, "An Empirical Study of Supplementary Bug Fixes", MSR 2012, pp.40-49. https://web.cs.ucla.edu/~miryung/Publications/msr2012-supplementarypatch.pdf | "a significant portion of resolved bugs (22% to 33%) involves more than one fix attempt." 内訳は Eclipse JDT core 22%、Eclipse SWT 24%、Mozilla 33%（本文の表では 22.46%〜32.81%） | [一次・確認済み] |
| 修正漏れの原因はさまざまで、移植漏れ・条件分岐の扱い誤り・リファクタリングの途中止めなど | 同上 | "the causes of omission errors are diverse, including missed porting changes, incorrect handling of conditional statements, or incomplete refactorings, etc."（100 件の無作為抽出を手作業で確認） | [一次・確認済み] |
| 補足修正のうち、最初の修正と内容が似ている（クローン）ものはごく一部。クローン解析だけでは修正漏れの場所を予測できない | 同上 | "only a very small portion of supplementary patches (15% in JDT, 17% in SWT, and 8% in Mozilla) have a content similar to their initial patches. This implies that supplementary change locations cannot be predicted by code clone analysis alone." 類似の基準は CCFinder で 5 行以上。注意: 同じ論文の関連研究節は "only 9% to 26%" と書いており、数値が abstract と食い違う | [一次・確認済み]（食い違いも本文で確認） |
| 補足修正の多くは最初の修正の近く、または直接の構造依存（呼び出し・アクセス・継承）先にある。ただし 14〜15% のファイルは近くもなく依存もない | 同上 | "48% and 42% of files in a supplementary patch involve changes within 25 lines of the initial patch location"（JDT / SWT）。"32% and 29% of files ... have direct structural dependence (e.g., direct calls, accesses, and subtyping relations)"。"the remaining 15% and 14% ... do not have direct dependence to nor overlap with the initial patch location." | [一次・確認済み] |
| 修正の 17〜45% が繰り返し型（似たコードへの同種修正）である | Nguyen et al., "Recurring bug fixes in object-oriented programs", ICSE 2010, pp.315-324 | 数値は Park et al. 2012 の関連研究節の引用 "Nguyen et al. find that 17% to 45% of total fixes are recurring bug fixes" でのみ確認。原論文の本文は開けていない | [二次] |
| 繰り返し型修正の多くは「code peers」（役割が似たクラス・メソッド）で起きる | 同上。https://ieeexplore.ieee.org/document/6062099 | abstract: "a large percentage of them occurs in code peers, the classes/methods having the similar roles in the systems, such as providing similar functions and/or participating in similar object interactions." 定義: "A bug-fixing change is considered recurring if it is repeated identically or with relevant, slight modifications on several code fragments" | [一次・確認済み]（abstract と序論のみ。割合の数値は abstract に無い） |
| コピペされたコードで識別子の変更漏れがバグになる。Linux で 28 件、FreeBSD で 23 件を検出 | Li, Lu, Myagmar, Zhou, "CP-Miner", OSDI 2004. https://www.usenix.org/legacy/event/osdi04/tech/full_papers/li_z/li_z.pdf | "CP-Miner has detected 28 copy-paste related bugs in the latest version of Linux and 23 in FreeBSD." "A major reason why copy-paste introduces bugs is that programmers forget to modify identifiers (variables, functions, types, etc.) consistently throughout the pasted code." | [一次・確認済み] |
| 大規模 OS の出荷後バグ修正のうち 14.8〜24.4% が誤った修正だった | Yin, Yuan, Zhou, Pasupathy, Bairavasundaram, "How Do Fixes Become Bugs?", ESEC/FSE 2011. https://www.eecg.utoronto.ca/~yuan/papers/incorrect_fix_abstract.html | "at least 14.8% to 24.4% of sampled fixes for post-release bugs in these large OSes are incorrect"。これは「誤った修正」全体の割合で、「不完全な修正」だけの割合ではない。不完全な修正だけの割合は確認できなかった | [一次・確認済み]（数値の意味を訂正） |
| 同じ根本原因の箇所をすべて直し忘れることが不完全修正の一因。同じパターン・使い方の箇所を全体から探す手法で軽減できるが、一貫したパターンが取りにくい場合や条件まわりの不完全修正には効かない | 同上（PDF: https://patterninsight.com/fileadmin/PI/products/downloads/Pattern_Insight_How_Do_Fixes_Become_Bugs.pdf） | "fixers may forget to fix all the buggy regions with the same root cause. This types of incomplete fixes can be mitigated by using technique [30, 28] which searches for other places that have the same patterns or usage scenarios in entire code." "this technique is less effective when a consistent pattern is difficult to learn." | [一次・確認済み] |
| variant analysis の定義: 既知の脆弱性を種にして、似た問題をコード内で探す | CodeQL 公式文書 "About CodeQL". https://codeql.github.com/docs/codeql-overview/about-codeql/ | "Variant analysis is the process of using a known security vulnerability as a seed to find similar problems in your code." 加えて "find logical variants of the same bug that could be missed using traditional manual techniques." | [一次・確認済み] |
| 2022 年上半期の実攻撃 0-day 18 件のうち少なくとも 9 件は、以前修正された脆弱性の変種だった。根本原因でなく実証コードの経路だけを塞いだ修正があった | Google Project Zero, "2022 0-day In-the-Wild Exploitation…so far" (2022-06). https://projectzero.google/2022/06/2022-0-day-in-wild-exploitationso-far.html | "at least nine of the 0-days are variants of previously patched vulnerabilities." "could have been prevented with more comprehensive patching and regression tests." win32k などで "the root cause issue was not addressed: attackers were able to come back and trigger the original vulnerability through a different path." "Root cause analysis is generally a pre-requisite for successful variant and patch analysis." | [一次・確認済み] |
| 欠陥を入れた変更は、修正箇所の行を過去にたどって特定できる（SZZ） | Śliwerski, Zimmermann, Zeller, "When Do Changes Induce Fixes?", MSR 2005. http://2005.msrconf.org/papers/14.pdf | 手順: 修正に紐づく変更から影響行を得て、"We determine the earlier changes at these locations that were applied before the bug was reported. These earlier changes are the ones that caused the later fix." | [一次・確認済み]（検索ツールが返した PDF 本文で確認。手順の文は同著者の workshop 版 https://thomas-zimmermann.com/publications/files/sliwerski-wsr-2005.pdf のもの） |
| `git log -S<string>` は文字列の出現回数が変わったコミットを探す | git-log 公式文書. https://git-scm.com/docs/git-log | "Look for differences that change the number of occurrences of the specified <string> (i.e. addition/deletion) in a file." | [一次・確認済み] |
| `git log -G<regex>` は追加・削除行が正規表現に合うコミットを探す。出現回数が変わらない書き換えも拾う | 同上 | "Look for differences whose patch text contains added/removed lines that match <regex>." `-G"frotz\(nitfol"` は出すが `-S ... --pickaxe-regex` は出さない例つき "(because the number of occurrences of that string did not change)" | [一次・確認済み] |
| `git log -L` は行範囲または関数名の正規表現で、その部分の変遷をたどる | 同上 | "Trace the evolution of the line range given by <start>,<end>, or by the function name regex <funcname>, within the <file>." 開始リビジョンは 0 または 1 個に限られる | [一次・確認済み] |

### (A) で規則の文言として支えられること

- 「同じ式を grep したら終わり」では足りない。補足修正の大半は最初の修正と内容が似ていない（Park: 8〜17%、別箇所の記述では 9〜26%）。クローン・文字列一致だけでは修正漏れの場所を予測できない、と著者自身が書いている。
- 探す範囲の具体策として次が支えられる。(1) 修正箇所の近く（25 行以内に 42〜48%）、(2) 直接の構造依存（呼び出し元・呼び出し先・継承。29〜32%）、(3) 役割が似たクラス・関数（Nguyen の code peers）、(4) コピペ元・コピペ先（CP-Miner）。
- 文字列でなく「同じ根本原因」で探す。Yin は同じ根本原因の箇所の直し忘れを不完全修正の一因として挙げ、Project Zero は根本原因の分析を variant analysis の前提と書く。CodeQL の定義も「既知の欠陥を種にした類似問題の探索」で、字面の一致ではなく論理上の変種を対象にしている。
- 履歴で探す手順として、欠陥を入れたコミットの特定（SZZ の考え方、`git log -L` / blame）と、`git log -S` / `-G` による導入時期の特定は公式文書と文献で支えられる。`-S` は出現回数の増減しか見ないため、書き換えを拾うには `-G` を使う、という使い分けは公式文書の例そのもの。
- [推論] 社内実験の切り上げ式の例は、Park の「内容が似ていない補足修正」と Project Zero の「別経路から同じ根本原因に到達」に当たる。式の字面ではなく「何を計算しているか（切り上げ、10 分の 1 単位）」を言葉にし、その概念語・コメント語・呼び出し元で探す手順が筋に合う。

### (A) で支えられないこと

- 「欠陥を入れたコミットやその前後のコミットが触った他のファイルに、同種の欠陥がある確率」を示す数値は見つけていない。SZZ は欠陥を入れた変更の特定方法であり、その変更の他の箇所に同種欠陥があるとは言っていない。手順として入れるなら [推論] と明記する。
- 「意味で探せば見落としが何 % 減る」という効果量は確認していない。Park は既存の推薦手法（クローン・構造依存）を補う新手法が要ると結論しているだけで、特定手法の効果は示していない。
- Yin の 14.8〜24.4% を「不完全修正の割合」として引くのは誤り。誤った修正全体の割合である。
- Nguyen の 17〜45% は二次引用。規則文書で使うなら原論文の本文で確認してから使う。
- いずれも 2004〜2012 年の C / Java の OSS・商用 OS が対象で、AI エージェントの作業には直接当たらない。エージェントの見落とし率の根拠にはならない。

## (B) 作業前の base 確認と three-dot diff

| 主張 | 出典 | 引用・要約 | 印 |
|---|---|---|---|
| `git diff A..B` は 2 つの端点 A と B を直接比べる（`git diff A B` と同じ） | git-diff 公式文書. https://git-scm.com/docs/git-diff | "This is synonymous to the earlier form (without the ..) for viewing the changes between two arbitrary <commit>." | [一次・確認済み] |
| `git diff A...B` は共通祖先から B までの変更を見る。`git diff $(git merge-base A B) B` と同じ | 同上 | "This form is to view the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both <commit>. git diff A...B is equivalent to git diff $(git merge-base A B) B." | [一次・確認済み] |
| diff の `..` と `...` は範囲（rev-list の意味）ではない | 同上 | "diff is about comparing two endpoints, not ranges, and the range notations (<commit>..<commit> and <commit>...<commit>) do not mean a range as defined in the "SPECIFYING RANGES" section in gitrevisions." | [一次・確認済み] |
| `--merge-base` オプションでも同じことができる | 同上 | "git diff --merge-base A B is equivalent to git diff $(git merge-base A B) B." "git diff --merge-base A is equivalent to git diff $(git merge-base A HEAD)." | [一次・確認済み] |
| `git merge-base A B` は A と B の両方から親をたどって到達できるコミット（最良の共通祖先）を返す | git-merge-base 公式文書. https://git-scm.com/docs/git-merge-base | "git merge-base A B will output a commit which is reachable from both A and B through the parent relationship." 祖先関係の判定には `git merge-base --is-ancestor A B` | [一次・確認済み] |
| `git log` では `..` と `...` の意味が diff と違う。`A..B` は B から到達でき A から到達できないコミット、`A...B` は対称差 | git-log 公式文書. https://git-scm.com/docs/git-log | "origin..HEAD" は "all the commits reachable from the current commit (i.e. HEAD), but not from origin"。"`...`" は "the symmetric difference between the two operands" で `git log A B --not $(git merge-base --all A B)` と同じ | [一次・確認済み] |

### (B) で規則の文言として支えられること

- 「自分のブランチが加えた変更だけを見るときは `git diff <base>...HEAD`（または `git diff --merge-base <base>`）」は公式定義どおり。three-dot は merge-base 起点で、比べる相手は自ブランチの先端だけになる。
- [推論] two-dot（= 端点同士の比較）では、分岐後に base 側へ入った変更が「自分の変更を取り消したかのような差分」として混ざる。公式文書は端点比較であることだけを述べ、この帰結は書いていないが、定義から直接導ける。
- `git log` と `git diff` で `..` / `...` の意味が逆向きに見える点は公式文書が明記している。規則に「diff では three-dot、log では two-dot（`<base>..HEAD`）で自分のコミットだけを見る」と分けて書く根拠になる。
- 「作業前に base の位置を確認する」の具体手段として `git merge-base` と `--is-ancestor` は公式。

### (B) で支えられないこと

- 「two-dot を使ったことでレビューや判断を誤った頻度」を示す資料は見ていない。規則の必要性は社内事例で示すしかない。
- `merge-base` が複数ある場合（criss-cross merge）の `git diff A...B` の挙動は今回確認していない。`git log` 側は `--all` で全 merge base を使うことを確認したのみ。
- `--fork-point`（base が rebase し直された場合の分岐点推定）は公式文書に記述があることだけ確認し、規則に入れるべきかは評価していない。
