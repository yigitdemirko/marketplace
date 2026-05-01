import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, X, Plus, Upload, Loader2 } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'
import { CATEGORIES } from '@/constants/categories'
import type { ProductLocale } from '@/types'

export function SellerProductFormPage() {
  const { productId } = useParams({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = !!productId

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    brand: '',
    tags: '',
    active: true,
  })
  const [locale, setLocale] = useState<ProductLocale>('EN')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [unit, setUnit] = useState('Pcs')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        brand: product.brand ?? '',
        tags: product.attributes?.tags ?? '',
        active: product.active,
      })
      setLocale((product.locale as ProductLocale | undefined) ?? 'EN')
      setImageUrls(product.images ?? [])
      setUnit((product.attributes?.unit as string | undefined) ?? 'Pcs')
    }
  }, [product])

  const handleAddImage = () => {
    const url = newImageUrl.trim()
    if (url && !imageUrls.includes(url)) {
      setImageUrls((prev) => [...prev, url])
    }
    setNewImageUrl('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await productsApi.uploadImage(file)
      setImageUrls((prev) => [...prev, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const buildPayload = () => ({
    name: form.name,
    description: form.description,
    price: parseFloat(form.price),
    stock: parseInt(form.stock),
    category: form.categoryId,
    locale,
    brand: form.brand || undefined,
    images: imageUrls,
    active: form.active,
    attributes: {
      unit,
      tags: form.tags,
    },
  })

  const createMutation = useMutation({
    mutationFn: () => productsApi.create(buildPayload(), user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      navigate({ to: '/seller/products' })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: () => productsApi.update(productId!, buildPayload(), user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      navigate({ to: '/seller/products' })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to update product'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) updateMutation.mutate()
    else createMutation.mutate()
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-[720px]">
      <button
        onClick={() => navigate({ to: '/seller/products' })}
        className="flex items-center gap-2 text-[14px] text-[#6f7c8e] hover:text-[#14181f] mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      <h2 className="text-[20px] font-semibold text-[#14181f] mb-6">
        {isEdit ? 'Edit product' : 'Create new'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Title</label>
          <input
            type="text"
            placeholder="Name of product"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Description</label>
          <textarea
            rows={4}
            placeholder="More information"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="w-full px-3 py-2.5 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4] resize-none"
          />
        </div>

        {/* Product images */}
        <div>
          <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Product images</label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
              className="flex-1 h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="h-9 px-3 text-[14px] font-medium border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] transition-colors flex items-center gap-1.5 text-[#14181f]"
            >
              <Plus className="h-4 w-4" />
              Add URL
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 px-3 text-[14px] font-medium border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] transition-colors flex items-center gap-1.5 text-[#14181f] disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3 p-3 bg-[#f6f7f9] border border-[#dce0e5] rounded-[6px]">
              {imageUrls.map((img, i) => (
                <div key={i} className="relative w-[100px] h-[100px] border border-[#dce0e5] rounded-[6px] overflow-hidden bg-white">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 h-5 w-5 bg-white border border-[#dce0e5] rounded flex items-center justify-center hover:bg-[#ffeaea] hover:border-[#fa3434] transition-colors"
                  >
                    <X className="h-3 w-3 text-[#fa3434]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category + Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
              className="w-full h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] text-[#14181f]"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Brand</label>
            <input
              type="text"
              placeholder="e.g. Acme"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="Tag name, Tag two, ..."
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
          />
        </div>

        {/* Stock */}
        <div className="sm:w-1/2">
          <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">In stock</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
              className="flex-1 h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]"
            >
              <option>Pcs</option>
              <option>Kg</option>
              <option>Litres</option>
            </select>
          </div>
        </div>

        {/* Locale + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:w-full">
          <div>
            <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">Catalog locale</label>
            <div className="flex h-10 border border-[#dce0e5] rounded-[6px] overflow-hidden">
              {(['EN', 'TR'] as ProductLocale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`flex-1 text-[14px] font-medium transition-colors ${
                    locale === l
                      ? 'bg-[#3348ff] text-white'
                      : 'bg-white text-[#6f7c8e] hover:bg-[#f6f7f9]'
                  }`}
                >
                  {l === 'EN' ? '🇬🇧 EN ($)' : '🇹🇷 TR (₺)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#14181f] mb-1.5">
              Price <span className="text-[#6f7c8e] font-normal">({locale === 'TR' ? '₺ TRY' : '$ USD'})</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              className="w-full h-10 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] placeholder-[#9aa5b4]"
            />
          </div>
        </div>

        {/* Active toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-[#dce0e5] accent-[#3348ff]"
            />
            <span className="text-[14px] text-[#14181f]">Active product</span>
          </label>
        </div>

        {error && (
          <p className="text-[13px] text-[#fa3434] bg-[#ffeaea] border border-[#fa3434]/20 rounded-[6px] px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="h-10 px-6 text-[14px] font-semibold bg-[#3348ff] hover:bg-[#2236e0] disabled:opacity-60 text-white rounded-[6px] transition-colors"
        >
          {isLoading ? 'Saving...' : 'Submit product'}
        </button>
      </form>
    </div>
  )
}
