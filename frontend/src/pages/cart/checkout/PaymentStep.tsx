import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/formatPrice'
import { FormField } from './FormField'
import { SavedCardSelector } from './SavedCardSelector'

export interface CardForm {
  cardHolderName: string
  cardNumber: string
  expireMonth: string
  expireYear: string
  cvc: string
}

interface PaymentStepProps {
  cardForm: CardForm
  setCardForm: React.Dispatch<React.SetStateAction<CardForm>>
  hasCards: boolean
  showNewCard: boolean
  setShowNewCard: (b: boolean) => void
  selectedSavedCardId: string
  setSelectedSavedCardId: (id: string) => void
  saveCard: boolean
  setSaveCard: (b: boolean) => void
  cardAlias: string
  setCardAlias: (s: string) => void
  loading: boolean
  total: number
  error: string
  onBack: () => void
  onSubmit: (e: React.SyntheticEvent) => void
}

export function PaymentStep(props: PaymentStepProps) {
  const {
    cardForm, setCardForm, hasCards, showNewCard, setShowNewCard,
    selectedSavedCardId, setSelectedSavedCardId, saveCard, setSaveCard,
    cardAlias, setCardAlias, loading, total, error, onBack, onSubmit,
  } = props

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <h4 className="text-xl font-semibold text-[#14181f]">Ödeme bilgileri</h4>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">Test kartı</p>
        <p className="font-mono">5528790000000008 &nbsp; 12 / 2030 &nbsp; CVC: 123</p>
      </div>

      {hasCards && !showNewCard && (
        <>
          <SavedCardSelector selected={selectedSavedCardId} onSelect={setSelectedSavedCardId} />
          <button type="button" onClick={() => setShowNewCard(true)}
            className="flex items-center gap-1.5 text-[13px] text-[#3348ff] hover:underline -mt-2">
            <Plus className="h-3.5 w-3.5" /> Farklı kart gir
          </button>
        </>
      )}

      {(!hasCards || showNewCard) && (
        <>
          {showNewCard && (
            <button type="button" onClick={() => setShowNewCard(false)}
              className="text-[13px] text-[#6f7c8e] hover:text-[#3348ff] flex items-center gap-1 -mt-2">
              ← Kayıtlı kartlarıma dön
            </button>
          )}

          <FormField label="Kart üzerindeki isim">
            <Input value={cardForm.cardHolderName} onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
              placeholder="Ad Soyad" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
          </FormField>
          <FormField label="Kart numarası">
            <Input value={cardForm.cardNumber} onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
              placeholder="5528790000000008" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
          </FormField>
          <div className="flex gap-3">
            <FormField label="Ay" className="flex-1">
              <Input value={cardForm.expireMonth} onChange={(e) => setCardForm({ ...cardForm, expireMonth: e.target.value })}
                placeholder="12" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
            </FormField>
            <FormField label="Yıl" className="flex-1">
              <Input value={cardForm.expireYear} onChange={(e) => setCardForm({ ...cardForm, expireYear: e.target.value })}
                placeholder="2030" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
            </FormField>
            <FormField label="CVC" className="flex-1">
              <Input value={cardForm.cvc} onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                placeholder="123" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
            </FormField>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 accent-[#3348ff] rounded" />
            <span className="text-[13px] text-[#3a4553]">Bu kartı kaydet</span>
          </label>
          {saveCard && (
            <Input value={cardAlias} onChange={(e) => setCardAlias(e.target.value)}
              placeholder="Kart takma adı (Ana kartım, İş kartım…)" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10 -mt-2" />
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <hr className="border-[#dce0e5]" />

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={onBack}
          className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]">
          <ChevronLeft className="size-4" /> Teslimata dön
        </Button>
        <Button type="submit" disabled={loading} className="gap-2 bg-primary text-white hover:bg-primary/90">
          {loading ? 'İşleniyor…' : `${formatPrice(total)} öde`}
          {!loading && <ChevronRight className="size-4" />}
        </Button>
      </div>
    </form>
  )
}
