import { createContext, useContext, useState, ReactNode } from 'react'

export interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

interface ControlsContextType {
  controls: Controls
  setControls: (controls: Controls | ((prev: Controls) => Controls)) => void
}

const ControlsContext = createContext<ControlsContextType | null>(null)

export function ControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<Controls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })

  return (
    <ControlsContext.Provider value={{ controls, setControls }}>
      {children}
    </ControlsContext.Provider>
  )
}

export function useControls() {
  const context = useContext(ControlsContext)
  if (!context) {
    throw new Error('useControls must be used within ControlsProvider')
  }
  return context.controls
}

export function useControlsState() {
  const context = useContext(ControlsContext)
  if (!context) {
    throw new Error('useControlsState must be used within ControlsProvider')
  }
  return context
}
