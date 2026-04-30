const posts = [
  'bg-secondary',
  'bg-accent/40',
  'bg-primary/15',
  'bg-muted',
  'bg-accent/25',
]

export function InstagramSection() {
  return (
    <section className="py-16 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Our Instagram Stories
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {posts.map((bg, i) => (
            <div
              key={i}
              className={`aspect-square rounded-[10px] ${bg} cursor-pointer hover:opacity-80 transition-opacity`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
