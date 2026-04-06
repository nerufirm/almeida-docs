'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PdfPreviewModalProps {
  readonly pdfBytes: Uint8Array | null
  readonly documentName: string
  readonly employeeName: string
  readonly onClose: () => void
  readonly onDownload: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FONT_FAMILY =
  '"Hiragino Sans", "SF Pro Text", -apple-system, "Noto Sans JP", sans-serif'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(90, 56, 37, 0.5)',
  fontFamily: FONT_FAMILY,
}

const modalStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 900,
  maxHeight: '90vh',
  background: '#FFFFFF',
  borderRadius: 16,
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 24px',
  borderBottom: '1px solid #E8D4CA',
}

const documentNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  color: '#5A3825',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const employeeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 14px',
  background: '#E8D4CA',
  color: '#5A3825',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const closeButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: '#F5F0EB',
  color: '#5A3825',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  flexShrink: 0,
}

const viewerContainerStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 500,
  background: '#F5F0EB',
  position: 'relative',
  overflow: 'hidden',
}

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  position: 'absolute',
  inset: 0,
}

const loadingStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8B7265',
  fontSize: 14,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 24px',
  borderTop: '1px solid #E8D4CA',
}

const fileSizeStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#8B7265',
}

const footerButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  padding: '0 24px',
  background: 'transparent',
  border: '1px solid #D4B8A8',
  borderRadius: 24,
  color: '#333333',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: FONT_FAMILY,
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  padding: '0 28px',
  background: '#2D2D2D',
  border: 'none',
  borderRadius: 24,
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONT_FAMILY,
  gap: 6,
}

// ---------------------------------------------------------------------------
// Animation keyframes (injected once)
// ---------------------------------------------------------------------------

const ANIMATION_ID = 'pdf-preview-modal-keyframes'

function ensureKeyframes(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(ANIMATION_ID)) return

  const style = document.createElement('style')
  style.id = ANIMATION_ID
  style.textContent = `
    @keyframes pdfModalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes pdfModalSlideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `
  document.head.appendChild(style)
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 4L4 12M4 4l8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 2v8.5M8 10.5L5 7.5M8 10.5l3-3M3 13h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 10H3a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1h-1.5M4.5 5V2.5h7V5M4.5 8.5h7v5h-7v-5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PdfPreviewModal({
  pdfBytes,
  documentName,
  employeeName,
  onClose,
  onDownload,
}: PdfPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fileSize = useMemo(
    () => (pdfBytes ? formatFileSize(pdfBytes.byteLength) : ''),
    [pdfBytes],
  )

  // ---- Blob URL lifecycle ----
  useEffect(() => {
    if (!pdfBytes) return

    const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength)
    new Uint8Array(arrayBuffer).set(pdfBytes)
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)
    setIsLoading(true)

    return () => {
      URL.revokeObjectURL(url)
      setBlobUrl(null)
    }
  }, [pdfBytes])

  // ---- Escape key ----
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // ---- Inject animation keyframes ----
  useEffect(() => {
    ensureKeyframes()
  }, [])

  // ---- Handlers ----
  const handleOverlayClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.print()
    }
  }, [])

  // ---- Null guard ----
  if (!pdfBytes) return null

  return (
    <div
      style={{
        ...overlayStyle,
        animation: 'pdfModalFadeIn 0.25s ease-out both',
      }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${documentName} プレビュー`}
    >
      <div
        style={{
          ...modalStyle,
          animation: 'pdfModalSlideUp 0.3s ease-out both',
        }}
        onClick={handleModalClick}
      >
        {/* ---- Header ---- */}
        <div style={headerStyle}>
          <span style={documentNameStyle}>{documentName}</span>
          <span style={employeeBadgeStyle}>{employeeName}</span>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="閉じる"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ---- PDF Viewer ---- */}
        <div style={viewerContainerStyle}>
          {isLoading && (
            <div style={loadingStyle}>
              <span>プレビューを読み込み中...</span>
            </div>
          )}
          {blobUrl && (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              style={iframeStyle}
              title={`${documentName} プレビュー`}
              onLoad={handleIframeLoad}
            />
          )}
        </div>

        {/* ---- Footer ---- */}
        <div style={footerStyle}>
          <span style={fileSizeStyle}>{fileSize}</span>
          <div style={footerButtonsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={onClose}
            >
              閉じる
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handlePrint}
            >
              <PrintIcon />
              <span style={{ marginLeft: 4 }}>印刷</span>
            </button>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={onDownload}
            >
              <DownloadIcon />
              ダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
