'use client'

import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import {
  documentSchemas,
  documentCategories,
  type DocumentSchema,
} from '@/config/documentSchemas'
import { generatePdf, downloadPdf, type PdfSections, type LabeledField } from '@/utils/pdfGenerator'
import PdfPreviewModal from '@/components/PdfPreviewModal'
import type { Employee } from '@/types/employee'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPlaceholder(schema: DocumentSchema): boolean {
  return schema.fields.length === 0
}

function getAutoFilledFields(schema: DocumentSchema): typeof schema.fields {
  return schema.fields.filter((f) =>
    schema.autoFillFields.includes(f.id),
  )
}

function getManualFields(schema: DocumentSchema): typeof schema.fields {
  return schema.fields.filter(
    (f) => !schema.autoFillFields.includes(f.id),
  )
}

function getAutoFillData(
  schema: DocumentSchema,
  employee: Employee,
): Record<string, string | number | boolean> {
  const data: Record<string, string | number | boolean> = {}
  for (const fieldId of schema.autoFillFields) {
    const employeeKey = schema.fieldMapping?.[fieldId] ?? fieldId
    const value = employee[employeeKey as keyof Employee]
    if (value !== undefined && value !== null) {
      data[fieldId] = value as string | number | boolean
    }
  }
  return data
}

