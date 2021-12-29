// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene 
const scene = new THREE.Scene()

// Sizes 
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 5)
camera.position.set(3,1,0)
scene.add(camera)

// Controls 
const controls = new THREE.OrbitControls(camera, canvas)
controls.enableDamping = true 

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: false 
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Create objects
const cubeObject = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 5, 5),
    new THREE.MeshBasicMaterial({ color: 'blue' })
)
cubeObject.position.set(0, 0, 0)
cubeObject.rotation.y = Math.PI / 4
scene.add(cubeObject)

renderer.render(scene, camera)

// Animate 
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()

    cubeObject.rotation.y += 0.01

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

// Save frame 
const imageData = renderer.domElement.toDataURL().replace('image/png', 'image/octet-stream')

const link = document.createElement('a')
link.download = 'frame.jpg'
link.href = imageData
link.click()
setTimeout(() => {
    window.close()
}, 5000)
