// Employee data model for document generation module

export interface Employee {
  // === 基本情報 ===
  employeeName: string;           // 氏名
  employeeNameKana: string;       // 氏名（フリガナ）
  birthDate: string;              // 生年月日
  gender: string;                 // 性別 ('male' | 'female')
  myNumber: string;               // マイナンバー（表示は下4桁のみ）

  // === 連絡先 ===
  postalCode: string;             // 郵便番号
  address: string;                // 住所
  phone: string;                  // 電話番号
  email: string;                  // メールアドレス
  emergencyContact: string;       // 緊急連絡先
  emergencyPhone: string;         // 緊急連絡先電話番号

  // === 雇用情報 ===
  employeeNumber: string;         // 社員番号
  department: string;             // 部署
  position: string;               // 役職
  occupation: string;             // 職種
  hireDate: string;               // 雇入年月日
  employmentType: string;         // 雇用形態 ('fulltime' | 'parttime' | 'contract')
  contractEndDate: string;        // 契約終了日
  workLocation: string;           // 勤務地

  // === 給与・保険 ===
  monthlySalary: number;          // 賃金月額
  dailyWage: number;              // 日額
  bankName: string;               // 振込銀行名
  bankBranch: string;             // 支店名
  bankAccountNumber: string;      // 口座番号
  bankAccountHolder: string;      // 口座名義

  // === 社会保険番号 ===
  insuredNumber: string;          // 雇用保険被保険者番号
  healthInsuranceNumber: string;  // 健康保険番号
  pensionNumber: string;          // 基礎年金番号
  officeNumber: string;           // 事業所番号

  // === 扶養・家族 ===
  maritalStatus: string;          // 配偶者有無 ('married' | 'single')
  spouseName: string;             // 配偶者氏名
  spouseBirthDate: string;        // 配偶者生年月日
  dependentsCount: number;        // 扶養人数

  // === 事業所情報 ===
  companyName: string;            // 事業所名
  companyAddress: string;         // 事業所住所
  companyPhone: string;           // 事業所電話番号
  companyRepresentative: string;  // 代表者名
}

export interface EmployeeFieldGroup {
  label: string;
  fields: {
    key: keyof Employee;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    options?: { value: string; label: string }[];
  }[];
}

export const employeeFieldGroups: EmployeeFieldGroup[] = [
  {
    label: '基本情報',
    fields: [
      { key: 'employeeName', label: '氏名', type: 'text' },
      { key: 'employeeNameKana', label: '氏名（フリガナ）', type: 'text' },
      { key: 'birthDate', label: '生年月日', type: 'date' },
      {
        key: 'gender',
        label: '性別',
        type: 'select',
        options: [
          { value: 'male', label: '男' },
          { value: 'female', label: '女' },
        ],
      },
      { key: 'myNumber', label: 'マイナンバー', type: 'text' },
    ],
  },
  {
    label: '連絡先',
    fields: [
      { key: 'postalCode', label: '郵便番号', type: 'text' },
      { key: 'address', label: '住所', type: 'text' },
      { key: 'phone', label: '電話番号', type: 'text' },
      { key: 'email', label: 'メールアドレス', type: 'text' },
      { key: 'emergencyContact', label: '緊急連絡先', type: 'text' },
      { key: 'emergencyPhone', label: '緊急連絡先電話番号', type: 'text' },
    ],
  },
  {
    label: '雇用情報',
    fields: [
      { key: 'employeeNumber', label: '社員番号', type: 'text' },
      { key: 'department', label: '部署', type: 'text' },
      { key: 'position', label: '役職', type: 'text' },
      { key: 'occupation', label: '職種', type: 'text' },
      { key: 'hireDate', label: '雇入年月日', type: 'date' },
      {
        key: 'employmentType',
        label: '雇用形態',
        type: 'select',
        options: [
          { value: 'fulltime', label: '正社員' },
          { value: 'parttime', label: 'パート' },
          { value: 'contract', label: '契約' },
        ],
      },
      { key: 'contractEndDate', label: '契約終了日', type: 'date' },
      { key: 'workLocation', label: '勤務地', type: 'text' },
    ],
  },
  {
    label: '給与・保険',
    fields: [
      { key: 'monthlySalary', label: '賃金月額', type: 'number' },
      { key: 'dailyWage', label: '日額', type: 'number' },
      { key: 'bankName', label: '振込銀行名', type: 'text' },
      { key: 'bankBranch', label: '支店名', type: 'text' },
      { key: 'bankAccountNumber', label: '口座番号', type: 'text' },
      { key: 'bankAccountHolder', label: '口座名義', type: 'text' },
    ],
  },
  {
    label: '社会保険番号',
    fields: [
      { key: 'insuredNumber', label: '雇用保険被保険者番号', type: 'text' },
      { key: 'healthInsuranceNumber', label: '健康保険番号', type: 'text' },
      { key: 'pensionNumber', label: '基礎年金番号', type: 'text' },
      { key: 'officeNumber', label: '事業所番号', type: 'text' },
    ],
  },
  {
    label: '扶養・家族',
    fields: [
      {
        key: 'maritalStatus',
        label: '配偶者有無',
        type: 'select',
        options: [
          { value: 'married', label: '既婚' },
          { value: 'single', label: '未婚' },
        ],
      },
      { key: 'spouseName', label: '配偶者氏名', type: 'text' },
      { key: 'spouseBirthDate', label: '配偶者生年月日', type: 'date' },
      { key: 'dependentsCount', label: '扶養人数', type: 'number' },
    ],
  },
  {
    label: '事業所情報',
    fields: [
      { key: 'companyName', label: '事業所名', type: 'text' },
      { key: 'companyAddress', label: '事業所住所', type: 'text' },
      { key: 'companyPhone', label: '事業所電話番号', type: 'text' },
      { key: 'companyRepresentative', label: '代表者名', type: 'text' },
    ],
  },
];
