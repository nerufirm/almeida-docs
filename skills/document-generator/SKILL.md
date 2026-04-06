---
name: document-generator
description: |
  Schema-Driven な動的フォーム＋PDF自動生成システムを構築するスキル。職員・従業員・顧客の基本情報から申請書・届出書・証明書などの定型書類を自動生成する仕組みを作る。
  Next.js + React + Tailwind CSS + react-hook-form + pdf-lib の構成。
  以下のキーワードで必ず使用すること：「申請書を作って」「書類生成」「フォームからPDF」「動的フォーム」「スキーマ駆動」「PDF自動生成」「届出書」「証明書作成」「帳票生成」「定型書類」「テンプレートPDF」「書類作成モジュール」「Auto-fill」「書類の自動入力」。
  30種類以上の書類でも個別画面を作らず、1つの動的フォームで対応する設計パターンに特化している。
---

# 書類自動生成スキル（Schema-Driven Document Generator）

## 設計思想

このスキルは「N種類の書類に対してN個の画面を作らない」という原則に基づく。
代わりに、3つのレイヤーで書類生成を抽象化する：

1. **Schema Layer** — 書類ごとに必要なフィールドとPDF座標を定義するJSON/TSスキーマ
2. **Auto-fill Layer** — 人物の基本情報（氏名・住所・生年月日等）をDBから自動入力し、書類固有の差分のみフォーム表示
3. **PDF Overlay Layer** — pdf-lib でひな形PDFにテキストを印字、または構造化PDFを新規生成

この3層構造により、新しい書類を追加する際はスキーマを1つ追加するだけで済む。

## アーキテクチャ

```
src/
├── types/employee.ts          # 人物データの型定義 + フィールドグループ
├── data/mockEmployees.ts      # ダミーデータ（本番ではDB/API）
├── config/documentSchemas.ts  # 書類スキーマ定義（フィールド + PDF座標 + 自動入力設定）
├── utils/pdfGenerator.ts      # PDF生成ロジック（pdf-lib + fontkit）
├── components/
│   ├── EmployeeForm.tsx       # 基本情報入力フォーム（全フィールド編集可能）
│   ├── DocumentGenerator.tsx  # 書類選択 + 差分入力 + プレビュー呼び出し
│   └── PdfPreviewModal.tsx    # PDFプレビューモーダル（印刷・ダウンロード）
└── app/
    ├── page.tsx               # タブUI（基本情報 / 書類作成）
    └── globals.css            # CSS変数
```

## 実装手順

### Step 1: パッケージインストール

```bash
pnpm install pdf-lib @pdf-lib/fontkit react-hook-form
```

日本語PDF生成には日本語フォントファイル（OTF/TTF）が必要。Noto Sans CJK JP を `public/` に配置する。

```bash
# Node.jsスクリプトでダウンロード
node -e "
const https = require('https');
const fs = require('fs');
function dl(u) {
  https.get(u, function(r) {
    if (r.statusCode >= 300 && r.headers.location) { dl(r.headers.location); return; }
    r.pipe(fs.createWriteStream('public/NotoSansJP-Regular.otf'));
  });
}
dl('https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf');
"
```

### Step 2: 人物データ型定義

`types/employee.ts` に包括的な人物インターフェースを定義する。書類に登場しうる全フィールドを網羅する。
フィールドはグループ化して管理し、フォームUIでセクション別に表示する。

グループの例：
- 基本情報（氏名、フリガナ、生年月日、性別）
- 連絡先（郵便番号、住所、電話、メール、緊急連絡先）
- 雇用情報（社員番号、部署、役職、職種、雇用形態、雇入日）
- 給与・保険（賃金月額、口座情報）
- 社会保険番号（雇用保険番号、健康保険番号、年金番号、事業所番号）
- 扶養・家族（配偶者、扶養人数）
- 事業所情報（事業所名、住所、代表者）

実装の参考: `references/employee-type.md`

### Step 3: 書類スキーマ定義

`config/documentSchemas.ts` に書類の型定義とスキーマ配列を作成する。

```typescript
export type DocumentSchema = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: FormField[];        // 書類が必要とする全フィールド
  pdfMappings: PdfMapping[];  // PDF上の印字座標
  autoFillFields: string[];   // 人物データから自動入力するフィールドID
  fieldMapping?: Record<string, keyof Employee>;  // フィールドID → 人物データキーの変換
};
```

**重要な設計判断:**
- `autoFillFields` に含まれるフィールドはフォームに表示しない（自動入力タグとして表示）
- `fieldMapping` は書類のフィールド名と人物データのキーが異なる場合に使う（例: `preLeaveSalary` → `monthlySalary`）
- 未実装の書類は `fields: []` のプレースホルダーとして定義し、UIで「準備中」と表示する
- カテゴリでグルーピングし、ドロップダウンの `<optgroup>` で整理する

### Step 4: PDF生成ロジック

`utils/pdfGenerator.ts` に以下の関数を実装する。