function getLabelForValue(
  options: { value: string; label: string }[] | undefined,
  value: string,
): string {
  if (!options) return value
  const match = options.find((o) => o.value === value)
  return match ? match.label : value
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

function StatsBar() {
  const total = documentSchemas.length
  const available = documentSchemas.filter((s) => !isPlaceholder(s)).length

  return (
    <div
      className="flex items-center gap-6 rounded-2xl px-5 py-4 mb-6"
      style={{ background: 'var(--bg-card-white)' }}
    >
      <div className="flex flex-col items-center">
        <span
          className="text-3xl font-bold"
          style={{ color: 'var(--accent-coral)' }}
        >
          {total}
        </span>
        <span
          className="text-xs mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          書類テンプレート
        </span>
      </div>
      <div
        className="w-px h-10 shrink-0"
        style={{ background: 'var(--accent-blush)' }}
      />
      <div className="flex flex-col items-center">
        <span
          className="text-3xl font-bold"
          style={{ color: 'var(--accent-navy)' }}
        >
          {available}
        </span>
        <span
          className="text-xs mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          作成可能
        </span>
      </div>
      <div
        className="w-px h-10 shrink-0"
        style={{ background: 'var(--accent-blush)' }}
      />
      <div className="flex flex-col items-center">
        <span
          className="text-3xl font-bold"
          style={{ color: 'var(--accent-mint)' }}
        >
          {total - available}
        </span>
        <span
          className="text-xs mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          準備中
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Document selector
// ---------------------------------------------------------------------------

interface DocumentSelectorProps {
  selectedId: string
  onSelect: (id: string) => void
}

function DocumentSelector({ selectedId, onSelect }: DocumentSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, DocumentSchema[]>()
    for (const cat of documentCategories) {
      map.set(
        cat,
        documentSchemas.filter((s) => s.category === cat),
      )
    }
    return map
  }, [])

  const selected = documentSchemas.find((s) => s.id === selectedId)

  return (
    <div className="mb-6">
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--text-on-warm)' }}
        htmlFor="doc-select"
      >
        書類を選択
      </label>
      <select
        id="doc-select"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm appearance-none outline-none transition-colors"
        style={{
          background: 'var(--bg-section)',
          border: '1.5px solid var(--accent-blush)',
          color: 'var(--text-primary)',
        }}
      >
        <option value="">-- 書類を選んでください --</option>
        {Array.from(grouped.entries()).map(([category, schemas]) => (
          <optgroup key={category} label={category}>
            {schemas.map((s) => (
              <option
                key={s.id}
                value={s.id}
                disabled={isPlaceholder(s)}
              >
                {s.name}
                {isPlaceholder(s) ? '（準備中）' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selected && (
        <div className="mt-3 flex items-start gap-2">
          {isPlaceholder(selected) && (
            <span
              className="shrink-0 inline-block text-xs font-medium px-3 py-1"
              style={{
                background: 'var(--accent-blush)',
                color: 'var(--text-on-warm)',
                borderRadius: 'var(--radius-tag)',
              }}
            >
              準備中
            </span>
          )}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-on-warm-sub)' }}
          >
            {selected.description}
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auto-filled fields display
// ---------------------------------------------------------------------------

interface AutoFilledSectionProps {
  schema: DocumentSchema
  employee: Employee
}

function AutoFilledSection({ schema, employee }: AutoFilledSectionProps) {
  const autoFields = getAutoFilledFields(schema)
  if (autoFields.length === 0) return null

  return (
    <div
      className="rounded-2xl px-5 py-4 mb-6"
      style={{ background: 'var(--bg-card-warm)' }}
    >
      <p
        className="text-xs font-medium mb-3"
        style={{ color: 'var(--text-on-warm-sub)' }}
      >
        自動入力される項目
      </p>
      <div className="flex flex-wrap gap-2">
        {autoFields.map((field) => {
          const employeeKey = schema.fieldMapping?.[field.id] ?? field.id
          const value = employee[employeeKey as keyof Employee] ?? ''
          return (
            <span
              key={field.id}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5"
              style={{
                background: 'var(--accent-blush)',
                color: 'var(--text-on-warm)',
                borderRadius: 'var(--radius-tag)',
              }}
            >
              <span className="font-medium">{field.label}:</span>
              <span>{String(value)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dynamic form
// ---------------------------------------------------------------------------

interface DynamicFormProps {
  schema: DocumentSchema
  onSubmit: (data: Record<string, string | number | boolean>) => void
  isGenerating: boolean
}

function DynamicForm({ schema, onSubmit, isGenerating }: DynamicFormProps) {
  const manualFields = useMemo(() => getManualFields(schema), [schema])

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onSubmit',
  })

  const handleFormSubmit = useCallback(
    (data: Record<string, string | number | boolean>) => {
      onSubmit(data)
    },
    [onSubmit],
  )

  if (manualFields.length === 0) {
    return (
      <p
        className="text-sm py-4"
        style={{ color: 'var(--text-secondary)' }}
      >
        この書類には追加入力項目がありません。自動入力のみで作成できます。
      </p>
    )
  }

  const inputBaseStyle = {
    background: 'var(--bg-section)',
    border: '1.5px solid var(--accent-blush)',
    color: 'var(--text-primary)',
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {manualFields.map((field) => {
        const fieldError = errors[field.id]

        return (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-on-warm)' }}
            >
              {field.label}
              {field.required && (
                <span
                  className="ml-1 text-xs"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  *
                </span>
              )}
            </label>

            {field.type === 'text' && (
              <input
                id={field.id}
                type="text"
                placeholder={field.placeholder ?? ''}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  ...inputBaseStyle,
                  '--tw-ring-color': 'var(--accent-mocha)',
                } as React.CSSProperties}
                {...register(field.id, {
                  required: field.required ? `${field.label}は必須です` : false,
                })}
              />
            )}

            {field.type === 'date' && (
              <input
                id={field.id}
                type="date"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  ...inputBaseStyle,
                  '--tw-ring-color': 'var(--accent-mocha)',
                } as React.CSSProperties}
                {...register(field.id, {
                  required: field.required ? `${field.label}は必須です` : false,
                })}
              />
            )}

            {field.type === 'number' && (
              <input
                id={field.id}
                type="number"
                placeholder={field.placeholder ?? ''}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  ...inputBaseStyle,
                  '--tw-ring-color': 'var(--accent-mocha)',
                } as React.CSSProperties}
                {...register(field.id, {
                  required: field.required ? `${field.label}は必須です` : false,
                  valueAsNumber: true,
                })}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.id}
                className="w-full rounded-xl px-4 py-3 text-sm appearance-none outline-none transition-colors focus:ring-2"
                style={{
                  ...inputBaseStyle,
                  '--tw-ring-color': 'var(--accent-mocha)',
                } as React.CSSProperties}
                {...register(field.id, {
                  required: field.required ? `${field.label}は必須です` : false,
                })}
              >
                <option value="">選択してください</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'textarea' && (
              <textarea
                id={field.id}
                rows={3}
                placeholder={field.placeholder ?? ''}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-y focus:ring-2"
                style={{
                  ...inputBaseStyle,
                  '--tw-ring-color': 'var(--accent-mocha)',
                } as React.CSSProperties}
                {...register(field.id, {
                  required: field.required ? `${field.label}は必須です` : false,
                })}
              />
            )}

            {field.type === 'checkbox' && (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  id={field.id}
                  type="checkbox"
                  className="w-5 h-5 rounded accent-current"
                  style={{ accentColor: 'var(--accent-navy)' }}
                  {...register(field.id)}
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  はい
                </span>
              </label>
            )}

            {fieldError && (
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--accent-coral)' }}
              >
                {fieldError.message as string}
              </p>
            )}
          </div>
        )
      })}

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full sm:w-auto px-10 py-3 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          background: 'var(--cta-primary-bg)',
          color: 'var(--cta-primary-text)',
          borderRadius: 'var(--radius-button)',
          height: '48px',
          border: 'none',
          fontFamily: 'var(--font-main)',
          cursor: 'pointer',
        }}
      >
        {isGenerating ? '作成中...' : 'プレビュー'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DocumentGeneratorProps {
  readonly employee: Employee
}

export function DocumentGenerator({ employee }: DocumentGeneratorProps) {
  const [selectedId, setSelectedId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewPdfBytes, setPreviewPdfBytes] = useState<Uint8Array | null>(null)

  const selectedSchema = useMemo(
    () => documentSchemas.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  )

  const handleGenerate = useCallback(
    async (formData: Record<string, string | number | boolean>) => {
      if (!selectedSchema) return

      setIsGenerating(true)
      try {
        const autoData = getAutoFillData(selectedSchema, employee)

        const resolvedFormData: Record<string, string | number | boolean> = {}
        for (const [key, value] of Object.entries(formData)) {
          const fieldDef = selectedSchema.fields.find((f) => f.id === key)
          if (fieldDef?.type === 'select' && typeof value === 'string') {
            resolvedFormData[key] = getLabelForValue(fieldDef.options, value)
          } else {
            resolvedFormData[key] = value
          }
        }

        const mergedData: Record<string, string | number | boolean> = {
          ...autoData,
          ...resolvedFormData,
        }

        // Build labeled sections for structured PDF
        const employeeInfo: LabeledField[] = [
          { label: '氏名', value: employee.employeeName },
          { label: 'フリガナ', value: employee.employeeNameKana },
          { label: '生年月日', value: employee.birthDate },
          { label: '性別', value: employee.gender === 'male' ? '男' : '女' },
          { label: '住所', value: `${employee.postalCode} ${employee.address}` },
          { label: '電話番号', value: employee.phone },
          { label: '社員番号', value: employee.employeeNumber },
          { label: '部署・役職', value: `${employee.department} ${employee.position}` },
          { label: '職種', value: employee.occupation },
          { label: '雇用形態', value: employee.employmentType === 'fulltime' ? '正社員' : employee.employmentType === 'parttime' ? 'パート' : '契約' },
          { label: '雇入年月日', value: employee.hireDate },
          { label: '賃金月額', value: `${employee.monthlySalary.toLocaleString()}円` },
          { label: '被保険者番号', value: employee.insuredNumber },
          { label: '事業所番号', value: employee.officeNumber },
          { label: '事業所名', value: employee.companyName },
          { label: '事業所住所', value: employee.companyAddress },
        ]

        const formFields: LabeledField[] = getManualFields(selectedSchema).map((field) => {
          const rawVal = resolvedFormData[field.id]
          let displayVal = rawVal !== undefined ? String(rawVal) : ''
          if (field.type === 'select' && typeof rawVal === 'string') {
            displayVal = getLabelForValue(field.options, rawVal) || displayVal
          }
          return { label: field.label, value: displayVal }
        })

        const sections: PdfSections = {
          employeeInfo,
          formData: formFields,
        }

        const pdfBytes = await generatePdf(null, mergedData, selectedSchema, sections)
        setPreviewPdfBytes(pdfBytes)
      } finally {
        setIsGenerating(false)
      }
    },
    [selectedSchema, employee],
  )

  const handleDownload = useCallback(() => {
    if (!previewPdfBytes || !selectedSchema) return
    const filename = `${selectedSchema.name}_${employee.employeeName}_${new Date().toISOString().slice(0, 10)}.pdf`
    downloadPdf(previewPdfBytes, filename)
  }, [previewPdfBytes, selectedSchema, employee])

  const handleClosePreview = useCallback(() => {
    setPreviewPdfBytes(null)
  }, [])

  const showForm =
    selectedSchema !== null && !isPlaceholder(selectedSchema)

  return (
    <div>
      <StatsBar />
      <DocumentSelector selectedId={selectedId} onSelect={setSelectedId} />

      {showForm && selectedSchema !== null && (
        <>
          <AutoFilledSection schema={selectedSchema} employee={employee} />

          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: 'var(--bg-card-white)' }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ color: 'var(--text-on-warm)' }}
            >
              {selectedSchema.name} &#8212; 入力フォーム
            </h2>
            <DynamicForm
              key={selectedSchema.id}
              schema={selectedSchema}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>
        </>
      )}

      {selectedSchema !== null && isPlaceholder(selectedSchema) && (
        <div
          className="rounded-2xl px-5 py-8 text-center"
          style={{ background: 'var(--bg-card-warm)' }}
        >
          <p
            className="text-base font-medium"
            style={{ color: 'var(--text-on-warm)' }}
          >
            この書類は現在準備中です
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-on-warm-sub)' }}
          >
            今後のアップデートで利用可能になります
          </p>
        </div>
      )}

      <PdfPreviewModal
        pdfBytes={previewPdfBytes}
        documentName={selectedSchema?.name ?? ''}
        employeeName={employee.employeeName}
        onClose={handleClosePreview}
        onDownload={handleDownload}
      />
    </div>
  )
}
