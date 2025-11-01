import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import type { Controls } from '../hooks/useControls'
import * as THREE from 'three'

interface CarProps {
  controls: Controls
}

function Car({ controls }: CarProps) {
  const { nodes, materials } = useGLTF('/models/car.glb') as any
  const chassisRef = useRef<RapierRigidBody>(null)
  const wheelRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ]

  // ??????? ???? ????? - ????? ???????????? ??? ?????????? ????????? ??????
  const wheelNames = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']
  const wheels = wheelNames.map((name) => {
    const wheelNode = Object.values(nodes).find(
      (node: any) => node.name && node.name.toLowerCase().includes(name.toLowerCase())
    ) as THREE.Mesh | undefined
    
    if (!wheelNode) {
      const allNodes = Object.values(nodes)
      const possibleWheels = allNodes.filter((node: any) => 
        node.name && (
          node.name.toLowerCase().includes('wheel') ||
          node.name.toLowerCase().includes('tyre') ||
          node.name.toLowerCase().includes('tire')
        )
      )
      return possibleWheels[wheelNames.indexOf(name)] || null
    }
    return wheelNode
  })

  const availableMeshes = Object.values(nodes).filter(
    (node: any) => node.isMesh && node.geometry
  ) as THREE.Mesh[]

  const finalWheels = wheels.every(w => w) ? wheels : availableMeshes.slice(0, 4)

  // ??????? ????? ???????????? ?????? ?????
  const wheelPositions = [
    [-0.7, -0.3, 1.2],  // ???????? ?????
    [0.7, -0.3, 1.2],   // ???????? ??????
    [-0.7, -0.3, -1.2], // ?????? ?????
    [0.7, -0.3, -1.2],  // ?????? ??????
  ]

  // ????????? ??????????
  const currentEngineForce = useRef(0)
  const currentBrakeForce = useRef(0)
  const currentSteerValue = useRef(0)
  const wheelRotations = useRef([0, 0, 0, 0]) // ???????? ?????

  // ????????? ??????
  const maxForce = 150
  const maxBrakeForce = 50
  const maxSteerValue = 0.5
  const lerpSpeed = 0.1
  const wheelRadius = 0.4
  const wheelAngularVelocity = useRef(0)

  useFrame((_, delta) => {
    if (!chassisRef.current) return

    const chassisBody = chassisRef.current

    // ????????? ??????? ???? ?????????
    let targetForce = 0
    if (controls.forward) {
      targetForce = maxForce
    } else if (controls.backward) {
      targetForce = -maxForce
    }

    // ????????? ??????? ????????? ??????
    let targetBrake = 0
    if (controls.backward && !controls.forward) {
      targetBrake = maxBrakeForce
    } else if (!controls.forward && !controls.backward) {
      targetBrake = maxBrakeForce * 0.3
    }

    // ????????? ??????? ???????? ???????? ??????????
    let targetSteer = 0
    if (controls.left) {
      targetSteer = maxSteerValue
    } else if (controls.right) {
      targetSteer = -maxSteerValue
    }

    // ??????? ????????????
    currentEngineForce.current = THREE.MathUtils.lerp(
      currentEngineForce.current,
      targetForce,
      lerpSpeed * 10
    )
    currentBrakeForce.current = THREE.MathUtils.lerp(
      currentBrakeForce.current,
      targetBrake,
      lerpSpeed * 10
    )
    currentSteerValue.current = THREE.MathUtils.lerp(
      currentSteerValue.current,
      targetSteer,
      lerpSpeed * 15
    )

    // ????????? ???? ? ?????? ??????? (RWD)
    // ?????????? ????????? ?????????? ??? ??????????? ????
    const rotation = chassisBody.rotation()
    const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion)

    // ???? ?????????
    if (Math.abs(currentEngineForce.current) > 0.1) {
      const force = forward.multiplyScalar(currentEngineForce.current)
      chassisBody.applyImpulse(
        { x: force.x, y: force.y, z: force.z },
        true
      )
    }

    // ?????????? - ????????? ???????? ? ??????? ????????
    if (currentBrakeForce.current > 0.1) {
      const linvel = chassisBody.linvel()
      const brakeImpulse = {
        x: -linvel.x * currentBrakeForce.current * 0.1,
        y: -linvel.y * currentBrakeForce.current * 0.1,
        z: -linvel.z * currentBrakeForce.current * 0.1,
      }
      chassisBody.applyImpulse(brakeImpulse, true)

      const angvel = chassisBody.angvel()
      const brakeAngularImpulse = {
        x: -angvel.x * currentBrakeForce.current * 0.05,
        y: -angvel.y * currentBrakeForce.current * 0.05,
        z: -angvel.z * currentBrakeForce.current * 0.05,
      }
      chassisBody.applyTorqueImpulse(brakeAngularImpulse, true)
    }

    // ??????? ?????????? - ??????? ?????? ???????????? ???
    if (Math.abs(currentSteerValue.current) > 0.01) {
      const steerTorque = currentSteerValue.current * 50
      chassisBody.applyTorqueImpulse({ x: 0, y: steerTorque, z: 0 }, true)
    }

    // ????????? ?????????? ???????? ?????
    const linvel = chassisBody.linvel()
    const speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2)
    wheelAngularVelocity.current = speed / wheelRadius

    wheelRotations.current = wheelRotations.current.map((rot, index) => {
      return rot + wheelAngularVelocity.current * delta * (index >= 2 ? (currentEngineForce.current > 0 ? 1 : -1) : 1)
    })

    // ????????? ??????? ? ???????? ????? ?????????
    wheelRefs.forEach((ref, index) => {
      if (ref.current && chassisBody) {
        const chassisPos = chassisBody.translation()
        const chassisRot = chassisBody.rotation()
        const chassisQuaternion = new THREE.Quaternion(chassisRot.x, chassisRot.y, chassisRot.z, chassisRot.w)

        // ??????? ?????? ???????????? ?????
        const localPos = new THREE.Vector3(...wheelPositions[index])
        const worldPos = localPos.applyQuaternion(chassisQuaternion)
        ref.current.position.set(
          chassisPos.x + worldPos.x,
          chassisPos.y + worldPos.y,
          chassisPos.z + worldPos.z
        )

        // ??????? ??????
        const steerQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          currentSteerValue.current * (index < 2 ? 1 : 0) // ?????? ???????? ?????? ??????????????
        )
        const wheelQuaternion = chassisQuaternion.clone().multiply(steerQuaternion)
        
        // ???????? ?????? ?????? ????? ???
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          wheelRotations.current[index]
        )
        wheelQuaternion.multiply(rotationQuaternion)
        
        ref.current.quaternion.copy(wheelQuaternion)
      }
    })
  })

  // ?????? ??????? ?? ???????
  useFrame(({ camera }) => {
    if (!chassisRef.current) return
    
    const chassisPosition = chassisRef.current.translation()
    const targetPosition = new THREE.Vector3(
      chassisPosition.x,
      chassisPosition.y + 3,
      chassisPosition.z + 5
    )
    
    camera.position.lerp(targetPosition, 0.05)
    camera.lookAt(chassisPosition.x, chassisPosition.y, chassisPosition.z)
  })

  return (
    <group>
      {/* ????? ?????? */}
      <RigidBody
        ref={chassisRef}
        type="dynamic"
        position={[0, 2, 0]}
        colliders="hull"
        mass={800}
        linearDamping={0.4}
        angularDamping={0.4}
      >
        {nodes && Object.keys(nodes).length > 0 ? (
          <group>
            {Object.values(nodes).map((node: any, index) => {
              if (node.isMesh && !finalWheels.includes(node)) {
                return (
                  <primitive
                    key={index}
                    object={node.clone()}
                    material={materials[node.material?.name || 'default']}
                  />
                )
              }
              return null
            })}
          </group>
        ) : (
          <mesh>
            <boxGeometry args={[2, 0.5, 4]} />
            <meshStandardMaterial color="red" />
          </mesh>
        )}
      </RigidBody>

      {/* ?????? */}
      {finalWheels.map((wheel: any, index) => {
        if (!wheel || !wheel.geometry) return null
        
        return (
          <group key={index} ref={wheelRefs[index]}>
            <primitive
              object={wheel.clone()}
              material={materials[wheel.material?.name || 'default']}
            />
          </group>
        )
      })}
    </group>
  )
}

useGLTF.preload('/models/car.glb')

export default Car
