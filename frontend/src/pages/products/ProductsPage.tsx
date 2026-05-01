import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ShoppingCart, ChevronDown, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsApi, type SearchFilters } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { useAddedToCartFeedback } from '@/lib/cartFeedback'
import { CATEGORIES, getCategoryLabel } from '@/constants/categories'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

const COMMON_BRANDS = [
  'Apple', 'Samsung', 'Sony', 'LG', 'Dell',
  'HP', 'Lenovo', 'Huawei', 'Nike', 'Adidas',
  'Asus', 'Xiaomi',
]

const FILTER_COLORS = [
  { id: 'red', label: 'Red', hex: '#ef4444' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'blue', label: 'Blue', hex: '#0099ff' },
  { id: 'black', label: 'Black', hex: '#3f3f3f' },
  { id: 'white', label: 'White', hex: '#e9e9e9' },
  { id: 'purple', label: 'Purple', hex: '#ea61ea' },
  { id: 'gray', label: 'Dark Gray', hex: '#bbbbbb' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'New items' },
  { value: 'price,asc', label: 'Price: Low to High' },
  { value: 'price,desc', label: 'Price: High to Low' },
]

interface Props {
  initialQuery?: string
  initialCategory?: string
  initialBrand?: string
  initialPriceMin?: number
  initialPriceMax?: number
  initialSort?: string
  initialPage?: number
}


function SearchProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const notifyAdded = useAddedToCartFeedback()
  const navigate = useNavigate()
  const mainImage = product.images?.[0]
  const isOutOfStock = product.stock === 0

  return (
    <div
      className="bg-white rounded-[12px] cursor-pointer flex flex-col"
      onClick={() => navigate({ to: '/products/$productId', params: { productId: product.id } })}
    >
      {/* Image area */}
      <div className="relative bg-[#edf0f2] rounded-[12px] h-[270px] overflow-hidden">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-[#cbd3db]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-3 py-3 flex-1">
        <p className="text-[15px] text-[#14181f] leading-[1.4] line-clamp-2 min-h-[42px] tracking-[-0.3px]">
          {product.name}
        </p>

        <div className="flex items-center gap-1.5">
          <Star className="h-[15px] w-[15px] fill-[#db6e00] text-[#db6e00]" />
          <span className="text-[13px] text-[#6f7c8e]">4.5</span>
          <span className="text-[13px] text-[#6f7c8e]">(0 orders)</span>
        </div>

        <p className="text-[15px] font-semibold text-[#14181f] mt-auto">
          {formatPrice(product.price, product.locale ?? 'EN')}
        </p>

        <button
          className="w-full py-2 px-3 bg-[#e0edff] rounded-[8px] flex items-center justify-center gap-2 text-[15px] font-medium text-[#3348ff] hover:bg-[#c7dfff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation()
            addItem({
              productId: product.id,
              sellerId: product.sellerId,
              name: product.name,
              price: product.price,
              quantity: 1,
              image: mainImage,
            })
            notifyAdded()
          }}
        >
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}

function PriceRangeBar({
  min,
  max,
  absolute = 99000,
}: {
  min: number
  max: number
  absolute?: number
}) {
  const leftPct = Math.min(100, (min / absolute) * 100)
  const rightPct = Math.min(100, 100 - (max / absolute) * 100)
  return (
    <div className="relative h-2 bg-[#cbd3db] rounded-full mb-1">
      <div
        className="absolute h-full bg-[#3348ff] rounded-full"
        style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
      />
      <div
        className="absolute w-6 h-6 bg-white border-2 border-[#3348ff] rounded-full -top-2 -translate-x-1/2 shadow cursor-pointer"
        style={{ left: `${leftPct}%` }}
      />
      <div
        className="absolute w-6 h-6 bg-white border-2 border-[#3348ff] rounded-full -top-2 -translate-x-1/2 shadow cursor-pointer"
        style={{ left: `${Math.min(100, (max / absolute) * 100)}%` }}
      />
    </div>
  )
}

