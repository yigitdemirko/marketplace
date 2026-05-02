import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { feedsApi } from '@/api/feeds'
import { useAuthStore } from '@/store/authStore'
import type { ImportJob } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportXmlModal({ open, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ImportJob | null>(null)

  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => feedsApi.import(selectedFile, user!.userId),
    onSuccess: (job) => {
      setResult(job)
      onSuccess()
    },
  })

  if (!open) return null

  const handleClose = () => {
    if (importMutation.isPending) return
    setFile(null)
    setResult(null)
    importMutation.reset()
    onClose()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith('.xml') || dropped.type === 'text/xml' || dropped.type === 'application/xml')) {
      setFile(dropped)
    }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleSubmit = () => {
    if (file) importMutation.mutate(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-[10px] shadow-xl w-full max-w-[560px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-[#dce0e5] shrink-0">
          <h2 className="text-[16px] font-semibold text-[#14181f]">Ürünleri içe aktar (XML)</h2>
          <button
            onClick={handleClose}
            disabled={importMutation.isPending}
            className="h-8 w-8 flex items-center justify-center text-[#6f7c8e] hover:bg-[#f6f7f9] rounded-[6px] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {!result && (
            <>
              <p className="text-[13px] text-[#6f7c8e] mb-4">
                Google Merchant XML beslemesi yükleyin. Beslemedeki her <code className="bg-[#f6f7f9] px-1 rounded">&lt;item&gt;</code> kataloğunuza ürün olarak eklenir.
              </p>

              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-[8px] p-8 cursor-pointer transition-colors ${
                  isDragging ? 'border-[#3348ff] bg-[#eef0ff]' : 'border-[#dce0e5] hover:bg-[#f6f7f9]'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className="hidden"
                  onChange={handleSelect}
                />
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-[#3348ff]" />
                    <p className="text-[14px] font-medium text-[#14181f]">{file.name}</p>
                    <p className="text-[12px] text-[#6f7c8e]">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[#6f7c8e]" />
                    <p className="text-[14px] font-medium text-[#14181f]">XML dosyanızı buraya bırakın</p>
                    <p className="text-[12px] text-[#6f7c8e]">veya seçmek için tıklayın</p>
                  </>
                )}
              </label>

              {importMutation.isError && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-[#ffeaea] border border-[#fa3434]/20 rounded-[6px]">
                  <AlertCircle className="h-4 w-4 text-[#fa3434] shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[#fa3434]">{importMutation.error.message}</p>
                </div>
              )}
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {result.failureCount === 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-[#00a81c]" />
                ) : result.successCount === 0 ? (
                  <AlertCircle className="h-6 w-6 text-[#fa3434]" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-[#f59e0b]" />
                )}
                <h3 className="text-[15px] font-semibold text-[#14181f]">
                  {result.failureCount === 0
                    ? 'İçe aktarım başarılı'
                    : result.successCount === 0
                      ? 'İçe aktarım başarısız'
                      : 'İçe aktarım hatalarla tamamlandı'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-[6px] bg-[#f6f7f9]">
                  <p className="text-[11px] text-[#6f7c8e]">Toplam</p>
                  <p className="text-[20px] font-semibold text-[#14181f]">{result.totalItems}</p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#e6f7ee]">
                  <p className="text-[11px] text-[#00a81c]">Eklenen</p>
                  <p className="text-[20px] font-semibold text-[#00a81c]">{result.successCount}</p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#ffeaea]">
                  <p className="text-[11px] text-[#fa3434]">Başarısız</p>
                  <p className="text-[20px] font-semibold text-[#fa3434]">{result.failureCount}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <p className="text-[13px] font-semibold text-[#14181f] mb-2">Hatalar</p>
                  <div className="max-h-[180px] overflow-y-auto border border-[#dce0e5] rounded-[6px] divide-y divide-[#f6f7f9]">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-2.5 text-[12px]">
                        <p className="font-medium text-[#14181f]">
                          {err.productId ? `Ürün ${err.productId}` : `Satır ${err.index}`}
                        </p>
                        <p className="text-[#6f7c8e]">{err.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-14 border-t border-[#dce0e5] shrink-0">
          <button
            onClick={handleClose}
            disabled={importMutation.isPending}
            className="h-9 px-4 text-[14px] font-medium border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] text-[#14181f] disabled:opacity-50"
          >
            {result ? 'Tamam' : 'İptal'}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || importMutation.isPending}
              className="h-9 px-4 text-[14px] font-medium bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {importMutation.isPending ? 'İçe aktarılıyor…' : 'İçe aktar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
