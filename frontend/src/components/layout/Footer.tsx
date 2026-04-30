import { Link } from '@tanstack/react-router'

const information = ['My Account', 'Login', 'My Cart', 'My Wishlist', 'Checkout']
const service = ['About Us', 'Careers', 'Delivery Information', 'Privacy Policy', 'Terms & Conditions']

export function Footer() {
  return (
    <footer className="bg-foreground text-background/70">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <Link to="/" className="text-xl font-bold text-background block mb-3">
              Marketplace
            </Link>
            <p className="text-sm leading-relaxed">
              100 Ecommerce Street,<br />Shopping City, SC 12345
            </p>
            <p className="text-sm">info@marketplace.com</p>
            <p className="text-sm">+1 (555) 000-0000</p>
          </div>

          {/* Information */}
          <div>
            <p className="text-background font-semibold mb-4 text-sm">Information</p>
            <ul className="space-y-2 text-sm">
              {information.map((item) => (
                <li key={item}>
                  <Link to="/" className="hover:text-background transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <p className="text-background font-semibold mb-4 text-sm">Service</p>
            <ul className="space-y-2 text-sm">
              {service.map((item) => (
                <li key={item}>
                  <Link to="/" className="hover:text-background transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-background font-semibold mb-4 text-sm">Subscribe</p>
            <p className="text-sm mb-3 leading-relaxed">
              Enter your email to get the best coupons and deals
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 h-10 px-3 text-sm bg-background/10 border border-background/20 rounded-l text-background placeholder:text-background/40 focus:outline-none focus:border-background/40 min-w-0"
              />
              <button className="h-10 px-4 bg-primary text-white text-sm rounded-r hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>©{new Date().getFullYear()} Marketplace. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-background transition-colors">Facebook</a>
            <a href="#" className="hover:text-background transition-colors">Twitter</a>
            <a href="#" className="hover:text-background transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
