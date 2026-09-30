import React, { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import InkScene from './components/InkScene'
import { images } from './data/images'

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedTextures, setLoadedTextures] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [currentMode, setCurrentMode] = useState(0)
  const modeNames = [
    "1 · Ink Bloom",
    "2 · RGB Split",
    "3 · Slice Shutter",
    "4 · Pixel Mosaic",
    "5 · Zoom Blur"
  ];
  
  const title1Ref = useRef(null)
  const title2Ref = useRef(null)
  const [nextTitle, setNextTitle] = useState("")

  // Provide a way for InkScene to trigger a transition in the UI
  const handleTransitionStart = (nextIdx, duration) => {
    setNextTitle(images[nextIdx].title)
    
    const tl = gsap.timeline()
    
    const outTime = duration * 0.4
    const inTime = duration * 0.6
    
    tl.to(title1Ref.current, {
      y: -30,
      opacity: 0,
      duration: outTime,
      ease: "power2.in"
    }, 0)
    
    tl.fromTo(title2Ref.current, {
      y: 30,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: inTime,
      ease: "power2.out"
    }, outTime)
  }

  const handleTransitionComplete = (nextIdx) => {
    setCurrentIndex(nextIdx)
    // Reset positions
    gsap.set(title1Ref.current, { y: 0, opacity: 1 })
    gsap.set(title2Ref.current, { opacity: 0 })
  }

  useEffect(() => {
    // Preload textures
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    
    const textures = []
    let loadedCount = 0
    
    images.forEach((img, idx) => {
      loader.load(
        img.url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearFilter
          tex.generateMipmaps = false
          textures[idx] = tex
          loadedCount++
          
          if (loadedCount === images.length) {
            setLoadedTextures(textures)
            setLoading(false)
          }
        },
        undefined,
        (err) => {
          console.error(`Failed to load image at URL: ${img.url}`, err)
          loadedCount++
          if (loadedCount === images.length) {
            setLoadedTextures(textures)
            setLoading(false)
          }
        }
      )
    })
    
    return () => {
      textures.forEach(t => t && t.dispose())
    }
  }, [])

  return (
    <>
      {loading && (
        <div className="loading-screen">
          Loading...
        </div>
      )}
      
      {!loading && (
        <>
          <Canvas 
            camera={{ position: [0, 0, 1] }} 
            gl={{ antialias: false }} // no need for geometry antialiasing on a single plane
            dpr={[1, 2]} // Support high DPI
          >
            <InkScene 
              textures={loadedTextures} 
              currentIndex={currentIndex}
              onTransitionStart={handleTransitionStart}
              onTransitionComplete={handleTransitionComplete}
              onModeChange={setCurrentMode}
            />
          </Canvas>
          
          <div className="ui-overlay">
            <div className="ui-top">
              <span className="hint-text">Click Anywhere</span>
            </div>
            
            <div className="mode-indicator">
              {modeNames[currentMode]}
            </div>
            
            <div className="ui-bottom">
              <div className="title-container">
                <h1 className="title" ref={title1Ref}>
                  {images[currentIndex]?.title}
                </h1>
                <h1 className="title" ref={title2Ref} style={{ opacity: 0 }}>
                  {nextTitle}
                </h1>
              </div>
              
              <div className="counter">
                {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
