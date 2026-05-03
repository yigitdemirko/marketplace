import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { isValidName } from '@/lib/validation'
import type { SavedAddress } from '@/types'
import { FormField } from './FormField'
import { SavedAddressSelector } from './SavedAddressSelector'
import { DELIVERY_OPTIONS, type DeliveryMethod } from './delivery'

interface ShippingStepProps {
  contact: { name: string; surname: string; email: string }
  setContact: React.Dispatch<React.SetStateAction<{ name: string; surname: string; email: string }>>
  shippingForm: { city: string; postalCode: string; addressLine1: string; addressLine2: string }
  setShippingForm: React.Dispatch<React.SetStateAction<{ city: string; postalCode: string; addressLine1: string; addressLine2: string }>>
  deliveryMethod: DeliveryMethod
  setDeliveryMethod: (m: DeliveryMethod) => void
  hasAddresses: boolean
  showNewAddress: boolean
  setShowNewAddress: (b: boolean) => void
  saveAddress: boolean
  setSaveAddress: (b: boolean) => void
  addressTitle: string
  setAddressTitle: (s: string) => void
  error: string
  setError: (s: string) => void
  onNext: () => void
}

export function ShippingStep(props: ShippingStepProps) {
  const navigate = useNavigate()
  const {
    contact, setContact, shippingForm, setShippingForm,
    deliveryMethod, setDeliveryMethod, hasAddresses, showNewAddress, setShowNewAddress,
    saveAddress, setSaveAddress, addressTitle, setAddressTitle, error, setError, onNext,
  } = props

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setShippingForm({
      city: addr.city,
      postalCode: addr.postalCode,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
    })
    const [firstName, ...rest] = addr.fullName.split(' ')
    setContact((c) => ({ ...c, name: firstName, surname: rest.join(' ') }))
    setShowNewAddress(false)
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!isValidName(contact.name) || !isValidName(contact.surname)) {
      setError('Ad ve soyad sadece harf içerebilir'); return
    }
    if ((!hasAddresses || showNewAddress) && !isValidName(shippingForm.city)) {
      setError('Şehir sadece harf içerebilir'); return
    }
    setError('')
    onNext()
  }

  return (
    <form id="shipping-form" onSubmit={handleSubmit}>
      {/* Contact */}
      <article className="mb-5">
        <h4 className="mb-5 text-xl font-semibold text-[#14181f]">İletişim bilgileri</h4>
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-6">
          <FormField label="Ad">
            <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
              placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
          </FormField>
          <FormField label="Soyad">
            <Input value={contact.surname} onChange={(e) => setContact({ ...contact, surname: e.target.value })}
              placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
          </FormField>
          <FormField label="E-posta" className="md:col-span-2">
            <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
          </FormField>
        </fieldset>
        <hr className="border-[#dce0e5]" />
      </article>

      {/* Shipping address */}
      <article className="mb-5">
        <h4 className="mb-5 text-xl font-semibold text-[#14181f]">Teslimat adresi</h4>

        {hasAddresses && !showNewAddress && (
          <>
            <SavedAddressSelector onSelect={handleSelectSavedAddress} />
            <button
              type="button"
              onClick={() => setShowNewAddress(true)}
              className="flex items-center gap-1.5 text-[13px] text-[#3348ff] hover:underline mb-4"
            >
              <Plus className="h-3.5 w-3.5" /> Farklı adres gir
            </button>
          </>
        )}

        {(!hasAddresses || showNewAddress) && (
          <>
            {showNewAddress && (
              <button type="button" onClick={() => setShowNewAddress(false)}
                className="text-[13px] text-[#6f7c8e] hover:text-[#3348ff] mb-4 flex items-center gap-1">
                ← Kayıtlı adreslerime dön
              </button>
            )}
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-4">
              <FormField label="Şehir">
                <Input value={shippingForm.city} onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                  placeholder="Şehir adı girin" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
              </FormField>
              <FormField label="Posta kodu">
                <Input value={shippingForm.postalCode} onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                  className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
              </FormField>
              <FormField label="Adres satırı 1" className="md:col-span-2">
                <Input value={shippingForm.addressLine1} onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                  placeholder="Sokak adı, bina" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
              </FormField>
              <FormField label="Adres satırı 2" optional className="md:col-span-2">
                <Input value={shippingForm.addressLine2} onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                  placeholder="Daire, kat" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" />
              </FormField>
            </fieldset>

            <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 accent-[#3348ff] rounded" />
              <span className="text-[13px] text-[#3a4553]">Bu adresi kaydet</span>
            </label>
            {saveAddress && (
              <Input value={addressTitle} onChange={(e) => setAddressTitle(e.target.value)}
                placeholder="Adres başlığı (Ev, İş…)" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10 mb-4" />
            )}
          </>
        )}

        <p className="mb-3 text-sm text-[#14181f]">Teslimat seçeneği</p>
        <fieldset className="flex flex-col sm:flex-row gap-2">
          {DELIVERY_OPTIONS.map((option) => {
            const selected = deliveryMethod === option.id
            return (
              <label key={option.id} className={cn(
                'flex flex-1 items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                selected ? 'border-primary bg-blue-50' : 'border-[#dce0e5] bg-white',
              )}>
                <input type="radio" name="delivery-type" checked={selected}
                  onChange={() => setDeliveryMethod(option.id)} className="mt-1 accent-primary" />
                <div>
                  <span className="text-sm text-[#14181f] font-medium">{option.label}</span>
                  <p className="text-xs text-[#6f7c8e] mt-0.5">{option.description}</p>
                </div>
              </label>
            )
          })}
        </fieldset>
      </article>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      <hr className="my-6 border-[#dce0e5]" />

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => navigate({ to: '/cart' })}
          className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]">
          <ChevronLeft className="size-4" /> Sepete dön
        </Button>
        <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/90">
          Ödemeye geç <ChevronRight className="size-4" />
        </Button>
      </div>
    </form>
  )
}
