"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, MeshDistortMaterial, Sphere, Float, Stars } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import * as THREE from "three"
import { useTheme } from "next-themes"

// Performance monitor for the R3F canvas
export function PerformanceMonitor() {
  useFrame(() => {})
  return null
}

function AnimatedTorus({ theme }: { theme: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  const color = useMemo(() => {
    return theme === "dark" ? "#60a5fa" : "#3b82f6"
  }, [theme])

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1.2, 0.35, 128, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  )
}

function AnimatedParticles({ theme }: { theme: string }) {
  const particlesRef = useRef< THREE.Points >(null!)
  const particlesCount = 500
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  const color = useMemo(() => {
    return theme === "dark" ? "#93c5fd" : "#3b82f6"
  }, [theme])

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
                <bufferAttribute
          attach="attributes-position"
          args={[positions as Float32Array, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        sizeAttenuation={true}  
        color={color}
        transparent
        opacity={0.6}
      />
    </points>
  )
}

function InteractiveSphere() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.x += delta * 0.3
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={hovered ? 1.2 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
    >
      <sphereGeometry args={[0.8, 64, 64]} />
      <MeshDistortMaterial
        color={clicked ? "#3b82f6" : "#60a5fa"}
        speed={2}
        distort={0.3}
      />
    </mesh>
  )
}

export function Hero3DScene() {
  const { theme } = useTheme()
  const currentTheme = theme || "light"

  return (
    <>
      <PerformanceMonitor />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

      <color attach="background" args={["#0a0a11"]} />
      <Stars radius={500} depth={60} count={1000} factor={7} saturation={0} />
      <AnimatedTorus theme={currentTheme} />
      <AnimatedParticles theme={currentTheme} />
      <InteractiveSphere />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  )
}