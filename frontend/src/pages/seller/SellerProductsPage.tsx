import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'

export function SellerProductsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!isAuthenticated || user?.accountType !== 'SELLER') {
    navigate({ to: '/' })
    return null
  }

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', user?.userId],
    queryFn: () => productsApi.getBySeller(user!.userId),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productsApi.delete(productId, user!.userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-products'] }),
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!data) return
    if (selected.size === data.content.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.content.map((p) => p.id)))
    }
  }

  return (
    <div>
      {/* Header / filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Search item"
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] min-w-[180px]"
        />
        <select className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]">
          <option>All categories</option>
          <option>Electronics</option>
          <option>Home items</option>
          <option>Food and Drinks</option>
        </select>
        <select className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]">
          <option>Status: any</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="h-9 px-4 text-[14px] font-medium border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] transition-colors text-[#14181f]">
            Import file
          </button>
          <button
            onClick={() => navigate({ to: '/seller/products/new' })}
            className="h-9 px-4 text-[14px] font-medium bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="rounded border-[#dce0e5]"
                  checked={!!data && selected.size === data.content.length && data.content.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 w-16 text-left font-semibold text-[#6f7c8e]">Image</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[#6f7c8e]">Inventory</th>
              <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Price</th>
              <th className="px-4 py-3 text-right font-semibold text-[#6f7c8e]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f6f7f9]">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-10 bg-[#f6f7f9] animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {!isLoading && data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#6f7c8e]">
                  No products yet.{' '}
                  <button
                    onClick={() => navigate({ to: '/seller/products/new' })}
                    className="text-[#3348ff] hover:underline"
                  >
                    Add your first product
                  </button>
                </td>
              </tr>
            )}
            {data?.content.map((product) => (
              <tr key={product.id} className="hover:bg-[#f6f7f9] transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-[#dce0e5]"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="w-[50px] h-[50px] bg-[#f6f7f9] rounded-[6px] overflow-hidden flex items-center justify-center border border-[#dce0e5]">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-[#dce0e5]" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#14181f]">{product.name}</p>
                  <p className="text-[12px] text-[#6f7c8e]">{product.categoryId}</p>
                </td>
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
                <td className="px-4 py-3 text-[#6f7c8e]">{product.stock} in stock</td>
                <td className="px-4 py-3 text-right font-medium text-[#14181f]">
                  ${product.price.toFixed(2)}
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
                      className="h-7 px-2.5 text-[12px] font-medium border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#f6f7f9] transition-colors text-[#14181f] flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) deleteMutation.mutate(product.id)
                      }}
                      className="h-7 w-7 flex items-center justify-center border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#ffeaea] hover:border-[#fa3434] transition-colors text-[#fa3434]"
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
    </div>
  )
}
