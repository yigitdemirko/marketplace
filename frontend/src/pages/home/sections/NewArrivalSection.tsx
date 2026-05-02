import { Link } from '@tanstack/react-router'
import { EMPTY_SEARCH } from '@/routes/search'

const items = [
  {
    id: 'ps5',
    name: 'PlayStation 5',
    desc: 'Siyah ve beyaz PS5 sürümü indirimde.',
    size: 'large',
    bg: 'bg-foreground',
    emoji: '🎮',
  },
  {
    id: 'women',
    name: 'Kadın Koleksiyonu',
    desc: 'Size farklı bir hava katacak öne çıkan kadın koleksiyonları.',
    size: 'top-right',
    bg: 'bg-muted',
    emoji: '👗',
  },
  {
    id: 'speakers',
    name: 'Hoparlörler',
    desc: 'Kablosuz hoparlörler',
    size: 'bottom-left',
    bg: 'bg-muted',
    emoji: '🔊',
  },
  {
    id: 'perfume',
    name: 'Parfüm',
    desc: 'GUCCI INTENSE OUD EDP',
    size: 'bottom-right',
    bg: 'bg-muted',
    emoji: '🌺',
  },
]

export function NewArrivalSection() {
  return (
    <section className="py-10 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-5 h-10 rounded bg-primary block shrink-0" />
            <span className="text-primary font-semibold text-sm">Öne çıkan</span>
          </div>
          <h2 className="text-3xl font-semibold text-foreground">Yeni gelenler</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto lg:h-[600px]">
          {/* Large left: PS5 */}
          <Link
            to="/search"
            search={EMPTY_SEARCH}
            className={`${items[0].bg} rounded flex flex-col justify-end p-8 min-h-[300px] lg:min-h-0 group`}
          >
            <div className="flex-1 flex items-center justify-center text-5xl sm:text-8xl mb-4">
              {items[0].emoji}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-background mb-1">{items[0].name}</h3>
              <p className="text-sm text-background/60 mb-3">{items[0].desc}</p>
              <span className="text-sm text-background border-b border-background/60 pb-0.5 hover:border-background transition-colors">
                Hemen al
              </span>
            </div>
          </Link>

          {/* Right: 3 smaller cards */}
          <div className="grid grid-rows-2 gap-4">
            {/* Top: Women's */}
            <Link
              to="/search"
              search={EMPTY_SEARCH}
              className={`${items[1].bg} rounded flex items-end p-8 group`}
            >
              <div className="flex-1 flex items-center justify-end text-7xl pr-4">
                {items[1].emoji}
              </div>
              <div className="max-w-[200px]">
                <h3 className="text-lg font-semibold text-foreground mb-1">{items[1].name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{items[1].desc}</p>
                <span className="text-sm text-foreground border-b border-foreground/60 pb-0.5">
                  Hemen al
                </span>
              </div>
            </Link>

            {/* Bottom: Speakers + Perfume */}
            <div className="grid grid-cols-2 gap-4">
              {items.slice(2).map((item) => (
                <Link
                  key={item.id}
                  to="/search"
                  search={EMPTY_SEARCH}
                  className={`${item.bg} rounded flex flex-col items-center justify-end p-6 group`}
                >
                  <div className="text-5xl mb-4">{item.emoji}</div>
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-foreground mb-0.5">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                    <span className="text-xs text-foreground border-b border-foreground/60 pb-0.5">
                      Hemen al
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
