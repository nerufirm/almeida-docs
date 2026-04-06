// Mock employee data for development and testing

import type { Employee } from '../types/employee';

export const mockEmployees: Employee[] = [
  {
    // === 基本情報 ===
    employeeName: '山田 太郎',
    employeeNameKana: 'ヤマダ タロウ',
    birthDate: '1985-06-15',
    gender: 'male',
    myNumber: '1234-5678-9012',

    // === 連絡先 ===
    postalCode: '870-0021',
    address: '大分県大分市中央町1-2-3',
    phone: '097-555-1234',
    email: 'yamada.taro@example.co.jp',
    emergencyContact: '山田 美咲',
    emergencyPhone: '097-555-5678',

    // === 雇用情報 ===
    employeeNumber: 'EMP-001',
    department: '総務部',
    position: '主任',
    occupation: '事務職',
    hireDate: '2020-04-01',
    employmentType: 'fulltime',
    contractEndDate: '',
    workLocation: '本部事務所',

    // === 給与・保険 ===
    monthlySalary: 280000,
    dailyWage: 9333,
    bankName: '大分銀行',
    bankBranch: '中央支店',
    bankAccountNumber: '1234567',
    bankAccountHolder: 'ヤマダ タロウ',

    // === 社会保険番号 ===
    insuredNumber: '1234-567890-1',
    healthInsuranceNumber: '01-234567',
    pensionNumber: '1234-567890',
    officeNumber: '4401-123456-7',

    // === 扶養・家族 ===
    maritalStatus: 'married',
    spouseName: '山田 美咲',
    spouseBirthDate: '1987-09-20',
    dependentsCount: 2,

    // === 事業所情報 ===
    companyName: '社会福祉法人アルメイダ',
    companyAddress: '大分県大分市大手町3-1-1',
    companyPhone: '097-534-0001',
    companyRepresentative: '松本 義弘',
  },
  {
    // === 基本情報 ===
    employeeName: '佐藤 花子',
    employeeNameKana: 'サトウ ハナコ',
    birthDate: '1992-03-22',
    gender: 'female',
    myNumber: '9876-5432-1098',

    // === 連絡先 ===
    postalCode: '874-0920',
    address: '大分県別府市北浜1-5-8',
    phone: '0977-22-3456',
    email: 'sato.hanako@example.co.jp',
    emergencyContact: '佐藤 一郎',
    emergencyPhone: '0977-22-7890',

    // === 雇用情報 ===
    employeeNumber: 'EMP-045',
    department: '介護課',
    position: '介護福祉士',
    occupation: '介護職',
    hireDate: '2023-04-01',
    employmentType: 'fulltime',
    contractEndDate: '',
    workLocation: '別府介護センター',

    // === 給与・保険 ===
    monthlySalary: 245000,
    dailyWage: 8166,
    bankName: '豊和銀行',
    bankBranch: '別府支店',
    bankAccountNumber: '7654321',
    bankAccountHolder: 'サトウ ハナコ',

    // === 社会保険番号 ===
    insuredNumber: '2345-678901-2',
    healthInsuranceNumber: '02-345678',
    pensionNumber: '2345-678901',
    officeNumber: '4401-123456-7',

    // === 扶養・家族 ===
    maritalStatus: 'single',
    spouseName: '',
    spouseBirthDate: '',
    dependentsCount: 0,

    // === 事業所情報 ===
    companyName: '社会福祉法人アルメイダ',
    companyAddress: '大分県大分市大手町3-1-1',
    companyPhone: '097-534-0001',
    companyRepresentative: '松本 義弘',
  },
  {
    // === 基本情報 ===
    employeeName: '田中 健一',
    employeeNameKana: 'タナカ ケンイチ',
    birthDate: '1978-11-03',
    gender: 'male',
    myNumber: '5678-1234-5678',

    // === 連絡先 ===
    postalCode: '870-0035',
    address: '大分県大分市府内町2-8-15',
    phone: '097-533-7890',
    email: 'tanaka.kenichi@example.co.jp',
    emergencyContact: '田中 幸子',
    emergencyPhone: '097-533-4567',

    // === 雇用情報 ===
    employeeNumber: 'EMP-012',
    department: '看護部',
    position: '看護師長',
    occupation: '看護師',
    hireDate: '2019-10-01',
    employmentType: 'fulltime',
    contractEndDate: '',
    workLocation: '本部事務所',

    // === 給与・保険 ===
    monthlySalary: 350000,
    dailyWage: 11666,
    bankName: '大分銀行',
    bankBranch: '府内支店',
    bankAccountNumber: '3456789',
    bankAccountHolder: 'タナカ ケンイチ',

    // === 社会保険番号 ===
    insuredNumber: '3456-789012-3',
    healthInsuranceNumber: '03-456789',
    pensionNumber: '3456-789012',
    officeNumber: '4401-123456-7',

    // === 扶養・家族 ===
    maritalStatus: 'married',
    spouseName: '田中 幸子',
    spouseBirthDate: '1980-05-14',
    dependentsCount: 3,

    // === 事業所情報 ===
    companyName: '社会福祉法人アルメイダ',
    companyAddress: '大分県大分市大手町3-1-1',
    companyPhone: '097-534-0001',
    companyRepresentative: '松本 義弘',
  },
];
