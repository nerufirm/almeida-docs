# Employee 型定義リファレンス

## Employee インターフェース

書類に登場しうる全フィールドを網羅した型定義。
業種に応じてフィールドを追加・変更する。

```typescript
export interface Employee {
  // === 基本情報 ===
  employeeName: string           // 氏名
  employeeNameKana: string       // 氏名（フリガナ）
  birthDate: string              // 生年月日 (YYYY-MM-DD)
  gender: string                 // 性別 ('male' | 'female')
  myNumber: string               // マイナンバー

  // === 連絡先 ===
  postalCode: string             // 郵便番号
  address: string                // 住所
  phone: string                  // 電話番号
  email: string                  // メールアドレス
  emergencyContact: string       // 緊急連絡先
  emergencyPhone: string         // 緊急連絡先電話番号

  // === 雇用情報 ===
  employeeNumber: string         // 社員番号
  department: string             // 部署
  position: string               // 役職
  occupation: string             // 職種
  hireDate: string               // 雇入年月日
  employmentType: string         // 雇用形態
  contractEndDate: string        // 契約終了日
  workLocation: string           // 勤務地

  // === 給与・保険 ===
  monthlySalary: number          // 賃金月額
  dailyWage: number              // 日額
  bankName: string               // 振込銀行名
  bankBranch: string             // 支店名
  bankAccountNumber: string      // 口座番号
  bankAccountHolder: string      // 口座名義

  // === 社会保険番号 ===
  insuredNumber: string          // 雇用保険被保険者番号
  healthInsuranceNumber: string  // 健康保険番号
  pensionNumber: string          // 基礎年金番号
  officeNumber: string           // 事業所番号

  // === 扶養・家族 ===
  maritalStatus: string          // 配偶者有無
  spouseName: string             // 配偶者氏名
  spouseBirthDate: string        // 配偶者生年月日
  dependentsCount: number        // 扶養人数

  // === 事業所情報 ===
  companyName: string            // 事業所名
  companyAddress: string         // 事業所住所
  companyPhone: string           // 事業所電話番号
  companyRepresentative: string  // 代表者名
}
```

## フィールドグループ定義

UIのセクション分けに使用する。

```typescript
export interface EmployeeFieldGroup {
  label: string
  fields: {
    key: keyof Employee
    label: string
    type: 'text' | 'date' | 'number' | 'select'
    options?: { value: string; label: string }[]
  }[]
}

export const employeeFieldGroups: EmployeeFieldGroup[] = [
  {
    label: '基本情報',
    fields: [
      { key: 'employeeName', label: '氏名', type: 'text' },
      { key: 'employeeNameKana', label: '氏名（フリガナ）', type: 'text' },
      { key: 'birthDate', label: '生年月日', type: 'date' },
      { key: 'gender', label: '性別', type: 'select', options: [
        { value: 'male', label: '男' },
        { value: 'female', label: '女' },
      ]},
      { key: 'myNumber', label: 'マイナンバー', type: 'text' },
    ],
  },
  // ... 他のグループも同様
]
```

## DocumentSchema 型定義

```typescript
export type FieldType = 'text' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox'

export type FormField = {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
}

export type PdfMapping = {
  fieldId: string
  x: number        // PDF上のX座標（ポイント）
  y: number        // PDF上のY座標（ポイント、下から）
  fontSize?: number
  maxWidth?: number // テキスト折り返しの最大幅
}

export type DocumentSchema = {
  id: string
  name: string
  category: string
  description: string
  fields: FormField[]
  pdfMappings: PdfMapping[]
  autoFillFields: string[]
  fieldMapping?: Record<string, keyof Employee>
}
```

## A4 PDF座標の目安

A4サイズ: 595.28 x 841.89 ポイント（幅 x 高さ）

- 原点は左下
- y=841 が上端、y=0 が下端
- 一般的なマージン: 40-50pt
- フィールド間の縦間隔: 30-35pt
- タイトル位置: y=790 付近
- 本文開始: y=750 付近