#### フォント読み込み
```typescript
import fontkit from '@pdf-lib/fontkit';

async function loadFonts(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const fontResponse = await fetch('/NotoSansJP-Regular.otf');
  const fontBytes = await fontResponse.arrayBuffer();
  return await pdfDoc.embedFont(fontBytes);
}
```

pdf-lib の StandardFonts（Helvetica等）は日本語をエンコードできない（`WinAnsi cannot encode` エラーになる）。
必ず fontkit を登録し、CJK対応フォントを埋め込むこと。

#### 構造化PDF生成

PDF出力は2つのモードを持つ：

**座標ベース（テンプレートPDFへの上書き）:**
- ひな形PDFを読み込み、指定座標にテキストを印字
- `PdfMapping` の x, y, fontSize, maxWidth を使用

**構造化レイアウト（白紙から生成）:**
- セクション分け（申請者基本情報 / 申請内容）
- ラベル + 値のペアを2カラムで配置
- 背景色でセクション見出しを強調
- ページ送り対応（内容が1ページに収まらない場合）

```typescript
export interface PdfSections {
  employeeInfo: LabeledField[];  // 基本情報（氏名、住所等）
  formData: LabeledField[];      // 申請固有項目（離職日等）
}
```

#### ダウンロードヘルパー
```typescript
export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  // ... anchor要素でダウンロード
}
```

TypeScript の型互換性の注意: `new Blob([pdfBytes])` は Node 22+ で型エラーになる場合がある。
`pdfBytes.slice().buffer as ArrayBuffer` でワークアラウンドする。

### Step 5: 動的フォームUI

`components/DocumentGenerator.tsx` の主要ロジック：

1. **書類選択** — ドロップダウンでスキーマを選択
2. **自動入力表示** — `autoFillFields` に含まれるフィールドをタグで表示（編集不可）
3. **差分フォーム** — `autoFillFields` に含まれないフィールドのみ react-hook-form で描画
4. **プレビュー** — `generatePdf()` を呼び出し、結果を `PdfPreviewModal` に渡す

フィールドの動的レンダリング:
```typescript
const manualFields = schema.fields.filter(f => !schema.autoFillFields.includes(f.id));
```

フィールドタイプ別にレンダリング:
- `text` → `<input type="text">`
- `date` → `<input type="date">`（カレンダーピッカー）
- `number` → `<input type="number">`
- `select` → `<select>` with options
- `textarea` → `<textarea>`
- `checkbox` → `<input type="checkbox">`

### Step 6: PDFプレビューモーダル

`components/PdfPreviewModal.tsx`:
- Blob URL を生成し `<iframe>` で表示
- 閉じる / 印刷 / ダウンロード ボタン
- Escape キーで閉じる
- オーバーレイクリックで閉じる（モーダル内は stopPropagation）
- ファイルサイズ表示
- アニメーション（fade + slide-up）

### Step 7: 基本情報フォーム

`components/EmployeeForm.tsx`:
- 全フィールドをグループ別の折りたたみカードで表示
- react-hook-form で管理
- 保存時にトースト表示

### Step 8: ページ統合

`app/page.tsx` でタブUIを構成:
- タブ1「スタッフ情報」→ EmployeeForm
- タブ2「書類作成」→ DocumentGenerator
- 人物切替ボタンをヘッダーに配置（共有）
- 人物データの状態を useState で管理し、両タブに渡す

## 書類を追加するには

新しい書類を追加するには `documentSchemas.ts` にスキーマを1つ追加するだけ:

```typescript
{
  id: 'new-document',
  name: '新しい申請書',
  category: 'カテゴリ名',
  description: 'この書類の説明',
  fields: [
    { id: 'fieldA', label: '項目A', type: 'text', required: true },
    { id: 'fieldB', label: '項目B', type: 'date', required: true },
  ],
  pdfMappings: [
    { fieldId: 'fieldA', x: 200, y: 400, fontSize: 10 },
    { fieldId: 'fieldB', x: 200, y: 370, fontSize: 10 },
  ],
  autoFillFields: ['employeeName', 'birthDate', 'address'],
}
```

画面の追加やコンポーネントの修正は不要。

## デプロイ

### Cloudflare Pages
```bash
# next.config.ts に output: "export" を設定
npx next build
npx wrangler pages deploy out --project-name <project-name> --commit-dirty=true
```

### Vercel
```bash
npx vercel
```

## よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `WinAnsi cannot encode "雇"` | pdf-lib の標準フォントが日本語非対応 | fontkit を登録し、CJK フォント（NotoSansCJKjp-Regular.otf）を埋め込む |
| `Uint8Array is not assignable to BlobPart` | Node 22+ の型互換性 | `pdfBytes.slice().buffer as ArrayBuffer` を使用 |
| Turbopack panic (spawning node) | dev server の PATH に node がない | `next dev --webpack` で起動するか、PATH を設定 |
| プレビューボタンが反応しない | react-hook-form のバリデーションエラー | `mode: 'onSubmit'` に設定し、エラー表示を確認 |
