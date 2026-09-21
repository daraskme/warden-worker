# 個人用 Warden

公開先は `https://warden.darask.win`。Web画面・API・通知を同じホスト名のCloudflare Accessで保護します。`workers.dev`とプレビューURLは無効です。

サイト入口とWARP端末登録は `mail@darask.win` に届くメールOTPで認証します。保管庫にも `mail@darask.win` を使用し、登録時に設定したマスターパスワードで開きます。メールOTPはサイト入口の認証で、保管庫の復号にはマスターパスワードが必要です。

2026年9月21日: `mail@darask.win` の登録と保管庫へのログインを確認済みです。このWardenにはメールアドレス変更機能がないため、旧アカウントが空であることを確認し、新しいメールで登録しました。旧アカウントは削除していません。

## 機能

| 保存したいもの | 使用する機能 |
| --- | --- |
| ID・パスワード・認証コード | ログイン。URIと認証キー（TOTP）も登録する |
| パスワードの自動生成 | ツール → ジェネレーター、または編集画面の生成ボタン |
| メモ | セキュアメモ |
| APIキー | セキュアメモの非表示カスタムフィールド。説明はメモ欄へ |
| クレジットカード | カード |

Web画面は不要な組織向け機能、Send、レポートをメニューから隠し、生成・インポート・エクスポート・セキュリティ設定を残しています。機能を削除したり、暗号化を変更したりはしていません。ライトテーマの色、入力欄、コピー操作のタップ領域を調整しています。ダーク／高コントラストテーマは上流の配色を維持します。

## 利用端末の設定

1. `https://warden.darask.win` を開き、`mail@darask.win` に届くコードでAccess認証する。
2. 保管庫には `mail@darask.win` と登録時に設定したマスターパスワードでログインする。メールOTPだけでは保管庫を復号できない。
3. Bitwarden拡張機能やアプリを使う端末に[Cloudflare One Client](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/download/)をインストールする。
4. Cloudflare One ClientでZero Trust組織 `darask` にログインし、`mail@darask.win` のメールOTPで登録する。個人用の1.1.1.1モードだけでは不十分。以前のGoogleアカウントで登録済みの端末は、Zero Trustからログアウトして新しいメールアドレスで再登録する。
5. Bitwardenのログイン画面でセルフホスト環境を選び、サーバーURLを `https://warden.darask.win` にする。既存の端末は、未同期の変更がないことを確認してから接続先を切り替える。
6. WARPに接続してから保管庫の `mail@darask.win` とマスターパスワードでログインする。

Cloudflare One Clientのセッションが期限切れになったら再認証する。ブラウザーでメールOTP認証しただけでは、別プロセスの拡張機能／アプリにAccessセッションは渡らない。

## TOTPの自動生成・入力

各サービスの2段階認証設定にあるシークレットキーまたは `otpauth://` URIを、そのログイン項目の認証キー（TOTP）へ登録する。既存の認証アプリにしかキーがない場合は、サービス側で再設定が必要なことがある。

Bitwarden拡張機能で対応するログイン項目を自動入力すると、対応するフォームにTOTPを入力できる。2画面に分かれたログインでは、コード画面でも自動入力ショートカット（Windows: `Ctrl+Shift+L`）を使う。拡張機能の「TOTPを自動的にコピー」も利用できる。対象サイトの入力欄によって自動入力できない場合は貼り付ける。「ページ読み込み時の自動入力」ではTOTPの自動コピー／入力が働かない場合がある。

Web保管庫自体から、別のサイトの入力欄を自動操作することはできない。

## Cloudflare設定

- Access: ホスト名 `warden.darask.win`、パスは空欄（全体を保護）。WebSocketを使うためWorker単位ではなくホスト名で保護。
- IDプロバイダー: One-time PIN（メールOTP）のみ。
- Allowポリシー: `mail@darask.win` を完全一致で1件のみ指定。Bypassルールなし。
- WARPの端末登録: `mail@darask.win` のメールOTPのみ。
- Cloudflare One Clientセッション認証: 有効。アプリ側はWardenに対して有効。全アプリへの一括適用はオフ。セッション8時間。
- D1: 専用データベース `warden-vault` を `vault1` にバインド。
- Worker Secrets: `ALLOWED_EMAILS=mail@darask.win`、別々のランダム値の `JWT_SECRET` と `JWT_REFRESH_SECRET`。
- 添付ファイルのKV/R2は任意。今回の初期構成はD1のみ。

`DISABLE_USER_REGISTRATION`はクライアント向けの表示設定で、登録APIの許可判定は `ALLOWED_EMAILS` が行います。

既存保管庫のメールアドレスは鍵導出に使われるため、データベースの値だけを書き換えてはいけません。登録の許可先だけを新しいメールに変更し、D1とJWT Secretsは引き継ぎます。`ALLOWED_EMAILS` の変更は、既存アカウントを削除したりログインを無効化したりするものではありません。

## 更新

上流のビルド済みJSを直接編集せず、`public/css/vaultwarden.css` と `public/images/warden-wordmark.svg` を変更します。フロントエンドの展開後に `node scripts/apply-web-vault-overrides.mjs` を実行すると、テーマとレスポンシブviewportが適用されます。上流のHTMLフックが変更された場合は、黙って無視せずビルドが停止します。

専用ブランチでは `Build personal vault` ワークフローがRustの整形確認・WASMビルドを実行し、固定版 `v2026.6.4` のWeb Vaultを含む成果物を作成します。このワークフローはデプロイ用の秘密情報を必要としません。標準のデプロイワークフローを使う場合は、通常どおりD1 IDとCloudflare接続を設定してください。

## 参考

- [Cloudflare: Client sessions](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/client-sessions/)
- [Cloudflare: Workers and Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Bitwarden: Integrated Authenticator](https://bitwarden.com/help/integrated-authenticator/)
