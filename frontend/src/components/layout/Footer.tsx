import { Link } from '@tanstack/react-router'
import { Smartphone } from 'lucide-react'

const columns = [
  {
    header: 'Company',
    links: ['About Us', 'Investor', 'Careers', 'Blog and news'],
    isCompany: true,
  },
  {
    header: 'Buyers',
    links: ['Find store', 'Registration', 'Find partners', 'Gift solutions'],
  },
  {
    header: 'Help',
    links: ['Contact us', 'Technical support', 'Live chat', 'Refund', 'Trade order'],
  },
  {
    header: 'Service',
    links: ['Trade Resources', 'Logistics service', 'Refund', 'Sale purchase'],
  },
  {
    header: 'Language',
    links: ['Español', 'Português', '한국어', '日本語'],
  },
]


export function Footer() {
  return (
    <footer className="bg-[#1c1c1c]">
      <div className="max-w-[1280px] mx-auto px-8 pt-12 pb-8">
        {/* 5-column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-10">
          {columns.map(({ header, links, isCompany }) => (
            <div key={header}>
              {isCompany ? (
                <div className="mb-4">
                  <Link to="/" className="flex items-center gap-2 mb-4">
                    <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">B</span>
                    </div>
                    <span className="font-bold text-white text-[16px]">Brandname</span>
                  </Link>
                </div>
              ) : (
                <p className="text-white font-semibold text-[16px] mb-4">{header}</p>
              )}
              {isCompany && (
                <p className="text-white font-semibold text-[16px] mb-4">{header}</p>
              )}
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] text-white/60 hover:text-white transition-colors block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* App store badges */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] px-3 py-2 transition-colors">
              <Smartphone className="h-5 w-5 text-white" />
              <div className="text-left">
                <p className="text-[10px] text-white/60 leading-none">Download on the</p>
                <p className="text-[13px] text-white font-medium leading-tight">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] px-3 py-2 transition-colors">
              <Smartphone className="h-5 w-5 text-white" />
              <div className="text-left">
                <p className="text-[10px] text-white/60 leading-none">Get it on</p>
                <p className="text-[13px] text-white font-medium leading-tight">Google Play</p>
              </div>
            </button>
          </div>

          {/* Copyright */}
          <p className="text-[14px] text-white/60">
            © {new Date().getFullYear()} Company Inc. All Rights Reserved
          </p>

          <div />
        </div>
      </div>
    </footer>
  )
}
