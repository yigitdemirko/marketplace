export function SellerCTASection() {
  return (
    <section className="py-5 bg-[#f6f7f9]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div
          className="rounded-[8px] overflow-hidden bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/banners/office.png)' }}
        >
          <div className="absolute inset-0 bg-[#1a1a2e]/70" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-8 lg:p-12">
            {/* Left — copy */}
            <div className="max-w-[480px]">
              <p className="text-[13px] text-[#7b93ff] font-semibold uppercase tracking-wide mb-3">
                Satıcı olun
              </p>
              <h2 className="text-[28px] lg:text-[36px] font-bold text-white leading-snug mb-4">
                Bilbo's üzerinde<br />satışa kolay başlangıç
              </h2>
              <p className="text-[15px] text-white/70 leading-relaxed">
                Milyonlarca alıcıya ulaşan binlerce satıcıya katılın. Mağazanızı dakikalar içinde
                kurun ve işinizi büyütmeye başlayın.
              </p>
            </div>

            {/* Right — CTA card */}
            <div className="bg-white rounded-[8px] shadow-lg p-8 w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
              <h3 className="text-[18px] font-semibold text-[#14181f]">Mağazanızı açın</h3>

              <ul className="space-y-2 text-[14px] text-[#525e6f]">
                <li className="flex items-center gap-2">
                  <span className="text-[#3348ff]">✓</span> Kuruluş ücreti yok — ücretsiz başlayın
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3348ff]">✓</span> Türkiye genelinde milyonlarca alıcıya ulaşın
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3348ff]">✓</span> Güvenli ödeme ve satıcı güvencesi
                </li>
              </ul>

              <a
                href={`${import.meta.env.VITE_SELLER_URL ?? ''}/register`}
                className="bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] px-6 py-3 text-[15px] font-medium text-center transition-colors mt-2"
              >
                Hemen satışa başla
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function DealsSection() {
  return <SellerCTASection />
}
