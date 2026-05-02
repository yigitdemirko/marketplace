import { Button } from '@/components/ui/button'

interface TermsModalProps {
  onAccept: () => void
  onReject: () => void
}

export function TermsModal({ onAccept, onReject }: TermsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onReject} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="px-6 pt-6 pb-4 border-b border-foreground/10">
          <h2 className="text-xl font-bold text-foreground">Kullanım Koşulları ve Gizlilik Politikası</h2>
          <p className="text-sm text-muted-foreground mt-1">Lütfen devam etmeden önce okuyun</p>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-5 text-sm text-foreground/80 leading-relaxed">
          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Genel Kullanım Koşulları</h3>
            <p>
              Bilbo's platformuna kayıt olarak bu kullanım koşullarını kabul etmiş sayılırsınız. Platform yalnızca
              18 yaş ve üzeri kullanıcılara yönelik olup ticari amaçlarla kişisel hesap açılamaz. Bilbo's,
              önceden haber vermeksizin koşulları güncelleme hakkını saklı tutar.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Hesap Güvenliği</h3>
            <p>
              Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi üçüncü kişilerle paylaşmamanızı
              öneririz. Şüpheli bir erişim fark ederseniz derhal destek ekibimizle iletişime geçin.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Alışveriş ve İptal Politikası</h3>
            <p>
              Siparişler onaylandıktan sonra 14 gün içinde iade edilebilir. Dijital ürünler ve kişiselleştirilmiş
              ürünler iade kapsamı dışındadır. İade süreci, Mesafeli Satış Sözleşmeleri Yönetmeliği çerçevesinde
              yürütülür.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Kişisel Verilerin Korunması (KVKK)</h3>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verileriniz; sipariş işlemleri,
              müşteri hizmetleri ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir. Verileriniz
              üçüncü taraflarla yalnızca yasal zorunluluk ya da açık rızanız doğrultusunda paylaşılır.
            </p>
            <p className="mt-1">Veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Verilerinize erişim ve kopyasını talep etme</li>
              <li>Hatalı verilerin düzeltilmesini isteme</li>
              <li>Verilerinizin silinmesini veya yok edilmesini talep etme</li>
              <li>Veri işleme faaliyetlerine itiraz etme</li>
              <li>Veri taşınabilirliği hakkı</li>
            </ul>
            <p className="mt-1">
              Bu hakları kullanmak için <span className="text-primary">kvkk@bilbos-shop.com</span> adresine başvurabilirsiniz.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">5. Çerezler</h3>
            <p>
              Platformumuz oturum yönetimi ve deneyim iyileştirme amacıyla çerezler kullanmaktadır.
              Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durum bazı özelliklerin
              çalışmamasına neden olabilir.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-foreground/10 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            className="rounded-[10px]"
          >
            Reddet
          </Button>
          <Button
            type="button"
            onClick={onAccept}
            className="rounded-[10px] bg-foreground text-background hover:bg-foreground/85"
          >
            Onayla
          </Button>
        </div>
      </div>
    </div>
  )
}
