"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

// Hamrin-relevant images: dashboards, payments, SaaS, data, business
const ORBIT_IMAGES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=400&auto=format&fit=crop&q=80",
]

export function ParticleSphere() {
  const PARTICLE_COUNT = 1200
  const PARTICLE_SIZE_MIN = 0.006
  const PARTICLE_SIZE_MAX = 0.012
  const SPHERE_RADIUS = 8
  const POSITION_RANDOMNESS = 3
  const ROTATION_SPEED_Y = 0.0006
  const IMAGE_COUNT = 16
  const IMAGE_SIZE = 1.6

  const groupRef = useRef<THREE.Group>(null)

  const textures = useTexture(ORBIT_IMAGES)

  useMemo(() => {
    textures.forEach((texture) => {
      if (texture) {
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.flipY = false
      }
    })
  }, [textures])

  const particles = useMemo(() => {
    const list = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT)
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi
      const r = SPHERE_RADIUS + (Math.random() - 0.5) * POSITION_RANDOMNESS

      list.push({
        position: [
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi),
        ] as [number, number, number],
        scale: Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN,
        // Hamrin palette: mint green + electric blue + warm gold particles
        color: new THREE.Color().setHSL(
          [0.42, 0.6, 0.13][Math.floor(Math.random() * 3)], // mint, blue, gold
          0.85,
          0.55 + Math.random() * 0.3,
        ),
      })
    }
    return list
  }, [])

  const orbitingImages = useMemo(() => {
    const list = []
    for (let i = 0; i < IMAGE_COUNT; i++) {
      const angle = (i / IMAGE_COUNT) * Math.PI * 2
      // Spread across two rings at different y levels for depth
      const yOffset = i % 2 === 0 ? 1.5 : -1.5
      const x = SPHERE_RADIUS * Math.cos(angle)
      const z = SPHERE_RADIUS * Math.sin(angle)

      const position = new THREE.Vector3(x, yOffset, z)
      const outward = position.clone().normalize()
      const euler = new THREE.Euler()
      const matrix = new THREE.Matrix4()
      matrix.lookAt(position, position.clone().add(outward), new THREE.Vector3(0, 1, 0))
      euler.setFromRotationMatrix(matrix)
      euler.z += Math.PI

      list.push({
        position: [x, yOffset, z] as [number, number, number],
        rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        textureIndex: i % textures.length,
      })
    }
    return list
  }, [textures.length])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED_Y
    }
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.9} />
        </mesh>
      ))}

      {orbitingImages.map((img, i) => (
        <mesh key={`img-${i}`} position={img.position} rotation={img.rotation}>
          <planeGeometry args={[IMAGE_SIZE, IMAGE_SIZE]} />
          <meshBasicMaterial
            map={textures[img.textureIndex]}
            side={THREE.DoubleSide}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  )
}
