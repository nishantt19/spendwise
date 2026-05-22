import * as React from "react"

const TABLET_MIN = 640
const TABLET_MAX = 1024

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setIsTablet(w >= TABLET_MIN && w < TABLET_MAX)
    }
    const mql = window.matchMedia(
      `(min-width: ${TABLET_MIN}px) and (max-width: ${TABLET_MAX - 1}px)`
    )
    mql.addEventListener("change", check)
    check()
    return () => mql.removeEventListener("change", check)
  }, [])

  return !!isTablet
}
