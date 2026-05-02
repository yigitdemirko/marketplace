import { useState, useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

export function NavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (isLoading) {
      setVisible(true)
      setWidth(0)
      timeout = setTimeout(() => setWidth(75), 10)
    } else {
      setWidth(100)
      timeout = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 250)
    }

    return () => clearTimeout(timeout)
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 z-[200] h-[3px] bg-[#3348ff] rounded-r-full"
      style={{
        width: `${width}%`,
        transition: width === 100
          ? 'width 0.15s ease-in'
          : 'width 2.5s cubic-bezier(0.1, 0.4, 0.1, 1)',
      }}
    />
  )
}
