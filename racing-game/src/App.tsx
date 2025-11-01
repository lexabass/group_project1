// Entry point for the racing prototype: sets up scene, controls and UI overlays.
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'
import type { KeyboardControlsEntry } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { Suspense, useMemo, useState } from 'react'
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react'
import './App.css'
import { RaycastVehicle, type VehicleInputState } from './components/RaycastVehicle'

type ControlName = keyof VehicleInputState

const KEYBOARD_MAP: KeyboardControlsEntry<ControlName>[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'brake', keys: ['Space'] },
]

const INITIAL_TOUCH_STATE: VehicleInputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
}

const ROAD_LENGTH = 120
const ROAD_WIDTH = 16

function GameEnvironment() {
  const buildingConfigs = useMemo(
    () => [
      { position: [-12, 4, -30], size: [6, 8, 12], color: '#2c3343' },
      { position: [12, 6, -20], size: [6, 12, 10], color: '#394054' },
      { position: [-11, 8, -5], size: [5, 16, 9], color: '#1f2533' },
      { position: [11, 5, 0], size: [5, 10, 8], color: '#2e3546' },
      { position: [-13, 7, 15], size: [7, 14, 10], color: '#3b4560' },
      { position: [13, 9, 25], size: [7, 18, 12], color: '#1c232f' },
      { position: [-12, 5, 32], size: [6, 10, 8], color: '#2d3650' },
      { position: [12, 4, -35], size: [4, 8, 8], color: '#202736' },
      { position: [9, 4, 10], size: [4, 8, 6], color: '#2c3241' },
      { position: [-9, 4.5, -18], size: [4, 9, 7], color: '#424c65' },
    ],
    [],
  )

  return (
    <group>
      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.4} groundColor="#1a1c24" color="#f4f8ff" />
      <directionalLight
        position={[25, 35, 15]}
        intensity={1.1}
        castShadow
        shadow-camera-far={140}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <RigidBody type="fixed" colliders={false} name="road">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
          <meshStandardMaterial color="#2f3038" roughness={0.9} metalness={0.1} />
        </mesh>
        <CuboidCollider
          args={[ROAD_LENGTH / 2, 0.1, ROAD_WIDTH / 2]}
          position={[0, -0.11, 0]}
          friction={1.3}
          restitution={0}
        />
      </RigidBody>

      {buildingConfigs.map(({ position, size, color }, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid" name={`building-${index}`}>
          <mesh position={position as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={size as [number, number, number]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </RigidBody>
      ))}

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]} name="ground">
        <mesh visible={false}>
          <boxGeometry args={[300, 0.2, 300]} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function GameWorld({ touchInput }: { touchInput: VehicleInputState }) {
  const forwardPressed = useKeyboardControls<ControlName>((state) => state.forward)
  const backwardPressed = useKeyboardControls<ControlName>((state) => state.backward)
  const leftPressed = useKeyboardControls<ControlName>((state) => state.left)
  const rightPressed = useKeyboardControls<ControlName>((state) => state.right)
  const brakePressed = useKeyboardControls<ControlName>((state) => state.brake)

  const input = useMemo<VehicleInputState>(
    () => ({
      forward: forwardPressed || touchInput.forward,
      backward: backwardPressed || touchInput.backward,
      left: leftPressed || touchInput.left,
      right: rightPressed || touchInput.right,
      brake: brakePressed || touchInput.backward,
    }),
    [forwardPressed, backwardPressed, leftPressed, rightPressed, brakePressed, touchInput],
  )

  return (
    <>
      <color attach="background" args={["#101117"]} />
      <fog attach="fog" args={["#101117", 10, 120]} />
      <GameEnvironment />
      <RaycastVehicle input={input} />
    </>
  )
}

type TouchKey = keyof VehicleInputState

function TouchControls({
  input,
  setInput,
}: {
  input: VehicleInputState
  setInput: Dispatch<SetStateAction<VehicleInputState>>
}) {
  const handlePointer = (key: TouchKey, pressed: boolean) => {
    setInput((prev) => ({ ...prev, [key]: pressed }))
  }

  const bindPointerHandlers = (key: TouchKey) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      handlePointer(key, true)
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.releasePointerCapture(event.pointerId)
      handlePointer(key, false)
    },
    onPointerLeave: () => handlePointer(key, false),
    onPointerCancel: () => handlePointer(key, false),
  })

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-controls__group">
        <button className={input.forward ? 'active' : undefined} {...bindPointerHandlers('forward')}>
          ?
        </button>
        <div className="touch-controls__row">
          <button className={input.left ? 'active' : undefined} {...bindPointerHandlers('left')}>
            ?
          </button>
          <button className={input.right ? 'active' : undefined} {...bindPointerHandlers('right')}>
            ?
          </button>
        </div>
        <button className={input.backward ? 'active' : undefined} {...bindPointerHandlers('backward')}>
          ?
        </button>
      </div>
    </div>
  )
}

function App() {
  const [touchInput, setTouchInput] = useState<VehicleInputState>(INITIAL_TOUCH_STATE)

  return (
    <div className="app">
      <KeyboardControls map={KEYBOARD_MAP}>
        <Canvas shadows camera={{ position: [0, 0.35, 0.75], fov: 55 }}>
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              <GameWorld touchInput={touchInput} />
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      <TouchControls input={touchInput} setInput={setTouchInput} />
      <div className="hud">
        <div className="instructions">
          <span>W / ?</span>
          <span>S / ?</span>
          <span>A / ?</span>
          <span>D / ?</span>
          <span>Space ? Brake</span>
        </div>
      </div>
    </div>
  )
}

export default App
