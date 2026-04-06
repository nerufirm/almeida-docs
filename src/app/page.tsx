'use client'

import { useState, useCallback } from 'react'
import { DocumentGenerator } from '@/components/DocumentGenerator'
import EmployeeForm from '@/components/EmployeeForm'
import { mockEmployees } from '@/data/mockEmployees'
import type { Employee } from '@/types/employee'

// ---------------------------------------------------------------------------
// Employee selector (shared header control)
// ---------------------------------------------------------------------------

interface EmployeeSelectorProps {
  readonly employees: readonly Employee[]
  readonly employeeIndex: number
  readonly onChangeEmployee: (index: number) => void
}

function EmployeeSelector({
  employees,
  employeeIndex,
  onChangeEmployee,
}: EmployeeSelectorProps) {
  return (
    <div
      className="rounded-2xl px-5 py-5 mb-6"
      style={{ background: 'var(--bg-card-warm)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-xs font-medium"
          style={{ color: 'var(--text-on-warm-sub)' }}
        >
          対象スタッフ
        </p>
        <div className="flex gap-1.5">
          {employees.map((emp, i) => (
            <button
              key={emp.employeeNumber}
              type="button"
              onClick={() => onChangeEmployee(i)}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                borderRadius: 'var(--radius-tag)',
                background:
                  i === employeeIndex ? 'var(--accent-blush)' : 'transparent',
                color:
                  i === employeeIndex
                    ? 'var(--text-on-warm)'
                    : 'var(--text-on-warm-sub)',
                border:
                  i === employeeIndex
                    ? 'none'
                    : '1px solid var(--accent-blush)',
                cursor: 'pointer',
              }}
            >
              {emp.employeeName.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: 'var(--accent-coral)' }}
      >
        {employees[employeeIndex].employeeName}
      </p>
      <div className="flex flex-wrap gap-3 mt-2">
        <span
          className="text-sm"
          style={{ color: 'var(--text-on-warm)' }}
        >
          {employees[employeeIndex].department}
        </span>
        <span
          className="text-sm"
          style={{ color: 'var(--text-on-warm-sub)' }}
        >
          {employees[employeeIndex].position}
        </span>
        <span
          className="text-sm"
          style={{ color: 'var(--text-on-warm-sub)' }}
        >
          社員番号: {employees[employeeIndex].employeeNumber}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab component
// ---------------------------------------------------------------------------

type TabId = 'info' | 'docs'

interface TabBarProps {
  readonly activeTab: TabId
  readonly onChangeTab: (tab: TabId) => void
}

function TabBar({ activeTab, onChangeTab }: TabBarProps) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'スタッフ情報' },
    { id: 'docs', label: '書類作成' },
  ]

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className="text-sm font-medium transition-colors"
            style={{
              background: isActive ? '#2D2D2D' : 'transparent',
              color: isActive ? '#FFFFFF' : '#5A3825',
              border: isActive ? 'none' : '1px solid #E8D4CA',
              borderRadius: 24,
              height: 40,
              padding: '8px 24px',
              fontSize: 14,
              fontFamily: 'var(--font-main)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const [employeeIndex, setEmployeeIndex] = useState(0)
  const [employeesData, setEmployeesData] = useState<Employee[]>([
    ...mockEmployees,
  ])
  const [activeTab, setActiveTab] = useState<TabId>('info')

  const currentEmployee = employeesData[employeeIndex]

  const handleSaveEmployee = useCallback(
    (data: Employee) => {
      setEmployeesData((prev) =>
        prev.map((emp, i) => (i === employeeIndex ? { ...data } : emp)),
      )
    },
    [employeeIndex],
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <header
        className="w-full py-6 px-4 sm:px-8"
        style={{ background: 'var(--bg-card-warm)' }}
      >
        <div className="mx-auto max-w-3xl">
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{
              color: 'var(--text-on-warm)',
              fontFamily: 'var(--font-main)',
            }}
          >
            アルメイダ{' '}
            <span style={{ color: 'var(--accent-coral)' }}>書類作成</span>
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-on-warm-sub)' }}
          >
            スタッフ管理のための書類を簡単に作成できます
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-6 sm:py-10">
        <EmployeeSelector
          employees={employeesData}
          employeeIndex={employeeIndex}
          onChangeEmployee={setEmployeeIndex}
        />

        <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

        {activeTab === 'info' && (
          <EmployeeForm
            employee={currentEmployee}
            onSave={handleSaveEmployee}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentGenerator employee={currentEmployee} />
        )}
      </main>
    </div>
  )
}
