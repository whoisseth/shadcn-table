import { useEffect } from "react"

const useBodyPointerEvents = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.pointerEvents = "auto"
    } else {
      document.body.style.pointerEvents = ""
    }

    return () => {
      document.body.style.pointerEvents = ""
    }
  }, [isOpen])
}

export default useBodyPointerEvents
