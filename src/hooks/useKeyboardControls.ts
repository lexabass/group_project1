import { useEffect } from 'react'
import { useControlsState } from './useControls'

export function useKeyboardControls() {
  const { setControls } = useControlsState()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setControls((prev) => ({ ...prev, forward: true }))
          break
        case 's':
        case 'arrowdown':
          setControls((prev) => ({ ...prev, backward: true }))
          break
        case 'a':
        case 'arrowleft':
          setControls((prev) => ({ ...prev, left: true }))
          break
        case 'd':
        case 'arrowright':
          setControls((prev) => ({ ...prev, right: true }))
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setControls((prev) => ({ ...prev, forward: false }))
          break
        case 's':
        case 'arrowdown':
          setControls((prev) => ({ ...prev, backward: false }))
          break
        case 'a':
        case 'arrowleft':
          setControls((prev) => ({ ...prev, left: false }))
          break
        case 'd':
        case 'arrowright':
          setControls((prev) => ({ ...prev, right: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setControls])
}
