# invoice

- 単体テスト: `python3 -m unittest discover -s tests -t .`
- 契約テスト（ほかのサービスが前提にしている振る舞い）: `python3 -m unittest discover -s contract_tests -t .`。変更の前後で必ず両方を走らせる
