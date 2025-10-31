/*
Auto-generated reference: https://github.com/pmndrs/gltfjsx
Source asset: public/models/car.glb (CC-BY-NC-SA-4.0)
*/

import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import { Group } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

type CarModelProps = ThreeElements['group']

export function CarModel(props: CarModelProps) {
  const { scene } = useGLTF('/models/car-transformed.glb')

  const cloned = useMemo(() => clone(scene) as Group, [scene])

  return <primitive object={cloned} {...props} />
}

useGLTF.preload('/models/car-transformed.glb')
