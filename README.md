# ポイントシステムのプロトタイプ実装

[https://scrapbox.io/kawasima/ポイント](https://scrapbox.io/kawasima/%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88)


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## エンドポイント

### POST /api/initialize

ボディなし。データベースのMigrationを実行する。

### POST /api/wallets

ウォレットを新規に作成する。成功すれば、レスポンスで作られたウォレットのIDを返す。

### GET /api/wallet/{id}

ウォレットの残高やポイントの付与、利用履歴を参照する。

### PUT /api/wallet/{id}

ポイントを付与したり、使用したりする。

付与

```json
{
    "type": "aquisition",
    "point": 1000
}
```

使用

```json
{
    "type": "consumption",
    "point": 1000
}
```


