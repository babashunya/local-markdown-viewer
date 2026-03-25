# Local Markdown Viewer

ローカルの Markdown ファイルを Chrome でリッチにプレビューする拡張機能。

`open` コマンドなどで `.md` ファイルを Chrome に開くと、GitHub 風のスタイルで自動レンダリングされる。

## 機能

- **GitHub 風レンダリング** — 見出し、リスト、テーブル、リンク、画像などを整形表示
- **シンタックスハイライト** — コードブロックの言語指定に対応（highlight.js）
- **目次サイドバー** — 左側に見出しの目次を固定表示。クリックでジャンプ、スクロール追従ハイライト付き
- **自動リロード** — ファイル変更を 1 秒間隔で検知し、スクロール位置を保持したまま自動更新
- **タイトル設定** — 最初の `#` 見出し、またはファイル名をタブタイトルに反映

## 対応ファイル

`.md` / `.markdown` / `.mkd`

## インストール

1. このリポジトリをクローン

```bash
git clone git@github.com:babashunya/local-markdown-viewer.git
```

2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を ON にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンしたディレクトリを選択
6. インストールされた拡張の「詳細」を開き、**「ファイルの URL へのアクセスを許可する」を ON にする**

## 使い方

```bash
open -a "Google Chrome" /path/to/file.md
```

または Chrome のアドレスバーに `file:///path/to/file.md` を直接入力。

## 技術構成

| ライブラリ | 用途 |
|---|---|
| [marked.js](https://github.com/markedjs/marked) | Markdown パース（GFM 対応） |
| [highlight.js](https://github.com/highlightjs/highlight.js) | コードブロックのシンタックスハイライト |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | GitHub 風スタイル |

- Chrome Manifest V3
- ビルドステップなし（ライブラリは vendor に同梱）
- 自動リロードは XMLHttpRequest によるポーリング方式
