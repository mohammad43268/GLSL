import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

import vertexShader from '../shaders/ink.vert.glsl?raw'
import fragmentShader from '../shaders/ink.frag.glsl?raw'

const getTexRes = (tex) => {
  if (!tex) return [1, 1];
  const img = tex.image || tex.source?.data;
  if (!img) return [1, 1];
  return [img.naturalWidth || img.videoWidth || img.width || 1, img.naturalHeight || img.videoHeight || img.height || 1];
}

const DURATIONS = [1.8, 1.4, 1.6, 1.5, 1.6];

export default function InkScene({ textures, currentIndex, onTransitionStart, onTransitionComplete, onModeChange }) {
  const materialRef = useRef()
  const isAnimating = useRef(false)
  const currentModeRef = useRef(0)
  const { viewport, size } = useThree()
  
  // Create uniforms only once
  const uniforms = useMemo(() => {
    const res = getTexRes(textures[currentIndex])
    return {
      uTex1: { value: textures[currentIndex] },
      uTex2: { value: textures[currentIndex] },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uImageRes1: { value: new THREE.Vector2(res[0], res[1]) },
      uImageRes2: { value: new THREE.Vector2(res[0], res[1]) },
      uMode: { value: 0 }
    }
  }, [textures]) // we only initialize it once after textures load

  // Update resolution uniform when window resizes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
    }
  }, [size])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating.current) return;
      const key = parseInt(e.key);
      if (key >= 1 && key <= 5) {
        const newMode = key - 1;
        currentModeRef.current = newMode;
        if (materialRef.current) {
          materialRef.current.uniforms.uMode.value = newMode;
        }
        if (onModeChange) onModeChange(newMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange]);

  useFrame((state) => {
    if (materialRef.current) {
      // Update time uniform every frame
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  const handleClick = (e) => {
    if (isAnimating.current) return

    // Find next valid texture index
    let nextIdx = (currentIndex + 1) % textures.length
    // Skip failed textures if any
    while (!textures[nextIdx] && nextIdx !== currentIndex) {
      nextIdx = (nextIdx + 1) % textures.length
    }
    
    if (nextIdx === currentIndex) return // no other images to show
    
    isAnimating.current = true
    const nextTexture = textures[nextIdx]
    
    // Calculate UV origin for the click
    // e.clientX / window.innerWidth gives 0 to 1
    // For Y, we need to flip it because WebGL UV origin is bottom-left
    const originX = e.clientX / window.innerWidth
    const originY = 1.0 - (e.clientY / window.innerHeight)
    
    // Set up material for transition
    const m = materialRef.current
    const res = getTexRes(nextTexture)
    
    m.uniforms.uOrigin.value.set(originX, originY)
    m.uniforms.uTex2.value = nextTexture
    m.uniforms.uImageRes2.value.set(res[0], res[1])
    
    const currentDuration = DURATIONS[currentModeRef.current]
    
    // Notify React layer
    onTransitionStart(nextIdx, currentDuration)

    // Tween the progress uniform directly
    gsap.to(m.uniforms.uProgress, {
      value: 1,
      duration: currentDuration,
      ease: "power2.inOut",
      onComplete: () => {
        // Swap textures
        const finalRes = getTexRes(nextTexture)
        m.uniforms.uTex1.value = nextTexture
        m.uniforms.uImageRes1.value.set(finalRes[0], finalRes[1])
        m.uniforms.uProgress.value = 0
        
        isAnimating.current = false
        onTransitionComplete(nextIdx)
      }
    })
  }

  return (
    // Scale plane to exactly fit the viewport based on the camera distance/fov
    <mesh onClick={handleClick} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true} // in case of alpha, but here not strictly needed
      />
    </mesh>
  )
}