export function ProductsPage({
  initialQuery,
  initialCategory,
  initialBrand,
  initialPriceMin,
  initialPriceMax,
  initialSort,
  initialPage = 0,
}: Props = {}) {
  const navigate = useNavigate()

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand ? [initialBrand] : [],
  )
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [priceMinInput, setPriceMinInput] = useState(initialPriceMin ?? 0)
  const [priceMaxInput, setPriceMaxInput] = useState(initialPriceMax ?? 99000)
  const [appliedPriceMin, setAppliedPriceMin] = useState(initialPriceMin)
  const [appliedPriceMax, setAppliedPriceMax] = useState(initialPriceMax)
  const [sortBy, setSortBy] = useState(initialSort ?? 'newest')
  const [page, setPage] = useState(initialPage)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedCategory(initialCategory)
    setSelectedBrands(initialBrand ? [initialBrand] : [])
    setAppliedPriceMin(initialPriceMin)
    setAppliedPriceMax(initialPriceMax)
    setPriceMinInput(initialPriceMin ?? 0)
    setPriceMaxInput(initialPriceMax ?? 99000)
    setSortBy(initialSort ?? 'newest')
    setPage(initialPage ?? 0)
  }, [initialQuery, initialCategory, initialBrand, initialPriceMin, initialPriceMax, initialSort, initialPage])

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filters: SearchFilters = {
    query: initialQuery,
    categoryId: selectedCategory,
    brand: selectedBrands.length > 0 ? selectedBrands[0] : undefined,
    priceMin: appliedPriceMin,
    priceMax: appliedPriceMax,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', filters, sortBy, page],
    queryFn: () =>
      productsApi.searchWithFilters(
        filters,
        page,
        9,
        sortBy !== 'newest' ? sortBy : undefined,
      ),
    staleTime: 30_000,
  })

  const totalPages = data?.totalPages ?? 0

  const getPaginationPages = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i)
    if (current <= 3) return [0, 1, 2, 3, 4, '...', total - 1]
    if (current >= total - 4) return [0, '...', total - 5, total - 4, total - 3, total - 2, total - 1]
    return [0, '...', current - 1, current, current + 1, '...', total - 1]
  }

  const paginationPages = getPaginationPages(page, totalPages)
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'New items'
  const displayedBrands = showAllBrands ? COMMON_BRANDS : COMMON_BRANDS.slice(0, 6)

  const pageTitle = initialQuery
    ? `Results for "${initialQuery}"`
    : selectedCategory
      ? getCategoryLabel(selectedCategory)
      : 'All Products'

  const handleCategorySelect = (catId: string | undefined) => {
    setSelectedCategory(catId)
    setPage(0)
    navigate({
      to: '/search',
      search: (prev) => ({
        q: prev.q,
        category: catId,
        brand: prev.brand,
        priceMin: prev.priceMin,
        priceMax: prev.priceMax,
        sort: prev.sort,
        page: undefined,
      }),
    })
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    )
    setPage(0)
  }

  const handleColorToggle = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId],
    )
  }

  const handleApplyPrice = () => {
    setAppliedPriceMin(priceMinInput > 0 ? priceMinInput : undefined)
    setAppliedPriceMax(priceMaxInput < 99000 ? priceMaxInput : undefined)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* Title bar */}
      <div className="bg-white border-b border-[#dce0e5]">
        <div className="max-w-[1370px] mx-auto px-8 py-6">
          <h1 className="text-[28px] font-bold text-[#14181f]">{pageTitle}</h1>
        </div>
      </div>

      <div className="max-w-[1370px] mx-auto px-8 py-6">
        <div className="flex gap-8 items-start">
          {/* ── Sidebar ── */}
          <aside className="w-[285px] shrink-0 flex flex-col gap-2">
            {/* Related categories */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dce0e5]">
                <h3 className="text-[18px] font-semibold text-[#14181f]">Related categories</h3>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button
                  onClick={() => handleCategorySelect(undefined)}
                  className={`flex items-center gap-2 h-9 px-3 w-full text-left rounded-lg text-[15px] tracking-[-0.3px] ${!selectedCategory ? 'bg-[#f0f7ff] text-[#3348ff] font-medium' : 'bg-[#f6f7f9] text-[#14181f]'}`}
                >
                  {!selectedCategory && <ChevronLeft className="h-5 w-5 shrink-0" />}
                  All categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center h-9 px-3 w-full text-left rounded-lg text-[15px] tracking-[-0.3px] ${selectedCategory === cat.id ? 'bg-[#f0f7ff] text-[#3348ff] font-medium' : 'bg-[#f6f7f9] text-[#14181f] hover:bg-[#edf0f2]'}`}
                  >
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dce0e5]">
                <h3 className="text-[18px] font-semibold text-[#14181f]">Brands</h3>
              </div>
              <div className="p-4">
                {displayedBrands.map((brand) => {
                  const checked = selectedBrands.includes(brand)
                  return (
                    <button
                      key={brand}
                      onClick={() => handleBrandToggle(brand)}
                      className="flex items-center gap-2 h-9 w-full text-left py-1"
                    >
                      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md border-2 border-[#dce0e5] bg-white overflow-hidden">
                        {checked && (
                          <span className="w-full h-full flex items-center justify-center bg-[#3348ff] border-[#3348ff] border-2 rounded-[5px]">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span className="text-[15px] text-[#14181f] tracking-[-0.3px]">{brand}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setShowAllBrands((p) => !p)}
                  className="flex items-center gap-1 mt-2 text-[15px] text-[#6f7c8e] underline"
                >
                  {showAllBrands ? 'Show less' : 'Show more'}
                  <ChevronDown
                    className={`h-[18px] w-[18px] transition-transform ${showAllBrands ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dce0e5]">
                <h3 className="text-[18px] font-semibold text-[#14181f]">Colors</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2.5">
                {FILTER_COLORS.map((color) => {
                  const active = selectedColors.includes(color.id)
                  return (
                    <button
                      key={color.id}
                      onClick={() => handleColorToggle(color.id)}
                      className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-[15px] font-medium tracking-[-0.3px] transition-colors ${active ? 'bg-[#f0f7ff] border-[#3348ff] text-[#3348ff]' : 'bg-white border-[#dce0e5] text-[#14181f] shadow-sm'}`}
                    >
                      <span
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor: color.hex,
                          border: active ? '2px solid #3348ff' : '1px solid #dce0e5',
                        }}
                      />
                      {color.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dce0e5]">
                <h3 className="text-[18px] font-semibold text-[#14181f]">Price</h3>
              </div>
              <div className="p-4">
                <div className="mb-6 mt-2">
                  <PriceRangeBar min={priceMinInput} max={priceMaxInput} absolute={99000} />
                </div>
                <div className="flex gap-2.5 mb-3">
                  <div className="flex-1">
                    <label className="text-[13px] text-[#14181f] mb-1.5 block">From</label>
                    <input
                      type="number"
                      min={0}
                      max={priceMaxInput}
                      value={priceMinInput}
                      onChange={(e) => setPriceMinInput(Number(e.target.value))}
                      className="w-full h-10 px-2.5 border border-[#dce0e5] rounded-lg text-[15px] text-[#14181f] bg-white focus:outline-none focus:border-[#3348ff]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[13px] text-[#14181f] mb-1.5 block">To</label>
                    <input
                      type="number"
                      min={priceMinInput}
                      max={99000}
                      value={priceMaxInput}
                      onChange={(e) => setPriceMaxInput(Number(e.target.value))}
                      className="w-full h-10 px-2.5 border border-[#dce0e5] rounded-lg text-[15px] text-[#14181f] bg-white focus:outline-none focus:border-[#3348ff]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyPrice}
                  className="w-full h-10 bg-[#e0edff] text-[#3348ff] rounded-lg text-[15px] font-medium hover:bg-[#cce0ff] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Topbar */}
            <div className="flex items-center justify-between border-b border-[#dce0e5] pb-4 mb-5">
              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  className="flex items-center gap-2 h-10 px-2.5 border border-[#dce0e5] rounded-lg text-[15px] bg-white hover:bg-[#f6f7f9] transition-colors"
                  onClick={() => setShowSortDropdown((p) => !p)}
                >
                  <span className="text-[#6f7c8e]">Show by:</span>
                  <span className="text-[#14181f] tracking-[-0.3px]">{currentSortLabel}</span>
                  <ChevronDown className="h-5 w-5 text-[#14181f]" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[#dce0e5] rounded-lg shadow-lg z-10 overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`w-full text-left px-4 py-2.5 text-[15px] tracking-[-0.3px] hover:bg-[#f6f7f9] ${sortBy === opt.value ? 'text-[#3348ff] font-medium' : 'text-[#14181f]'}`}
                        onClick={() => {
                          setSortBy(opt.value)
                          setShowSortDropdown(false)
                          setPage(0)
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid view indicator */}
              <div className="flex items-center bg-[#edf0f2] p-0.5 rounded-lg">
                <div className="px-3 py-1.5 bg-white border border-[#b6c1ca] rounded-[7px] shadow-sm">
                  <svg
                    className="h-5 w-5 text-[#14181f]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <rect x="2" y="2" width="7" height="7" rx="1.5" />
                    <rect x="11" y="2" width="7" height="7" rx="1.5" />
                    <rect x="2" y="11" width="7" height="7" rx="1.5" />
                    <rect x="11" y="11" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-[#edf0f2] animate-pulse rounded-xl h-[475px]" />
                ))}
              </div>
            )}

            {/* Error */}
            {isError && (
              <p className="text-center py-16 text-red-500 text-[15px]">
                Failed to load products. Please try again.
              </p>
            )}

            {/* Products grid */}
            {data && !isLoading && (() => {
              const visibleProducts = data.content.filter((p) => p.stock > 0)
              return (
              <>
                {visibleProducts.length === 0 ? (
                  <p className="text-center py-16 text-[#6f7c8e] text-[18px]">
                    No products found for your filters.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-5">
                    {visibleProducts.map((product) => (
                      <SearchProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-6">
                    {/* Show more button */}
                    {!data.last && (
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        className="w-full h-12 border border-[#dce0e5] rounded-lg bg-white text-[18px] font-medium text-[#14181f] flex items-center justify-center gap-2 hover:bg-[#f6f7f9] transition-colors"
                      >
                        Show more products
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    )}

                    {/* Numbered pages */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={data.first}
                        className={`flex items-center gap-1.5 h-10 px-3 rounded-lg border text-[15px] font-medium transition-colors ${data.first ? 'bg-[#edf0f2] border-[#dce0e5] text-[#b6c1ca] cursor-default' : 'bg-[#edf0f2] border-[#dce0e5] text-[#14181f] hover:bg-[#e2e7ec]'}`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </button>

                      {paginationPages.map((pg, i) =>
                        pg === '...' ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="w-10 h-10 flex items-center justify-center text-[#6f7c8e] text-[15px]"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={pg}
                            onClick={() => setPage(pg as number)}
                            className={`h-10 min-w-[40px] px-3 rounded-lg text-[15px] font-medium transition-colors ${page === pg ? 'bg-[#3348ff] text-white shadow-inner' : 'border border-[#dce0e5] bg-white text-[#14181f] hover:bg-[#f6f7f9]'}`}
                          >
                            {(pg as number) + 1}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={data.last}
                        className={`flex items-center gap-1.5 h-10 px-3 rounded-lg border text-[15px] font-medium transition-colors ${data.last ? 'border-[#dce0e5] bg-white text-[#b6c1ca] cursor-default' : 'border-[#dce0e5] bg-white text-[#14181f] hover:bg-[#f6f7f9]'}`}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
