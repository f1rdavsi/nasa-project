'use client'
import Link from 'next/link'
import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'

const NotFound = () => {
  const starfieldRef = useRef<HTMLCanvasElement>(null)
  const miniEarthRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!starfieldRef.current || !miniEarthRef.current) return

    const starRenderer = new THREE.WebGLRenderer({
      canvas: starfieldRef.current,
      antialias: true,
    })
    starRenderer.setPixelRatio(window.devicePixelRatio)
    const starScene = new THREE.Scene()
    starScene.background = new THREE.Color(0x060818)
    const starCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1200)
    starCamera.position.z = 10

    const resizeStarfield = () => {
      starRenderer.setSize(window.innerWidth, window.innerHeight)
      starCamera.aspect = window.innerWidth / window.innerHeight
      starCamera.updateProjectionMatrix()
    }
    resizeStarfield()
    window.addEventListener('resize', resizeStarfield)

    const createStarfield = () => {
      const starGeometry = new THREE.BufferGeometry()
      const starCount = 9000
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3
        const radius = 220 + Math.random() * 900
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i3 + 2] = radius * Math.cos(phi)

        const c = new THREE.Color()
        c.setHSL(0.58 + Math.random() * 0.08, 0.25, 0.6 + Math.random() * 0.25)
        colors[i3] = c.r
        colors[i3 + 1] = c.g
        colors[i3 + 2] = c.b
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const starMaterial = new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
      })

      const starPoints = new THREE.Points(starGeometry, starMaterial)
      starScene.add(starPoints)
    }
    createStarfield()

    const miniRenderer = new THREE.WebGLRenderer({
      canvas: miniEarthRef.current,
      antialias: true,
      alpha: true,
    })
    miniRenderer.setPixelRatio(window.devicePixelRatio)

    const sizeMini = () => {
      const rect = miniEarthRef.current!.getBoundingClientRect()
      miniRenderer.setSize(rect.width, rect.height)
      miniCamera.aspect = rect.width / rect.height
      miniCamera.updateProjectionMatrix()
    }

    const miniScene = new THREE.Scene()
    const miniCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    miniCamera.position.z = 3.2

    miniScene.add(new THREE.AmbientLight(0x404040, 0.8))
    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(4, 2, 4)
    miniScene.add(dir)

    const texLoader = new THREE.TextureLoader()
    const earthMat = new THREE.MeshPhongMaterial({
      map: texLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      ),
      specularMap: texLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
      ),
      shininess: 6,
    })

    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat)
    miniScene.add(globe)

    sizeMini()
    window.addEventListener('resize', sizeMini)

    const animate = () => {
      requestAnimationFrame(animate)

      starRenderer.render(starScene, starCamera)

      globe.rotation.y += 0.0025
      miniRenderer.render(miniScene, miniCamera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeStarfield)
      window.removeEventListener('resize', sizeMini)
      starRenderer.dispose()
      miniRenderer.dispose()
    }
  }, [])

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen text-[#e8eef9] font-['Inter',system-ui] overflow-hidden">
        <canvas ref={starfieldRef} className="fixed inset-0 w-full h-full pointer-events-none z-[-1]" />

        <main className="relative min-h-screen grid place-items-center px-5 py-10">
          <section className="grid gap-7 text-center max-w-4xl w-full">
            <h1 className="text-[clamp(28px,3vw,40px)] font-orbitron tracking-wide text-[#e8eef9] text-shadow-lg shadow-cyan-400/15">
              Page not found
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center gap-4 sm:gap-6">
              <div className="relative">
                <span
                  className="text-[clamp(80px,18vw,200px)] font-extrabold leading-none tracking-tight m-0 
                               bg-gradient-to-b from-[#ced6e0] via-[#8c98a9_55%] to-[#6b7687] 
                               bg-clip-text text-transparent 
                               filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  4
                </span>
              </div>

              <div className="w-[clamp(90px,18vw,220px)] h-[clamp(90px,18vw,220px)] rounded-full relative overflow-hidden">
                <canvas ref={miniEarthRef} className="w-full h-full block" />
              </div>

              <div className="relative">
                <span
                  className="text-[clamp(80px,18vw,200px)] font-extrabold leading-none tracking-tight m-0 
                               bg-gradient-to-b from-[#ced6e0] via-[#8c98a9_55%] to-[#6b7687] 
                               bg-clip-text text-transparent 
                               filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  4
                </span>
              </div>
            </div>

            <p
              className="mx-auto max-w-3xl text-[#9aa7bd] 
                         text-[clamp(14px,1.6vw,16px)] leading-relaxed tracking-wide font-exo">
              The requested page is not available. Perhaps she was moved, deleted or never existed. You can return to
              the main page and continue navigation.
            </p>

            <div className="flex gap-3.5 justify-center items-center">
              <Link
                href="/"
                className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-blue-400/30 to-blue-600/30 hover:from-blue-400/30 hover:to-blue-500/30 
                           text-white hover:text-blue-200 font-orbitron no-underline hover:border-blue-400  
                           shadow-lg shadow-cyan-500/35 
                           transition-all duration-150 ease-in-out
                           hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/45
                           active:translate-y-0 active:shadow-md active:shadow-cyan-500/30">
                Back to main page
              </Link>
            </div>
          </section>
        </main>
      </div>
    </Suspense>
  )
}

export default NotFound
