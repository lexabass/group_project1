import { RigidBody, CuboidCollider } from '@react-three/rapier'
import Car from './Car'
import { useControls } from '../hooks/useControls'

function Scene() {
  const controls = useControls()

  return (
    <>
      {/* ????????? */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* ?????? */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <CuboidCollider args={[25, 0.5, 25]} />
      </RigidBody>

      {/* ?????? */}
      <Car controls={controls} />
    </>
  )
}

export default Scene
