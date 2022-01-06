/**
 * CANVAS
 */
const canvas = document.querySelector('canvas.webgl')

// GUI


/**
 * SCENE
 */
const scene = new THREE.Scene()

/**
 *  SIZES
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * SIZES
 */
// {x: -0.9658165240435557, y: 1.4126270660824591, z: 1.0198988665344708}
// Lt {x: -1.2196619047830328, y: 1.1658619114439774, z: 1.0879613235153813}
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10)
camera.position.set(-1.219,1.165,1.087)
scene.add(camera)

/**
 * HELPERS
 */
const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

/**
 * CONTROLS
 */
const controls = new THREE.OrbitControls(camera, canvas)
controls.enableDamping = true 

/**
 * RENDERER 
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#abcbff')
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.CineonToneMapping
renderer.toneMappingExposure = 5

/**
 * LIGHTS
 */
const mainGroup = new THREE.Group()

const ambientLight = new THREE.AmbientLight('#ffffff', 0.02)
const directionalLight = new THREE.DirectionalLight('#ffffff', 0.3)
const rectAreaLight = new THREE.RectAreaLight('#ffffff', 1, 0.39,0.83)
const rectAreaLightHelper = new THREE.RectAreaLightHelper(rectAreaLight)
const rectAreaLightTwo = new THREE.RectAreaLight('#ffffff', 1, 0.36,0.83)
const rectAreaLightHelperTwo = new THREE.RectAreaLightHelper(rectAreaLightTwo)
const rectAreaLightThree = new THREE.RectAreaLight('#ffffff', 3, 0.34,0.83)
const rectAreaLightHelperThree = new THREE.RectAreaLightHelper(rectAreaLightThree)

rectAreaLight.add(rectAreaLightHelper)
rectAreaLight.position.set(0.02,0.6,-0.85)
rectAreaLight.rotation.y = Math.PI

rectAreaLightTwo.add(rectAreaLightHelperTwo)
rectAreaLightTwo.position.set(-0.425,0.6,-0.85)
rectAreaLightTwo.rotation.y = Math.PI

rectAreaLightThree.add(rectAreaLightHelperThree)
rectAreaLightThree.position.set(0.465,0.6,-0.85)
rectAreaLightThree.rotation.y = Math.PI

directionalLight.position.set(-0.5,1.5,0.5)
directionalLight.shadow.camera.far = 2
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.left = -1
directionalLight.shadow.camera.right = 0.95
directionalLight.shadow.camera.top = 0.74
directionalLight.shadow.camera.bottom = -1
directionalLight.shadow.mapSize.set(2048,2048)
directionalLight.castShadow = true
directionalLight.shadow.normalBias = 0.05

const pointLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera)

mainGroup.add(
    ambientLight, 
    directionalLight, 
    rectAreaLight,
    rectAreaLightTwo,
    rectAreaLightThree
    // pointLightShadowHelper
)

/**
 *  LOADERS + HANDLE ITEM LOADING
 */
const gltfLoader = new THREE.GLTFLoader()

// Fetching user items from HTML, items inputted with EJS
const userItems = document.getElementById('user_items').innerText.split(',')

// Adding objects to the scene 
const objectsDir = '/room-setup-objects'
userItems.forEach(item => {
    gltfLoader.load(
        `${objectsDir}${item}`,
        (gltf) => {
            // Modify scene as needed
            gltf.scene.scale.set(0.1, 0.1, 0.1)

            for (let i = 0; i < gltf.scene.children.length; i++) {
                gltf.scene.children[i].castShadow = true
                gltf.scene.children[i].receiveShadow = true

                if (gltf.scene.children[i].children.length > 0) {
                    for (let k = 0; k < gltf.scene.children[i].children.length; k++) {
                        gltf.scene.children[i].children[k].castShadow = true
                        gltf.scene.children[i].children[k].receiveShadow = true
                    }
                }
            }

            // Add scene
            mainGroup.add(gltf.scene)
        },
        (progress) => {
            // console.log(progress)
        },
        (error) => {
            console.log(error)
        }

    )
})

/**
 * TRANSLATIONS
 */
mainGroup.position.x = -0.2
scene.add(mainGroup)

// Animate 
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()

    renderer.render(scene, camera)
    console.log(camera.position)

    window.requestAnimationFrame(tick)
}

tick()

// Save frame 
const imageData = renderer.domElement.toDataURL().replace('image/png', 'image/octet-stream')

const link = document.createElement('a')
link.download = 'frame.jpg'
link.href = imageData
link.click()
setTimeout(() => {
    window.close()
}, 5000)
