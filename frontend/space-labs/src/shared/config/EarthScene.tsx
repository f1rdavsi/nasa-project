'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const EarthPollutionScene = () => {
	const canvasRef = useRef<HTMLDivElement>(null)
	const textRef = useRef<HTMLDivElement>(null)
	const titleRef = useRef<HTMLHeadingElement>(null)
	const subtitleRef = useRef<HTMLParagraphElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)

	const [displayedText, setDisplayedText] = useState('')
	const [currentAnimation, setCurrentAnimation] = useState<
		'appearance' | 'typing'
	>('appearance')

	const fullText =
		'Our planet suffers from industrial emissions. Every factory leaves its mark on the atmosphere, threatening the ecosystem and human health.'

	const degToRad = (deg: number) => (deg * Math.PI) / 180

	const sphericalToCartesian = (
		latDeg: number,
		lonDeg: number,
		radius: number
	) => {
		const lat = degToRad(latDeg)
		const lon = degToRad(lonDeg)
		return new THREE.Vector3(
			Math.cos(lat) * Math.cos(lon) * radius,
			Math.sin(lat) * radius,
			Math.cos(lat) * Math.sin(lon) * radius
		)
	}

	const startTypewriterAnimation = () => {
		setDisplayedText('')
		let currentIndex = 0

		const typeInterval = setInterval(() => {
			if (currentIndex <= fullText.length) {
				setDisplayedText(fullText.slice(0, currentIndex))
				currentIndex++
			} else {
				clearInterval(typeInterval)
				setTimeout(() => {
					startTypewriterAnimation()
				}, 2000) 
			}
		}, 50)
	}

	const animateTextAppearance = () => {
		if (!titleRef.current || !subtitleRef.current || !buttonRef.current) return

		const tl = gsap.timeline({ delay: 0.5 })

		tl.fromTo(
			titleRef.current,
			{
				opacity: 0,
				x: -100,
			},
			{
				opacity: 1,
				x: 0,
				duration: 0.8,
				ease: 'power2.out',
			}
		)
			.fromTo(
				subtitleRef.current,
				{
					opacity: 0,
					x: -100,
				},
				{
					opacity: 1,
					x: 0,
					duration: 0.6,
					ease: 'power2.out',
					onComplete: () => {
						setCurrentAnimation('typing')
						startTypewriterAnimation()
					},
				},
				'-=0.4'
			)
			.fromTo(
				buttonRef.current,
				{
					opacity: 0,
					x: -100,
				},
				{
					opacity: 1,
					x: 0,
					duration: 0.1,
					ease: 'power2.out',
				},
				'-=0.4'
			)
	}

	const createStarfield = (scene: THREE.Scene) => {
		const starGeometry = new THREE.BufferGeometry()
		const starCount = 10000
		const positions = new Float32Array(starCount * 3)
		const colors = new Float32Array(starCount * 3)
		const sizes = new Float32Array(starCount)

		for (let i = 0; i < starCount; i++) {
			const i3 = i * 3
			const radius = 200 + Math.random() * 800
			const theta = Math.random() * Math.PI * 2
			const phi = Math.acos(Math.random() * 2 - 1)

			positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
			positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
			positions[i3 + 2] = radius * Math.cos(phi)

			const color = new THREE.Color()
			color.setHSL(Math.random() * 0.2 + 0.5, 0.3, Math.random() * 0.5 + 0.5)
			colors[i3] = color.r
			colors[i3 + 1] = color.g
			colors[i3 + 2] = color.b

			sizes[i] = Math.random() * 2 + 0.5
		}

		starGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3)
		)
		starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
		starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

		const starMaterial = new THREE.PointsMaterial({
			size: 2,
			sizeAttenuation: true,
			vertexColors: true,
			transparent: true,
		})

		const starfield = new THREE.Points(starGeometry, starMaterial)
		scene.add(starfield)
		return starfield
	}

	const createEarthWithAtmosphere = () => {
		const earthGroup = new THREE.Group()
		earthGroup.position.x = 3

		const textureLoader = new THREE.TextureLoader()
		const earthGeometry = new THREE.SphereGeometry(4, 64, 64)
		const earthMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load(
				'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
			),
			bumpMap: textureLoader.load(
				'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
			),
			bumpScale: 0.05,
			roughness: 0.8,
			metalness: 0.2,
		})
		const earth = new THREE.Mesh(earthGeometry, earthMaterial)
		earthGroup.add(earth)
		const atmosphereGeometry = new THREE.SphereGeometry(4.1, 64, 64)
		const atmosphereMaterial = new THREE.MeshPhongMaterial({
			transparent: true,
			opacity: 0.1,
			color: 0x87ceeb,
			side: THREE.BackSide,
		})
		const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
		earthGroup.add(atmosphere)
		const pollutionGeometry = new THREE.SphereGeometry(4.12, 64, 64)
		const pollutionMaterial = new THREE.MeshPhongMaterial({
			transparent: true,
			opacity: 0,
			color: 0x8b7355,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
		})
		const pollutionLayer = new THREE.Mesh(pollutionGeometry, pollutionMaterial)
		earthGroup.add(pollutionLayer)

		return {
			earth: earthGroup,
			atmosphere: atmosphere,
			pollutionLayer: pollutionLayer,
			mesh: earth,
			material: earthMaterial,
			originalColor: new THREE.Color(1, 1, 1),
		}
	}

	const createWorkshopBuilding = () => {
		const workshop = new THREE.Group()

		const base = new THREE.Mesh(
			new THREE.BoxGeometry(1.8, 1.5, 1.2),
			new THREE.MeshPhongMaterial({ color: 0x6b8e23 })
		)
		workshop.add(base)
		const roof = new THREE.Mesh(
			new THREE.CylinderGeometry(1.0, 1.2, 0.4, 4),
			new THREE.MeshPhongMaterial({ color: 0x8b4513 })
		)
		roof.position.y = 0.95
		roof.rotation.y = Math.PI / 4
		workshop.add(roof)
		const door = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 0.8, 0.05),
			new THREE.MeshPhongMaterial({ color: 0x8b7355 })
		)
		door.position.set(0, 0.4, 0.63)
		workshop.add(door)

		return workshop
	}

	const createStorageBuilding = () => {
		const storage = new THREE.Group()

		const base = new THREE.Mesh(
			new THREE.BoxGeometry(2.2, 1.2, 1.6),
			new THREE.MeshPhongMaterial({ color: 0x708090 })
		)
		storage.add(base)
		const tank1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12),
			new THREE.MeshPhongMaterial({ color: 0x4682b4 })
		)
		tank1.position.set(0.6, 0.9, 0.3)
		storage.add(tank1)

		const tank2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12),
			new THREE.MeshPhongMaterial({ color: 0x5f9ea0 })
		)
		tank2.position.set(-0.7, 0.8, -0.4)
		storage.add(tank2)

		return storage
	}

	const createComplexBuildings = (group: THREE.Group, location: any) => {
		const mainBuilding = new THREE.Group()
		const base = new THREE.Mesh(
			new THREE.BoxGeometry(3.2, 2.5, 1.8),
			new THREE.MeshStandardMaterial({
				color: 0x4a4a4a,
				roughness: 0.9,
				metalness: 0.2,
			})
		)
		mainBuilding.add(base)
		const upperFloor = new THREE.Mesh(
			new THREE.BoxGeometry(2.8, 1.2, 1.5),
			new THREE.MeshPhongMaterial({ color: 0x5a5a5a })
		)
		upperFloor.position.y = 1.85
		mainBuilding.add(upperFloor)
		const vent1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
			new THREE.MeshPhongMaterial({ color: 0x666666 })
		)
		vent1.position.set(-1.2, 2.8, 0.6)
		mainBuilding.add(vent1)

		const vent2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8),
			new THREE.MeshPhongMaterial({ color: 0x777777 })
		)
		vent2.position.set(1.1, 2.6, -0.5)
		mainBuilding.add(vent2)
		for (let floor = 0; floor < 4; floor++) {
			for (let i = 0; i < 6; i++) {
				const window = new THREE.Mesh(
					new THREE.BoxGeometry(0.15, 0.3, 0.05),
					new THREE.MeshPhongMaterial({
						color: 0xffd700,
						emissive: 0x333300,
					})
				)
				const side = i < 3 ? -1 : 1
				window.position.set(side * 1.4, -0.8 + floor * 0.7, ((i % 3) - 1) * 0.5)
				mainBuilding.add(window)
			}
		}

		mainBuilding.position.set(0, 1.25, 0)
		group.add(mainBuilding)

		const workshop = createWorkshopBuilding()
		workshop.position.set(2.2, 0.9, 1.5)
		group.add(workshop)

		const storage = createStorageBuilding()
		storage.position.set(-2.5, 0.6, -1.8)
		group.add(storage)
	}

	const createDetailedInfrastructure = (group: THREE.Group, location: any) => {
		const pipes = [
			{ height: 5.0, radius: 0.2, x: -1.0, z: 0.8, color: 0x696969 },
			{ height: 3.5, radius: 0.15, x: 1.5, z: -0.6, color: 0x808080 },
			{ height: 4.2, radius: 0.25, x: 0.3, z: 1.2, color: 0x556b2f },
			{ height: 2.8, radius: 0.12, x: -1.8, z: -1.0, color: 0x708090 },
		]

		pipes.forEach(pipe => {
			const pipeGroup = new THREE.Group()

			const pipeMesh = new THREE.Mesh(
				new THREE.CylinderGeometry(pipe.radius, pipe.radius, pipe.height, 16),
				new THREE.MeshStandardMaterial({
					color: pipe.color,
					roughness: 0.7,
					metalness: 0.4,
				})
			)
			pipeMesh.position.y = pipe.height / 2
			pipeGroup.add(pipeMesh)

			const cap = new THREE.Mesh(
				new THREE.CylinderGeometry(
					pipe.radius * 1.2,
					pipe.radius * 0.8,
					0.3,
					16
				),
				new THREE.MeshPhongMaterial({ color: 0x333333 })
			)
			cap.position.y = pipe.height + 0.15
			pipeGroup.add(cap)

			pipeGroup.position.set(pipe.x, 0, pipe.z)
			group.add(pipeGroup)
		})

		const conveyor = new THREE.Mesh(
			new THREE.BoxGeometry(4.0, 0.08, 0.6),
			new THREE.MeshPhongMaterial({ color: 0x2f4f4f })
		)
		conveyor.position.set(0.5, 0.2, -2.2)
		group.add(conveyor)

		for (let i = 0; i < 5; i++) {
			const support = new THREE.Mesh(
				new THREE.BoxGeometry(0.1, 0.4, 0.1),
				new THREE.MeshPhongMaterial({ color: 0x8b4513 })
			)
			support.position.set(-1.5 + i * 0.75, 0.2, -2.2)
			group.add(support)
		}
	}

	const createHeavySmokeSystem = (emitter: any) => {
		const smokeGroup = new THREE.Group()
		const particles = []
		const particleCount = 80

		for (let i = 0; i < particleCount; i++) {
			const size = 0.1 + Math.random() * 0.2
			const smokeGeometry = new THREE.SphereGeometry(size, 8, 8)
			const smokeMaterial = new THREE.MeshPhongMaterial({
				color: new THREE.Color().setHSL(0.1, 0.1, 0.3 + Math.random() * 0.4),
				transparent: true,
				opacity: 0,
				shininess: 10,
			})

			const particle = new THREE.Mesh(smokeGeometry, smokeMaterial)

			particle.position.set(
				emitter.x + (Math.random() - 0.5) * 0.5,
				emitter.y - Math.random() * 2,
				emitter.z + (Math.random() - 0.5) * 0.5
			)

			particle.userData = {
				initialPosition: particle.position.clone(),
				life: Math.random() * 8,
				maxLife: 12 + Math.random() * 10,
				speed: 0.02 + Math.random() * 0.03,
				driftX: (Math.random() - 0.5) * 0.01,
				driftZ: (Math.random() - 0.5) * 0.01,
				scale: 0.4 + Math.random() * 0.6,
				targetScale: 3 + Math.random() * 2,
			}

			smokeGroup.add(particle)
			particles.push(particle)
		}

		smokeGroup.userData = {
			particles: particles,
			emitter: emitter,
			active: false,
		}

		return smokeGroup
	}

	const createEmissionSystems = (group: THREE.Group, location: any) => {
		const emissions = [
			{ x: -1.0, y: 5.0, z: 0.8, intensity: location.pollutionLevel * 1.5 },
			{ x: 1.5, y: 3.5, z: -0.6, intensity: location.pollutionLevel * 1.3 },
			{ x: 0.3, y: 4.2, z: 1.2, intensity: location.pollutionLevel * 1.4 },
			{ x: -1.8, y: 2.8, z: -1.0, intensity: location.pollutionLevel * 1.2 },
		]

		emissions.forEach(emitter => {
			const smokeSystem = createHeavySmokeSystem(emitter)
			group.add(smokeSystem)
		})
	}

	const createRealisticFactory = (location: any) => {
		const factoryGroup = new THREE.Group()
		factoryGroup.userData = { location: location }

		createComplexBuildings(factoryGroup, location)
		createDetailedInfrastructure(factoryGroup, location)
		createEmissionSystems(factoryGroup, location)

		return factoryGroup
	}

	const createAtmosphericPollutionSystem = () => {
		const pollutionGroup = new THREE.Group()
		const layers = []

		for (let i = 0; i < 4; i++) {
			const radius = 4.15 + i * 0.06
			const layerGeometry = new THREE.SphereGeometry(radius, 48, 48)
			const layerMaterial = new THREE.MeshPhongMaterial({
				transparent: true,
				opacity: 0,
				color: new THREE.Color().setHSL(0.1, 0.4, 0.2 + i * 0.08),
				side: THREE.BackSide,
				blending: THREE.AdditiveBlending,
			})

			const layer = new THREE.Mesh(layerGeometry, layerMaterial)
			pollutionGroup.add(layer)
			layers.push(layer)
		}

		const smogParticles = []
		const particleCount = 150

		for (let i = 0; i < particleCount; i++) {
			const radius = 4.2 + Math.random() * 0.4
			const theta = Math.random() * Math.PI * 2
			const phi = Math.acos(Math.random() * 2 - 1)

			const size = 0.03 + Math.random() * 0.04
			const particleGeometry = new THREE.SphereGeometry(size, 4, 4)
			const particleMaterial = new THREE.MeshPhongMaterial({
				color: new THREE.Color().setHSL(0.1, 0.3, 0.15 + Math.random() * 0.25),
				transparent: true,
				opacity: 0,
				shininess: 10,
			})

			const particle = new THREE.Mesh(particleGeometry, particleMaterial)

			particle.position.set(
				radius * Math.sin(phi) * Math.cos(theta),
				radius * Math.sin(phi) * Math.sin(theta),
				radius * Math.cos(phi)
			)

			particle.userData = {
				initialOpacity: 0,
				targetOpacity: 0.3 + Math.random() * 0.4,
				speed: 0.0008 + Math.random() * 0.0012,
				drift: new THREE.Vector3(
					(Math.random() - 0.5) * 0.0008,
					(Math.random() - 0.5) * 0.0008,
					(Math.random() - 0.5) * 0.0008
				),
			}

			pollutionGroup.add(particle)
			smogParticles.push(particle)
		}

		pollutionGroup.userData = {
			layers: layers,
			particles: smogParticles,
			intensity: 0,
		}

		return pollutionGroup
	}

	const factoryLocations = [
		{
			lat: 42.33,
			lon: -83.05,
			type: 'automotive',
			color: 0xc0c0c0,
			pollutionLevel: 0.7,
		},
		{
			lat: 51.48,
			lon: 6.8,
			type: 'industrial',
			color: 0x8b4513,
			pollutionLevel: 0.8,
		},
		{
			lat: 31.23,
			lon: -121.47,
			type: 'electronics',
			color: 0x4682b4,
			pollutionLevel: 0.9,
		},
		{
			lat: 24.69,
			lon: -20.5,
			type: 'technology',
			color: 0xdc143c,
			pollutionLevel: 0.6,
		},
		{
			lat: 55.0,
			lon: 59.0,
			type: 'metallurgy',
			color: 0x2f4f4f,
			pollutionLevel: 0.85,
		},
		{
			lat: 19.08,
			lon: 72.88,
			type: 'chemical',
			color: 0xda70d6,
			pollutionLevel: 0.75,
		},
		{
			lat: -23.55,
			lon: -46.63,
			type: 'manufacturing',
			color: 0x32cd32,
			pollutionLevel: 0.5,
		},
		{
			lat: -33.87,
			lon: 151.21,
			type: 'mining',
			color: 0xffd700,
			pollutionLevel: 0.4,
		},
	]

	useEffect(() => {
		if (!canvasRef.current) return

		let isMounted = true
		let animationFrameId: number
		const scene = new THREE.Scene()
		scene.background = new THREE.Color(0x000011)

		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		camera.position.set(0, 0, 150) 
		const renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)

		if (canvasRef.current) {
			while (canvasRef.current.firstChild) {
				canvasRef.current.removeChild(canvasRef.current.firstChild)
			}
			canvasRef.current.appendChild(renderer.domElement)
		}
		
		let earthObject: any
		const factories: any[] = []
		const smokeSystems: any[] = []
		const atmosphericPollution: any[] = []
		let pollutionLevel = 0
		const pollutionTarget = 100
		const pollutionSpeed = 0.02

		const animationState = {
			phase: 'initial',
			complete: false,
		}

		let isDragging = false
		let previousMousePosition = { x: 0, y: 0 }
		const targetRotation = { x: 0, y: 0 }
		const currentRotation = { x: 0, y: 0 }

		const animateEarthEntrance = () => {
			animationState.phase = 'zooming'

			const tl = gsap.timeline()

			tl.to(camera.position, {
				z: 8,
				duration: 2,
				ease: 'power2.inOut',
			})

				.to(
					earthObject.earth.scale,
					{
						x: 1,
						y: 1,
						z: 1,
						duration: 2,
						ease: 'power2.out',
					},
					'-=1.5'
				)
				.call(() => {
					animationState.phase = 'complete'
					animationState.complete = true
					setTimeout(startPollutionAnimation, 1000)
					animateTextAppearance()
					setupScrollControl()
				})
		}

		const setupScrollControl = () => {
			let scrollProgress = 0
			const minScale = 0.3
			const maxScale = 1.0
			const scaleRange = maxScale - minScale

			const onScroll = () => {
				if (!animationState.complete || !isMounted) return

				const scrollY = window.scrollY
				const windowHeight = window.innerHeight
				const documentHeight =
					document.documentElement.scrollHeight - windowHeight

				scrollProgress = Math.min(Math.max(scrollY / documentHeight, 0), 1)

				const invertedProgress = 1 - scrollProgress
				const newScale = minScale + invertedProgress * scaleRange

				gsap.to(earthObject.earth.scale, {
					x: newScale,
					y: newScale,
					z: newScale,
					duration: 0.5,
					ease: 'power2.out',
				})

				const cameraZ = 8 + scrollProgress * 12 
				gsap.to(camera.position, {
					z: cameraZ,
					duration: 0.5,
					ease: 'power2.out',
				})
			}

			window.addEventListener('scroll', onScroll, { passive: true })

			return () => {
				window.removeEventListener('scroll', onScroll)
			}
		}

		const startPollutionAnimation = () => {
			if (!isMounted) return

			smokeSystems.forEach(system => {
				system.userData.active = true
			})
			atmosphericPollution.forEach(system => {
				system.userData.active = true
			})
		}

		const initScene = () => {
			createStarfield(scene)

			const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
			scene.add(ambientLight)

			const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
			directionalLight.position.set(10, 5, 5)
			scene.add(directionalLight)

			earthObject = createEarthWithAtmosphere()
			const earth = earthObject.earth

			earth.scale.set(0.001, 0.001, 0.001)
			scene.add(earth)

			const atmosphericSystem = createAtmosphericPollutionSystem()
			earth.add(atmosphericSystem)
			atmosphericPollution.push(atmosphericSystem)

			factoryLocations.forEach(location => {
				const factory = createRealisticFactory(location)
				const position = sphericalToCartesian(location.lat, location.lon, 4.02)
				factory.position.copy(position)
				const normal = position.clone().normalize()
				const up = new THREE.Vector3(0, 1, 0)
				factory.quaternion.setFromUnitVectors(up, normal)
				const scale = 0.06
				factory.scale.set(scale, scale, scale)
				earth.add(factory)
				factories.push({
					mesh: factory,
					location: location,
				})
				factory.traverse((child: any) => {
					if (child.userData && child.userData.particles) {
						smokeSystems.push(child)
					}
				})
			})

			animateEarthEntrance()
		}

		const onMouseDown = (e: MouseEvent) => {
			if (!animationState.complete || !isMounted) return
			isDragging = true
			previousMousePosition = { x: e.clientX, y: e.clientY }
		}

		const onMouseMove = (e: MouseEvent) => {
			if (!isDragging || !animationState.complete || !isMounted) return

			const deltaX = e.clientX - previousMousePosition.x
			const deltaY = e.clientY - previousMousePosition.y

			targetRotation.y += deltaX * 0.01
			targetRotation.x += deltaY * 0.01

			previousMousePosition = { x: e.clientX, y: e.clientY }
		}

		const onMouseUp = () => {
			isDragging = false
		}

		const onWheel = (e: WheelEvent) => {
			if (!animationState.complete || !isMounted) return
			e.preventDefault()
			camera.position.z += e.deltaY * 0.05
			camera.position.z = Math.max(3, Math.min(100, camera.position.z))
		}

		const animate = () => {
			if (!isMounted) return

			animationFrameId = requestAnimationFrame(animate)

			if (animationState.complete && isMounted) {
				currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05
				currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05
				earthObject.earth.rotation.x = currentRotation.x
				earthObject.earth.rotation.y = currentRotation.y

				if (!isDragging) {
					targetRotation.y += 0.001
				}

				if (pollutionLevel < pollutionTarget) {
					pollutionLevel += pollutionSpeed
				}

				smokeSystems.forEach(system => {
					if (system.userData.active) {
						system.userData.particles.forEach((particle: any) => {
							const data = particle.userData

							if (data.life < data.maxLife) {
								data.life += 0.12

								particle.position.y += data.speed
								particle.position.x += data.driftX
								particle.position.z += data.driftZ

								const progress = data.life / data.maxLife
								const scale =
									data.scale + (data.targetScale - data.scale) * progress
								particle.scale.setScalar(scale)

								let opacity
								if (progress < 0.5) {
									opacity = progress / 0.5
								} else {
									opacity = 1 - (progress - 0.5) / 0.5
								}
								particle.material.opacity =
									opacity *
									(pollutionLevel / 100) *
									0.8 *
									system.userData.emitter.intensity
							} else {
								data.life = 0
								particle.position.copy(data.initialPosition)
								particle.material.opacity = 0
							}
						})
					}
				})

				atmosphericPollution.forEach(system => {
					if (system.userData.active) {
						const intensity = pollutionLevel / 100
						system.userData.layers.forEach((layer: any, index: number) => {
							const targetOpacity = intensity * (0.15 + index * 0.08)
							layer.material.opacity = THREE.MathUtils.lerp(
								layer.material.opacity,
								targetOpacity,
								0.03
							)
						})

						system.userData.particles.forEach((particle: any) => {
							const data = particle.userData
							particle.position.add(data.drift)

							const targetOpacity = data.targetOpacity * intensity
							particle.material.opacity = THREE.MathUtils.lerp(
								particle.material.opacity,
								targetOpacity,
								0.015
							)
						})
					}
				})

				if (earthObject.pollutionLayer) {
					earthObject.pollutionLayer.material.opacity = THREE.MathUtils.lerp(
						earthObject.pollutionLayer.material.opacity,
						(pollutionLevel / 100) * 0.4,
						0.02
					)
				}

				if (earthObject.material) {
					const targetBrightness = 1.0 - (pollutionLevel / 100) * 0.4
					const currentBrightness = earthObject.material.color.r
					const newBrightness = THREE.MathUtils.lerp(
						currentBrightness,
						targetBrightness,
						0.02
					)

					earthObject.material.color.setRGB(
						newBrightness,
						newBrightness,
						newBrightness
					)
				}
			}

			if (isMounted) {
				renderer.render(scene, camera)
			}
		}

		const onResize = () => {
			if (!isMounted) return

			camera.aspect = window.innerWidth / window.innerHeight
			camera.updateProjectionMatrix()
			renderer.setSize(window.innerWidth, window.innerHeight)
		}

		renderer.domElement.addEventListener('mousedown', onMouseDown)
		renderer.domElement.addEventListener('mousemove', onMouseMove)
		renderer.domElement.addEventListener('mouseup', onMouseUp)
		renderer.domElement.addEventListener('wheel', onWheel)
		window.addEventListener('resize', onResize)

		initScene()
		animate()

		return () => {
			isMounted = false

			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId)
			}

			if (earthObject?.earth) {
				gsap.killTweensOf([camera.position, earthObject.earth.scale])
			}

			if (renderer.domElement) {
				renderer.domElement.removeEventListener('mousedown', onMouseDown)
				renderer.domElement.removeEventListener('mousemove', onMouseMove)
				renderer.domElement.removeEventListener('mouseup', onMouseUp)
				renderer.domElement.removeEventListener('wheel', onWheel)
			}
			window.removeEventListener('resize', onResize)

			scene.traverse((object: any) => {
				if (object.geometry) {
					object.geometry.dispose()
				}
				if (object.material) {
					if (Array.isArray(object.material)) {
						object.material.forEach((material: any) => material.dispose())
					} else {
						object.material.dispose()
					}
				}
			})

			if (
				canvasRef.current &&
				renderer.domElement &&
				canvasRef.current.contains(renderer.domElement)
			) {
				canvasRef.current.removeChild(renderer.domElement)
			}

			renderer.dispose()
		}
	}, [])

	const handleLearnMore = () => {
		window.scrollTo({
			top: window.pageYOffset + 700,
			behavior: 'smooth',
		})
	}

	return (
		<div className='relative w-full min-h-screen bg-black'>
			<div ref={canvasRef} className='w-full h-screen overflow-hidden' />
			<div className='absolute inset-0 flex items-center pointer-events-none'>
				<div
					ref={textRef}
					className='text-white max-w-2xl px-8 ml-8 lg:ml-16 pointer-events-auto'
				>
					<h1
						ref={titleRef}
						className='text-5xl md:text-7xl lg:text-8xl font-bold mb-6 drop-shadow-2xl font-orbitron opacity-0'
					>
						AIR
						<span className='block text-blue-400 mt-2'>POLLUTION</span>
					</h1>

					<p
						ref={subtitleRef}
						className='text-lg font-exo md:text-xl lg:text-xl mb-8 drop-shadow-lg leading-relaxed opacity-0 min-h-[120px]'
					>
						{currentAnimation === 'appearance'
							? 'Our planet suffers from industrial emissions. Every factory leaves its mark on the atmosphere, threatening the ecosystem and human health.'
							: displayedText}
						{currentAnimation === 'typing' &&
							displayedText.length < fullText.length && (
								<span className='ml-1 animate-pulse'>|</span>
							)}
					</p>

					<button
						ref={buttonRef}
						onClick={handleLearnMore}
						className='bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/50 hover:from-blue-400/30 hover:to-blue-500/30 text-white text-lg hover:text-blue-200 font-orbitron py-4 px-8 rounded-full shadow-2xl opacity-0 hover:scale-105 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/30 cursor-pointer'
					>
						Learn more about the problems
					</button>
				</div>
			</div>
		</div>
	)
}

export default EarthPollutionScene