'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  type Employee,
  employeeFieldGroups,
} from '@/types/employee'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeFormProps {
  readonly employee: Employee
  readonly onSave: (data: Employee) => void
  readonly onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Chevron icon
// ---------------------------------------------------------------------------

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        flexShrink: 0,
      }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="#5A3825"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const inputBaseStyle: React.CSSProperties = {
  background: '#F5F0EB',
  border: '1.5px solid #E8D4CA',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 14,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-main)',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

const inputFocusRing =
  '0 0 0 2px rgba(212, 184, 168, 0.45)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmployeeForm({
  employee,
  onSave,
  onCancel,
}: EmployeeFormProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {}
      for (const group of employeeFieldGroups) {
        initial[group.label] = true
      }
      return initial
    },
  )

  const [showToast, setShowToast] = useState(false)

  const { register, handleSubmit, reset } = useForm<Employee>({
    defaultValues: { ...employee },
  })

  // Reset form when employee prop changes
  useEffect(() => {
    reset({ ...employee })
  }, [employee, reset])

  const toggleSection = useCallback((label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }, [])

  const onSubmit = useCallback(
    (data: Employee) => {
      onSave(data)
      setShowToast(true)
    },
    [onSave],
  )

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return
    const timer = setTimeout(() => setShowToast(false), 2000)
    return () => clearTimeout(timer)
  }, [showToast])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {employeeFieldGroups.map((group) => {
        const isOpen = openSections[group.label] ?? true

        return (
          <div
            key={group.label}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#FFF5F0' }}
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(group.label)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              style={{
                color: '#5A3825',
                fontFamily: 'var(--font-main)',
                fontWeight: 600,
                fontSize: 15,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>{group.label}</span>
              <ChevronIcon open={isOpen} />
            </button>

            {/* Section body */}
            {isOpen && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-5"
              >
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`employee-${field.key}`}
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: '#5A3825' }}
                    >
                      {field.label}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        id={`employee-${field.key}`}
                        className="appearance-none"
                        style={inputBaseStyle}
                        {...register(field.key)}
                      >
                        <option value="">選択してください</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`employee-${field.key}`}
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                              ? 'date'
                              : 'text'
                        }
                        style={inputBaseStyle}
                        {...register(field.key, {
                          valueAsNumber: field.type === 'number',
                        })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-8 text-sm font-medium transition-opacity"
            style={{
              background: 'transparent',
              border: '1px solid #D4B8A8',
              color: '#5A3825',
              borderRadius: 24,
              height: 48,
              fontFamily: 'var(--font-main)',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className="flex-1 sm:flex-none w-full sm:w-auto px-10 text-sm font-medium transition-opacity"
          style={{
            background: '#2D2D2D',
            color: '#FFFFFF',
            borderRadius: 24,
            height: 48,
            border: 'none',
            fontFamily: 'var(--font-main)',
            cursor: 'pointer',
          }}
        >
          保存
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 text-sm font-medium"
          style={{
            background: '#2D2D2D',
            color: '#FFFFFF',
            borderRadius: 24,
            fontFamily: 'var(--font-main)',
            boxShadow: '0 4px 20px rgba(90, 56, 37, 0.2)',
            animation: 'pdfModalFadeIn 0.25s ease-out both',
          }}
        >
          保存しました
        </div>
      )}
    </form>
  )
}
