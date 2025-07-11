This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🛠 開発者向けメモ（Cursor用）

### 🔧 ShiftEditModal の型エラー修正用プロンプト

```
以下のエラーが発生しています。src/app/admin/shifts/page.tsx の ShiftEditModal に渡している `onUpdate` プロパティが、ShiftEditModal コンポーネント側の props 型定義に存在しないため、Vercel デプロイ時に TypeScript エラーになります。

エラー内容：
Property 'onUpdate' does not exist on type 'ShiftEditModalProps'

対応内容：
components/ShiftEditModal.tsx にある `ShiftEditModalProps` 型に `onUpdate` を追加してください。型は以下のようにしてください：

onUpdate: (updatedData: Partial<Shift>) => Promise<void>;

その上で、ShiftEditModal 内で `props.onUpdate(...)` を使っている箇所があれば、そのまま使えるように修正してください。

その後、デプロイが通るか確認するために `npm run build` でローカルビルドが成功する状態にしてください。
```
