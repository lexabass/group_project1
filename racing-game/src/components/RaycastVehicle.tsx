import { useFrame, useThree } from '@react-three/fiber'
import {
  MeshCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier'
import type RAPIER from '@dimforge/rapier3d-compat'
import { useEffect, useMemo, useRef } from 'react'
import { MathUtils, Quaternion, Vector3 } from 'three'
import { CarModel } from './CarModel'

export type VehicleInputState = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  brake: boolean
}

export type RaycastVehicleProps = {
  input: VehicleInputState
  onReady?: (rigidBody: RapierRigidBody) => void
}

const MODEL_HALF_WIDTH = 0.0104
const MODEL_HALF_LENGTH = 0.024425
const MODEL_HALF_HEIGHT = 0.006835
const MODEL_CENTER_OFFSET = new Vector3(0, -0.006805, -0.000405)
const MODEL_CENTER_OFFSET_ARRAY: [number, number, number] = [
  MODEL_CENTER_OFFSET.x,
  MODEL_CENTER_OFFSET.y,
  MODEL_CENTER_OFFSET.z,
]

const REAR_WHEEL_INDICES = [2, 3] as const
const FRONT_WHEEL_INDICES = [0, 1] as const

const MAX_ENGINE_FORCE = 2200
const MAX_BRAKE_FORCE = 1800
const NATURAL_BRAKE_FORCE = 60
const MAX_FORWARD_SPEED = 55
const MAX_REVERSE_SPEED = 15
const MAX_STEER_LOW_SPEED = MathUtils.degToRad(32)
const MAX_STEER_HIGH_SPEED = MathUtils.degToRad(12)
const STEER_SPEED_FALLOFF = 35

const tempForward = new Vector3(0, 0, -1)
const tempOffset = new Vector3()
const tempQuaternion = new Quaternion()
const tempPosition = new Vector3()

export function RaycastVehicle({ input, onReady }: RaycastVehicleProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const controllerRef = useRef<RAPIER.DynamicRayCastVehicleController | null>(null)
  const { world, rapier } = useRapier()
  const camera = useThree((state) => state.camera)

  const wheelPlacement = useMemo(() => {
    const track = MODEL_HALF_WIDTH * 0.92
    const frontZ = MODEL_HALF_LENGTH * 0.78
    const rearZ = -MODEL_HALF_LENGTH * 0.82
    const wheelRadius = 0.0036
    const suspensionRestLength = 0.0034
    const hubHeight = -MODEL_HALF_HEIGHT + wheelRadius * 1.1

    return {
      wheelRadius,
      suspensionRestLength,
      positions: [
        new rapier.Vector3(track, hubHeight, frontZ),
        new rapier.Vector3(-track, hubHeight, frontZ),
        new rapier.Vector3(track, hubHeight, rearZ),
        new rapier.Vector3(-track, hubHeight, rearZ),
      ],
    }
  }, [rapier])

  useEffect(() => {
    const chassis = bodyRef.current
    if (!chassis) {
      return
    }

    const controller = world.createVehicleController(chassis)
    controller.indexUpAxis = 1
    controller.setIndexForwardAxis = 2

    wheelPlacement.positions.forEach((position, index) => {
      controller.addWheel(
        position,
        new rapier.Vector3(0, -1, 0),
        new rapier.Vector3(1, 0, 0),
        wheelPlacement.suspensionRestLength,
        wheelPlacement.wheelRadius,
      )

      controller.setWheelSuspensionStiffness(index, 38)
      controller.setWheelSuspensionCompression(index, 6.5)
      controller.setWheelSuspensionRelaxation(index, 8.5)
      controller.setWheelMaxSuspensionForce(index, 6000)
      controller.setWheelFrictionSlip(index, 6)
      controller.setWheelSideFrictionStiffness(index, 2.4)
      controller.setWheelMaxSuspensionTravel(index, wheelPlacement.suspensionRestLength * 1.6)
    })

    controllerRef.current = controller
    onReady?.(chassis)

    return () => {
      world.removeVehicleController(controller)
      controllerRef.current = null
    }
  }, [onReady, wheelPlacement, world, rapier])

  useFrame((_, delta) => {
    const controller = controllerRef.current
    const chassis = bodyRef.current

    if (!controller || !chassis) {
      return
    }

    const throttleInput = (input.forward ? 1 : 0) - (input.backward ? 1 : 0)
    const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    const brakeInput = input.brake ? 1 : 0

    if (throttleInput !== 0 || steerInput !== 0 || brakeInput !== 0) {
      chassis.wakeUp()
    }

    const speed = controller.currentVehicleSpeed()

    let engineForce = throttleInput * MAX_ENGINE_FORCE
    if (throttleInput > 0 && speed > MAX_FORWARD_SPEED) {
      engineForce = 0
    }
    if (throttleInput < 0 && speed < -MAX_REVERSE_SPEED) {
      engineForce = 0
    }

    const brakingForce =
      brakeInput * MAX_BRAKE_FORCE + (throttleInput === 0 ? NATURAL_BRAKE_FORCE : 0)

    REAR_WHEEL_INDICES.forEach((wheelIndex) => {
      controller.setWheelEngineForce(wheelIndex, engineForce)
      controller.setWheelBrake(wheelIndex, brakingForce)
    })

    FRONT_WHEEL_INDICES.forEach((wheelIndex) => {
      controller.setWheelEngineForce(wheelIndex, 0)
      controller.setWheelBrake(wheelIndex, brakingForce)
    })

    const clampedSteer = MathUtils.clamp(steerInput, -1, 1)
    const steerAngleRange = MathUtils.lerp(
      MAX_STEER_LOW_SPEED,
      MAX_STEER_HIGH_SPEED,
      MathUtils.clamp(Math.abs(speed) / STEER_SPEED_FALLOFF, 0, 1),
    )

    FRONT_WHEEL_INDICES.forEach((wheelIndex) => {
      controller.setWheelSteering(wheelIndex, steerAngleRange * clampedSteer)
    })

    controller.updateVehicle(delta)

    const translation = chassis.translation()
    const rotation = chassis.rotation()

    tempQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    tempForward.set(0, 0, 1).applyQuaternion(tempQuaternion)

    tempOffset
      .copy(tempForward)
      .negate()
      .multiplyScalar(0.14)
      .add(new Vector3(0, 0.06, 0))

    tempPosition.set(translation.x, translation.y, translation.z).add(tempOffset)

    camera.position.lerp(tempPosition, 1 - Math.exp(-delta * 4))
    camera.lookAt(translation.x, translation.y + 0.02, translation.z)
  })

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      mass={1200}
      angularDamping={0.6}
      linearDamping={0.3}
      canSleep
      position={[0, 0.02, 0]}
      name="player-vehicle"
    >
      <group position={MODEL_CENTER_OFFSET_ARRAY}>
        <CarModel />
      </group>

      <MeshCollider type="hull">
        <group position={MODEL_CENTER_OFFSET_ARRAY} visible={false}>
          <CarModel />
        </group>
      </MeshCollider>
    </RigidBody>
  )
}
