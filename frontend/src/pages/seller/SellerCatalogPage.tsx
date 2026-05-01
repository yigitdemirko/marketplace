import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, Package, Upload, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsApi } from '@/api/products'
import { feedsApi } from '@/api/feeds'
import { useAuthStore } from '@/store/authStore'
import { getCategoryLabel } from '@/constants/categories'
import { formatPrice } from '@/lib/formatPrice'
import { CatalogStatsCards } from './components/CatalogStatsCards'
import { ImportXmlModal } from './components/ImportXmlModal'
import type { ProductLocale } from '@/types'

export function SellerCatalogPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [localeFilter, setLocaleFilter] = useState<ProductLocale | 'all'>('all')
  const [importOpen, setImportOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const productsQuery = useQuery({
    queryKey: ['seller-products', user?.userId, page],
    queryFn: () => productsApi.getBySeller(user!.userId, page, PAGE_SIZE),
    enabled: !!user,
    placeholderData: (prev) => prev,
  })

  const statsQuery = useQuery({
    queryKey: ['seller-catalog-stats', user?.userId],
    queryFn: () => productsApi.getSellerStats(user!.userId),
    enabled: !!user,
  })

  const importsQuery = useQuery({
    queryKey: ['seller-imports', user?.userId],
    queryFn: () => feedsApi.getImports(user!.userId, 0, 5),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productsApi.delete(productId, user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products', user?.userId] })
      queryClient.invalidateQueries({ queryKey: ['seller-catalog-stats'] })
    },
  })

  const filtered = useMemo(() => {
    if (!productsQuery.data) return []
    return productsQuery.data.content.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? p.active : !p.active)
      const matchesLocale =
        localeFilter === 'all' || p.locale === localeFilter
      return matchesSearch && matchesStatus && matchesLocale
    })
  }, [productsQuery.data, searchQuery, statusFilter, localeFilter])

  const totalPages = productsQuery.data?.totalPages ?? 1
  const totalElements = productsQuery.data?.totalElements ?? 0

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['seller-products', user?.userId] })
    queryClient.invalidateQueries({ queryKey: ['seller-catalog-stats'] })
    queryClient.invalidateQueries({ queryKey: ['seller-imports'] })
    setPage(0)
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  return (
    <div>
      <CatalogStatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      {/* Locale tabs */}
      <div className="flex items-center gap-1 mb-4">
        {(['all', 'EN', 'TR'] as const).map((l) => (
          <button
            key={l}
            onClick={() => { setLocaleFilter(l); setPage(0) }}
            className={`h-8 px-4 text-[13px] font-medium rounded-[6px] transition-colors ${
              localeFilter === l
                ? 'bg-[#3348ff] text-white'
                : 'bg-white border border-[#dce0e5] text-[#6f7c8e] hover:bg-[#f6f7f9]'
            }`}
          >
            {l === 'all' ? 'All' : l === 'EN' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by name or brand"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] min-w-[220px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]"
        >
          <option value="all">Status: any</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="h-9 px-3 text-[14px] font-medium border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] text-[#14181f] flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import XML
          </button>
          <button
            onClick={() => navigate({ to: '/seller/products/new' })}
            className="h-9 px-4 text-[14px] font-medium bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
              <th className="px-4 py-3 w-16 text-left font-semibold text-[#6f7c8e]">Image</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Brand</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Price</th>
              <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Stock</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f6f7f9]">
            {productsQuery.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-4 py-3">
                    <div className="h-10 bg-[#f6f7f9] animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {!productsQuery.isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-[#6f7c8e]">
                  {productsQuery.data?.content.length === 0 ? (
                    <>
                      No products yet.{' '}
                      <button
                        onClick={() => navigate({ to: '/seller/products/new' })}
                        className="text-[#3348ff] hover:underline"
                      >
                        Add your first product
                      </button>{' '}
                      or{' '}
                      <button
                        onClick={() => setImportOpen(true)}
                        className="text-[#3348ff] hover:underline"
                      >
                        import an XML feed
                      </button>
                      .
                    </>
                  ) : (
                    'No products match your filters.'
                  )}
                </td>
              </tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-[#f6f7f9] transition-colors">
                <td className="px-4 py-3">
                  <div className="w-[40px] h-[40px] bg-[#f6f7f9] rounded-[6px] overflow-hidden flex items-center justify-center border border-[#dce0e5]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-[#dce0e5]" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => copyId(product.id)}
                    title={product.id}
                    className="inline-flex items-center gap-1 text-[12px] font-mono text-[#6f7c8e] hover:text-[#3348ff]"
                  >
                    {product.id.slice(0, 8)}
                    {copiedId === product.id ? (
                      <Check className="h-3 w-3 text-[#00a81c]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#14181f] truncate max-w-[260px]">{product.name}</p>
                </td>
                <td className="px-4 py-3 text-[#14181f]">{product.brand ?? '—'}</td>
                <td className="px-4 py-3 text-[#6f7c8e]">{getCategoryLabel(product.categoryId)}</td>
                <td className="px-4 py-3 text-right font-medium text-[#14181f]">{formatPrice(product.price, product.locale ?? 'EN')}</td>
                <td className="px-4 py-3 text-right text-[#6f7c8e]">{product.stock}</td>
                <td className="px-4 py-3">
                  {product.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-semibold bg-[#e6f7ee] text-[#00a81c]">
                      ✓ Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-semibold bg-[#ffeaea] text-[#fa3434]">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() =>
                        navigate({
                          to: '/seller/products/$productId/edit',
                          params: { productId: product.id },
                        })
                      }
                      className="h-7 px-2.5 text-[12px] font-medium border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#f6f7f9] text-[#14181f] flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) deleteMutation.mutate(product.id)
                      }}
                      className="h-7 w-7 flex items-center justify-center border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#ffeaea] hover:border-[#fa3434] text-[#fa3434]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[13px] text-[#6f7c8e]">
            {totalElements} product{totalElements !== 1 ? 's' : ''} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="h-8 w-8 flex items-center justify-center border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 min-w-[32px] px-2 text-[13px] font-medium border rounded-[6px] transition-colors ${
                  p === page
                    ? 'bg-[#3348ff] border-[#3348ff] text-white'
                    : 'border-[#dce0e5] bg-white hover:bg-[#f6f7f9] text-[#14181f]'
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 flex items-center justify-center border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {importsQuery.data && importsQuery.data.content.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[15px] font-semibold text-[#14181f] mb-3">Recent imports</h2>
          <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
                  <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">File</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Success</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Failed</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f6f7f9]">
                {importsQuery.data.content.map((job) => (
                  <tr key={job.id} className="hover:bg-[#f6f7f9]">
                    <td className="px-4 py-3 text-[#14181f] truncate max-w-[260px]">{job.fileName}</td>
                    <td className="px-4 py-3 text-[#6f7c8e]">{new Date(job.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#14181f]">{job.totalItems}</td>
                    <td className="px-4 py-3 text-right text-[#00a81c]">{job.successCount}</td>
                    <td className="px-4 py-3 text-right text-[#fa3434]">{job.failureCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${
                          job.status === 'COMPLETED'
                            ? 'bg-[#e6f7ee] text-[#00a81c]'
                            : job.status === 'FAILED'
                              ? 'bg-[#ffeaea] text-[#fa3434]'
                              : 'bg-[#fff4e0] text-[#f59e0b]'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ImportXmlModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
