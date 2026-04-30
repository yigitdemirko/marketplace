import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'

export function BestsellerSection() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'bestseller'],
    queryFn: () => productsApi.getAll(0, 8),
  })

  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">Our Bestseller</h2>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-[10px]" />
            ))}
          </div>
        )}

        {data && data.content.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.content.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() =>
                  navigate({ to: '/products/$productId', params: { productId: product.id } })
                }
              />
            ))}
          </div>
        )}

        {data && data.content.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No products available yet.</p>
        )}
      </div>
    </section>
  )
}
