import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { ControlsProvider } from './hooks/useControls'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import Scene from './components/Scene'
import Overlay from './components/Overlay'
import './App.css'

function AppContent() {
  useKeyboardControls()

  return (
    <>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Scene />
          </Physics>
        </Suspense>
      </Canvas>
      <Overlay />
    </>
  )
}

function App() {
  return (
    <ControlsProvider>
      <AppContent />
    </ControlsProvider>
  )
}

export default App
