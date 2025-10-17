import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xd8bfd8); // Light Purple
scene.background = new THREE.Color(0xc59fc5); // Light Purple
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

let modelsLoaded = 0;
const totalModelsToLoad = 3; // House1F, HouseRoof, House2F
let houseRoofModel = null;
let house2FModel = null;
let isRoofHidden = false;
let isSecondFloorHidden = false;

const Gravity = 30;
const Capsule_Radius =  .3;
const Capsule_Height = 1;
const Jump_Height = 0;
const Move_Speed = 3;

let FoxBotModel = null;
let foxBotBaseY = null;
let TankHeadModel = null;
let tankHeadSwingAngle = 0;
let tankHeadSwingDirection = 1;
const tankHeadSwingSpeed = 1;
const tankHeadMaxSwingAngle = 30;

let foxbot = {
  instance: null,
  isMoving: false,
  spawnPosition: new THREE.Vector3(),
}
// let targetRotation = Math.PI / 2;
let targetRotation = 0;


const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, Capsule_Radius, 0),
  new THREE.Vector3(0, Capsule_Height, 0),
  Capsule_Radius
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1.5;

const modalContent = {
  "ClickMe":{
    title: "Control Keys",
    content: " w = move forward <br> s = move backward <br> a = move left <br> d = move right <br> r = respawn <br> left-click = for direction",
    // link: "https://www.linkedin.com/in/mark-johnson-panelo-82030a325/",
  },
}

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDesription = document.querySelector(".modal-project-description");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button");


// Show the modal with my Linked in when "ProjectMario" is clicked
function showModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    // modalProjectDesription.textContent = content.content;
    modalProjectDesription.innerHTML = content.content.replace(/\n/g, "<br>");


    if(content.link) {
      modalVisitProjectButton.href = content.link;
      modalVisitProjectButton.classList.remove("hidden");
    } else {
      modalVisitProjectButton.classList.add("hidden");
    }
    modal.classList.toggle("hidden");
  }
}


function hideModal() {
  modal.classList.toggle("hidden");
}

let intersectObject = ""
const intersectObjects = [];
const intersectObjectsNames = [
  "Switch2F",
  "SwitchB1",
  "SwitchB2",
  "SwitchHW",
  "SwitchST",
  "SwitchMB",
  "SwitchLR",
  "ClickMe",
];


// ------Loading Screen Script------
let touchHappened = false;
let isModalOpen = true;

// Create loading manager and connect it to the loader
const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager); // Connect manager to loader

const loadingScreen = document.getElementById("loadingScreen");
const loadingScreenButton = document.querySelector(".loading-screen-button");

// Define background music variable (add your audio file)
let backgroundMusic = null;
// Uncomment and configure when you have audio:
// backgroundMusic = new Audio('path/to/your/audio.mp3');
// backgroundMusic.loop = true;

manager.onLoad = function () {
  console.log("All resources loaded");
  
  setTimeout(() => {
    if (loadingScreenButton) {
      loadingScreenButton.style.border = "8px solid #e6dede";
      loadingScreenButton.style.background = "#8f44a2";
      loadingScreenButton.style.color = "#e6dede";
      loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
      loadingScreenButton.textContent = " Enter! ";
      loadingScreenButton.style.cursor = "pointer";
      loadingScreenButton.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    }
  }, 1000); // Reduced from 3000ms for faster feedback
  
  let isDisabled = false;

  function handleEnter() {
    if (isDisabled || !loadingScreenButton) return;

    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = "8px solid #e6dede";
    loadingScreenButton.style.background = "#8f44a2";
    loadingScreenButton.style.color = "#e6dede";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "~ Terve ~";
    if (loadingScreen) {
      loadingScreen.style.background = "#8f44a2";
    }
    isDisabled = true;

    toggleFavicons();
    
    // Play background music if available
    if (backgroundMusic) {
      backgroundMusic.play().catch(e => {
        console.log("Background music play failed:", e);
      });
    }
    
    playReveal();
  }

  // Add event listeners only if elements exist
  if (loadingScreenButton) {
    loadingScreenButton.addEventListener("mouseenter", () => {
      loadingScreenButton.style.transform = "scale(1.3)";
    });

    loadingScreenButton.addEventListener("touchend", (e) => {
      touchHappened = true;
      e.preventDefault();
      handleEnter();
    });

    loadingScreenButton.addEventListener("click", (e) => {
      if (touchHappened) return;
      handleEnter();
    });

    loadingScreenButton.addEventListener("mouseleave", () => {
      loadingScreenButton.style.transform = "none";
    });
  }
};

// Add error handling for the loading manager
manager.onError = function (url) {
  console.error('Error loading:', url);
};

function toggleFavicons() {
    console.log("Favicon toggled");
}

function playIntroAnimation() {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.style.display = "block";
    }
    console.log("Intro animation played");
}

function playReveal() {
  if (!loadingScreen) return;
  
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "-200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-70deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModalOpen = false;
        playIntroAnimation();
        if (loadingScreen) {
          loadingScreen.remove();
        }
      },
    },
    "-=0.1"
  );
}

// ------ Model Loader ------
loader.load( "./House1F.glb", function ( glb ) {
  glb.scene.traverse( function ( child ) {
    if (intersectObjectsNames.includes(child.name)) {
      intersectObjects.push(child);
    }
    if ( child.isMesh ) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
    if(child.name === "FoxBot"){
      foxbot.spawnPosition.copy(child.position);
      foxbot.instance = child;
      playerCollider.start.copy(child.position).add(new THREE.Vector3(0, Capsule_Radius, 0));
      playerCollider.end.copy(child.position).add(new THREE.Vector3(0, Capsule_Height, 0));
      FoxBotModel = child;
      foxBotBaseY = FoxBotModel.position.y;
    }
    if (child.name === "TankHead") {
      TankHeadModel = child;
    }
    if(child.name === "Collider1"){
      colliderOctree.fromGraphNode(child);
      child.visible = false;
    }
  } );

  scene.add( glb.scene );
  modelsLoaded++;
  checkAllModelsLoaded();
}, undefined, function ( error ) {
  console.error( error );
  modelsLoaded++;
  checkAllModelsLoaded();
} );


loader.load('./HouseRoof.glb', function(gltf) {
  houseRoofModel = gltf.scene;
  houseRoofModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(houseRoofModel);
  modelsLoaded++;
  checkAllModelsLoaded();
});

loader.load('./House2F.glb', function(gltf) {
  house2FModel = gltf.scene;
  house2FModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
    if(child.name === "Collider2"){
      colliderOctree.fromGraphNode(child);
      child.visible = false;
    }
  });
  scene.add(house2FModel);
  modelsLoaded++;
  checkAllModelsLoaded();
});

const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
sun.position.set( -30, 80, 75 );
sun.target.position.set( 0, 0, 0 );
sun.shadow.mapSize.width = 4096; // default
sun.shadow.mapSize.height = 4096; // default
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.normalBias = 0.2;
scene.add( sun );

const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
scene.add( light );


const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000 );
camera.position.set(-20, 5, 25); // <-- Initial / Start position (X, Y, Z)
camera.lookAt(0, 2, 0); // <-- Where the camera is pointing (X, Y, Z)

const controls = new OrbitControls( camera, canvas );
controls.target.set(0, 1.5, 0);
controls.update();


// Light for the house
// const lightIntensity = 300;
const lightWidth = 0.28;
const lightHeight = 0.28;

// Array of light positions and intensities
const lightConfigurations = [
  // First floor lights
  // LivingRoom
  { position: [-.82, 3.85, 2.81], intensity: 300 },
  { position: [-3.62, 3.85, 2.81], intensity: 300 },
  // hallway
  { position: [-0.32, 3.85, 0], intensity: 300 },
  { position: [-3.95, 3.85, 0], intensity: 400 },
  // bedroom1
  { position: [-3.91, 3.85, -2.88], intensity: 300 },
  // bedroom2
  { position: [-0.24, 3.85, -2.88], intensity: 300 },
  // Master bedroom
  { position: [3.71, 3.85, -1], intensity: 300 },
  { position: [3.71, 3.85, -3], intensity: 300 },
  // stairs
  { position: [3.77, 5.63, 2.79], intensity: 300 },
  // Second floor lights 1
  { position: [0, 6.51, 0], intensity: 300 },
];

// Function to create a rect light with helper
function createRectLight(position, intensity = 300) {
  const rectLight = new THREE.RectAreaLight(0xffffff, intensity, lightWidth, lightHeight);
  rectLight.position.set(position[0], position[1], position[2]);
  rectLight.lookAt(position[0], 0, position[2]);
  scene.add(rectLight);
  lightConfigurations.visible = false; // Hide the light source representation
  
  // const rectLightHelper = new RectAreaLightHelper(rectLight);
  // scene.add(rectLightHelper);
  
  return rectLight;
}

// Create all lights
const rectLights = [];
lightConfigurations.forEach((config, index) => {
  const light = createRectLight(config.position, config.intensity);
  rectLights.push(light);
  // You can access individual lights as rectLights[0], rectLights[1], etc.
});

// If you need to reference specific lights later, you can store them by index
// or create a named object:
const namedLights = {
  rectLight1: rectLights[0],
  rectLight2: rectLights[1],
  // hallway
  rectLight3: rectLights[2],
  rectLight4: rectLights[3],
  // br1
  rectLight5: rectLights[4],
  // br2
  rectLight6: rectLights[5],
  // mbr
  rectLight7: rectLights[6],
  rectLight8: rectLights[7],
  // stairs
  rectLight9: rectLights[8],
  // 2f1
  rectLight10: rectLights[9],

};


function onResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize( sizes.width, sizes.height );
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2));
}

function jumpFoxBot(meshID) {
  const mesh = scene.getObjectByName(meshID);
  if (!mesh) return;

  const jumpHeight = 1;
  const jumpDuration = 1;

  const startY = mesh.position.y; // <- SAVE the original Y

  const t1 = gsap.timeline();

  t1.to(mesh.scale, {
    x: 3,
    y: 0.8,
    z: 1.2,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(mesh.position, {
    y: startY + jumpHeight,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  }, "<");

  t1.to(mesh.position, {
    y: startY, // <- use the saved Y
    duration: jumpDuration * 0.5,
    ease: "bounce.out",
  });

  t1.to(mesh.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: jumpDuration * 0.5,
    ease: "elastic.out(1, 0.3)",
  });
}


// Function for toggling the Switches
function onClick() {
  if(intersectObject !== ""){
    if(["ChickenBrown","ChickenWhite","Pig", "Kid", "House"].includes(intersectObject)){
      jumpFoxBot(intersectObject);
    } else if (intersectObject === "SwitchLR") {
      // Toggle lights for SwitchLR
      toggleLRLights();
    } else if (intersectObject === "SwitchHW") {
      // Toggle lights for SwitchHW
      toggleHWLights();
    } else if (intersectObject === "SwitchB1") {
      // Toggle lights for SwitchB1
      toggleB1Lights();
    } else if (intersectObject === "SwitchB2") {
      // Toggle lights for SwitchB2
      toggleB2Lights();
    } else if (intersectObject === "SwitchMB") {
      // Toggle lights for SwitchMB
      toggleMBLights();
    } else if (intersectObject === "SwitchST") {
      // Toggle lights for SwitchST
      toggleSTLights();
    } else if (intersectObject === "Switch2F") {
      // Toggle lights for Switch2F
      toggle2FLights();
    // } else if (intersectObject === "ClickMe") {
    //   // Toggle lights for ClickMe
    //   toggleClickMeLights();
    } else {
      showModal(intersectObject);
    }
  }
}

function toggleLRLights() {
  if (namedLights.rectLight1 && namedLights.rectLight2) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight1.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight1, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
    gsap.to(namedLights.rectLight2, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
    console.log(`LR Lights toggled to intensity: ${newIntensity}`);
  } else {
    console.warn("LR lights not found in namedLights");
  }
}
function toggleHWLights() {
  if (namedLights.rectLight3 && namedLights.rectLight4) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight3.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight3, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
    gsap.to(namedLights.rectLight4, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });

  }
}
function toggleMBLights() {
  if (namedLights.rectLight7 && namedLights.rectLight8) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight7.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight7, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
    gsap.to(namedLights.rectLight8, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });

  }
}
function toggleB1Lights() {
  if (namedLights.rectLight5) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight5.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight5, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
  }
}
function toggleB2Lights() {
  if (namedLights.rectLight6) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight6.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight6, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
  }
}
function toggleSTLights() {
  if (namedLights.rectLight9) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight9.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight9, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
  }
}
function toggle2FLights() {
  if (namedLights.rectLight10) {
    // Check current intensity to determine toggle direction
    const currentIntensity = namedLights.rectLight10.intensity;
    const newIntensity = currentIntensity > 0 ? 0 : 300;
    
    // Animate the intensity change for both lights
    gsap.to(namedLights.rectLight10, {
      intensity: newIntensity,
      duration: 0.5,
      ease: "power2.inOut"
    });
    
  }
}

function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function respawnFoxBot() {
  if(!foxbot.instance) return;

  foxbot.instance.position.copy(foxbot.spawnPosition);

  playerCollider.start.copy(foxbot.spawnPosition).add(new THREE.Vector3(0, Capsule_Radius, 0));
  playerCollider.end.copy(foxbot.spawnPosition).add(new THREE.Vector3(0, Capsule_Height, 0));

  playerVelocity.set(0, 0, 0);
  foxbot.isMoving = false;

    // Ensure FoxBot is visible if not in first-person mode
    if (!isFirstPersonMode) {
        foxbot.instance.visible = true;
    }
}

function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(playerCollider);
  playerOnFloor = false;

  if(result) {
    playerOnFloor = result.normal.y > 0;
    playerCollider.translate(result.normal.multiplyScalar(result.depth));

    if(playerOnFloor) {
      foxbot.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
      // playerVelocity.y = 0;
    }
  }
}

function updatePlayer() {
  if(!foxbot.instance) return;

  if(foxbot.instance.position.y < -20){
    respawnFoxBot();
    return;
  }

  if(!playerOnFloor){
    playerVelocity.y -= Gravity * 0.035;
  }
  playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035));

  playerCollisions();


  foxbot.instance.position.copy(playerCollider.start);
  foxbot.instance.position.y -= Capsule_Radius;

  let rotationDiff = 
  ((((targetRotation - foxbot.instance.rotation.y) % (2 * Math.PI)) + (3 * Math.PI)) % (2 * Math.PI)) - Math.PI;
  let finalRotation = foxbot.instance.rotation.y + rotationDiff;

  foxbot.instance.rotation.y = THREE.MathUtils.lerp(foxbot.instance.rotation.y, finalRotation, 0.4);
}

// Handle keyboard input
function onKeyDown(event) {
    // Only process movement keys if in first-person mode
    if (!isFirstPersonMode) {
        return;
    }

  if(event.key.toLowerCase() === "r"){
    respawnFoxBot();
    return;
  }

  if(foxbot.isMoving) return;

  switch(event.key.toLowerCase()){
    case "s":
      // Move backward relative to FoxBot's facing direction
      const backwardDirection = new THREE.Vector3(
        Math.sin(foxbot.instance.rotation.y),
        0,
        Math.cos(foxbot.instance.rotation.y)
      );
      playerVelocity.x += backwardDirection.x * Move_Speed;
      playerVelocity.z += backwardDirection.z * Move_Speed;
      playerVelocity.y = Jump_Height;
      foxbot.isMoving = true;
      break;
    case "w":
      // Move forward relative to FoxBot's facing direction
      const forwardDirection = new THREE.Vector3(
        -Math.sin(foxbot.instance.rotation.y),
        0,
        -Math.cos(foxbot.instance.rotation.y),
      );
      playerVelocity.x += forwardDirection.x * Move_Speed;
      playerVelocity.z += forwardDirection.z * Move_Speed;
      playerVelocity.y = Jump_Height;
      foxbot.isMoving = true;
      break;
    case "d":
      // Move right (strafe) relative to FoxBot's facing direction
      const rightDirection = new THREE.Vector3(
        Math.cos(foxbot.instance.rotation.y), // Use cosine for right direction
        0,
        -Math.sin(foxbot.instance.rotation.y) // Use negative sine for right direction
      );
      playerVelocity.x += rightDirection.x * Move_Speed;
      playerVelocity.z += rightDirection.z * Move_Speed;
      playerVelocity.y = Jump_Height;
      foxbot.isMoving = true;
      break;
    case "a":
      // Move left (strafe) relative to FoxBot's facing direction
      const leftDirection = new THREE.Vector3(
        -Math.cos(foxbot.instance.rotation.y), // Use negative cosine for left direction
        0,
        Math.sin(foxbot.instance.rotation.y) // Use sine for left direction
      );
      playerVelocity.x += leftDirection.x * Move_Speed;
      playerVelocity.z += leftDirection.z * Move_Speed;
      playerVelocity.y = Jump_Height;
      foxbot.isMoving = true;
      break;
    default:
      break;
  }
}

modalExitButton.addEventListener("click", hideModal);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeyDown);

// 3D and 2D View Toggle
const threeDToggleButton = document.getElementById('threeDToggleButton');
let is3DMode = true;

// Add this function to handle the 2D/3D toggle
function toggleViewMode() {
    is3DMode = !is3DMode;

    threeDToggleButton.textContent = is3DMode ? '3D' : '2D';

    if (is3DMode) {
        // Switch to 3D mode
        // camera.position.set(-15, 10, 30);
        camera.lookAt(0, 7, 0);
        threeDToggleButton.style.backgroundColor = '#8f44a2';
    } else {
        // Switch to 2D mode (top-down view)
        // camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        threeDToggleButton.style.backgroundColor = '#717dad';
    }
    
    // Update controls target
    controls.target.set(0, is3DMode ? 1.5 : 0, 0);
    controls.update();
}

// Add event listeners for the 2D/3D buttons
threeDToggleButton.addEventListener('click', function() {
    // playButtonSound();
    toggleViewMode();
});


function checkAllModelsLoaded() {
  if (modelsLoaded >= totalModelsToLoad) {
    console.log("All models loaded, setting up arrow buttons");
    // Small delay to ensure DOM is ready
    setTimeout(setupArrowButtonListeners, 100);
  }
}

// arrowUP and arrowDown
// arrowUP and arrowDown
function setupArrowButtonListeners() {
  const arrowDownButton = document.getElementById('arrowDownToggleButton');
  const arrowUpButton = document.getElementById('arrowUpToggleButton');
  
  if (!arrowDownButton || !arrowUpButton) {
    console.error("Arrow buttons not found in DOM");
    return;
  }
  
  arrowDownButton.addEventListener('click', () => {
    // playButtonSound();

    if (!isRoofHidden && !isSecondFloorHidden) {
      // First click: Hide the roof
      if (houseRoofModel) {
        houseRoofModel.visible = false;
        isRoofHidden = true;
        console.log("Roof hidden");
      }
    } else if (isRoofHidden && !isSecondFloorHidden) {
      // Second click: Hide the second floor
      if (house2FModel) {
        house2FModel.visible = false;
        isSecondFloorHidden = true;
        // // Safely handle lights if they exist
        if (namedLights.rectLight10) namedLights.rectLight10.visible = false;
        // console.log("Second floor hidden");
      }
    } else if (isRoofHidden && isSecondFloorHidden) {

    }
  });
  
  arrowUpButton.addEventListener('click', () => {
    // playButtonSound();

    if (isSecondFloorHidden && isRoofHidden) {
      // Show second floor first
      if (house2FModel) {
        house2FModel.visible = true;
        isSecondFloorHidden = false;
        if (namedLights.rectLight10) namedLights.rectLight10.visible = true;
        // console.log("Second floor shown");
      }
    } else if (!isSecondFloorHidden && isRoofHidden) {
      // Show roof
      if (houseRoofModel) {
        houseRoofModel.visible = true;
        isRoofHidden = false;
        console.log("Roof shown");
      }
    } else {

    }
  });
}

// First-person camera variables
let isFirstPersonMode = false;
let originalCameraPosition = new THREE.Vector3();
let originalControlsState = {
    target: new THREE.Vector3(),
    minDistance: 0,
    maxDistance: 0,
    minPolarAngle: 0,
    maxPolarAngle: 0,
    enabled: true
};

// Mouse movement variables for first-person camera
let isMouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;
let mouseSensitivity = 0.002;
let verticalLookAngle = Math.PI / 12; // Start looking slightly up (15 degrees)
const maxVerticalAngle = Math.PI / 3; // Limit vertical look to 60 degrees up/down

// Get the first-person camera button
const firstPerCamButton = document.getElementById('firstPerCamButton');

// Function to toggle first-person camera
function toggleFirstPersonCamera() {
    if (!foxbot.instance) return;
    
    isFirstPersonMode = !isFirstPersonMode;
    
    if (isFirstPersonMode) {
        // Save original camera state
        originalCameraPosition.copy(camera.position);
        originalControlsState.target.copy(controls.target);
        originalControlsState.minDistance = controls.minDistance;
        originalControlsState.maxDistance = controls.maxDistance;
        originalControlsState.minPolarAngle = controls.minPolarAngle;
        originalControlsState.maxPolarAngle = controls.maxPolarAngle;
        originalControlsState.enabled = controls.enabled;

        // Disable orbit controls temporarily
        controls.enabled = false;

        // Hide FoxBot in first-person mode
        foxbot.instance.visible = false;
        
        // Enable first-person mode
        enableFirstPersonCamera();
        firstPerCamButton.style.backgroundColor = '#717dad';
        // Add mouse event listeners for first-person rotation
        canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

    } else {
        // Show FoxBot when returning to third-person mode
        foxbot.instance.visible = true;

        // Restore original camera state
        disableFirstPersonCamera();
        firstPerCamButton.style.backgroundColor = '#8f44a2';
        // Remove mouse event listeners
        canvas.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

    }
}

// Mouse event handlers for first-person rotation
function onMouseDown(event) {
    if (isFirstPersonMode && event.button === 0) { // Left click only
        isMouseDown = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
        canvas.style.cursor = 'grabbing';
    }
}

function onMouseMove(event) {
    if (isFirstPersonMode && isMouseDown && foxbot.instance) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
        
        // Rotate FoxBot based on horizontal mouse movement
        const rotationDelta = -deltaX * mouseSensitivity;
        targetRotation += rotationDelta;
        
        // Update vertical look angle based on vertical mouse movement
        verticalLookAngle -= deltaY * mouseSensitivity;
        // Clamp vertical look angle to prevent over-rotation
        verticalLookAngle = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, verticalLookAngle));
        
        // Update FoxBot rotation (only horizontal)
        foxbot.instance.rotation.y = targetRotation;
        
        // Immediately update camera to look in the new direction with vertical offset
        updateCameraLookDirection();
    }
}

// Helper function to update camera look direction
function updateCameraLookDirection() {
    const headPosition = new THREE.Vector3();
    headPosition.copy(playerCollider.end);
    headPosition.y += 0.5; // Add 50cm height offset to match camera position
    
    const lookDistance = 0.2; // Increased distance for better visibility
    
    // Calculate forward direction with vertical angle
    const forwardDirection = new THREE.Vector3(
        -Math.sin(targetRotation) * Math.cos(verticalLookAngle),
        Math.sin(verticalLookAngle),
        -Math.cos(targetRotation) * Math.cos(verticalLookAngle)
    );
    
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(headPosition);
    targetPosition.add(forwardDirection.multiplyScalar(lookDistance));
    
    camera.lookAt(targetPosition);
    controls.target.copy(targetPosition);
    controls.update();
}

function onMouseUp() {
    if (isFirstPersonMode) {
        isMouseDown = false;
        canvas.style.cursor = 'crosshair';
    }
}

// Function to enable first-person camera
function enableFirstPersonCamera() {
    if (!foxbot.instance) return;
    
    // Set initial vertical look angle to look up (15 degrees)
    verticalLookAngle = 0;
    
    // Position camera at FoxBot's head (top of the capsule)
    const headPosition = new THREE.Vector3();
    headPosition.copy(playerCollider.end);
    headPosition.y += 0.5; // Add 50cm height offset
    
    camera.position.copy(headPosition);
    
    // Set initial look direction (looking up)
    updateCameraLookDirection();
    
    // Adjust control constraints for first-person
    controls.minDistance = 0.1;
    controls.maxDistance = 0.1;
    controls.minPolarAngle = THREE.MathUtils.degToRad(-40); // Allow more downward look
    controls.maxPolarAngle = THREE.MathUtils.degToRad(110);  // Allow more upward look
    
    // Set cursor for first-person mode
    canvas.style.cursor = 'crosshair';
    
    controls.update();
}


// Function to disable first-person camera
function disableFirstPersonCamera() {
    // Make sure FoxBot is visible when exiting first-person mode
    if (foxbot.instance) {
        foxbot.instance.visible = true;
    }

    // Re-enable orbit controls
    controls.enabled = originalControlsState.enabled;
    
    // Restore camera position
    camera.position.copy(originalCameraPosition);
    
    // Restore control constraints
    controls.target.copy(originalControlsState.target);
    controls.minDistance = originalControlsState.minDistance;
    controls.maxDistance = originalControlsState.maxDistance;
    controls.minPolarAngle = originalControlsState.minPolarAngle;
    controls.maxPolarAngle = originalControlsState.maxPolarAngle;
    
    // Reset vertical look angle
    verticalLookAngle = Math.PI / 12;
    
    // Restore cursor
    canvas.style.cursor = 'default';
    
    controls.update();
}

// Function to update first-person camera during animation
function updateFirstPersonCamera() {
    if (isFirstPersonMode && foxbot.instance) {
        // Update camera position to follow FoxBot's head
        const headPosition = new THREE.Vector3();
        headPosition.copy(playerCollider.end);
        headPosition.y += 0.5; // Add 50cm height offset
        
        camera.position.copy(headPosition);
        
        // Update look direction maintaining current vertical angle
        updateCameraLookDirection();
    }
}

// Add event listeners for camera buttons
firstPerCamButton.addEventListener('click', function() {
    toggleFirstPersonCamera();
});

// Prevent context menu on right-click in first-person mode
canvas.addEventListener('contextmenu', function(event) {
    if (isFirstPersonMode) {
        event.preventDefault();
    }
});

// function animate() {
//   updatePlayer();
//   updateFirstPersonCamera();

//     // View Controls - Only apply these if not in first-person mode
//     if (!isFirstPersonMode) {
//         if (is3DMode) {
//             controls.maxDistance = 35;
//             controls.minDistance = 3;
//             controls.minPolarAngle = THREE.MathUtils.degToRad(35);
//             controls.maxPolarAngle = THREE.MathUtils.degToRad(60);
//         } else {
//             // 2D mode restrictions - limit movement for top-down view
//             controls.maxDistance = 35;
//             controls.minDistance = 10;
//             controls.minPolarAngle = THREE.MathUtils.degToRad(0);
//             controls.maxPolarAngle = THREE.MathUtils.degToRad(0);
//         }

//         controls.enableDamping = true;
//         controls.dampingFactor = 0.05;

//         if (controls.target.x > 5) controls.target.x = 5;
//         if (controls.target.x < -4.5) controls.target.x = -4.5;
//         if (controls.target.z > 5) controls.target.z = 5;
//         if (controls.target.z < -4.5) controls.target.z = -4.5;
//         if (controls.target.y > 8) controls.target.y = 8;
//         if (controls.target.y < 2) controls.target.y = 2;
//     }


//   controls.update();

//     // FoxBot bounce animation
//     if (FoxBotModel && FoxBotModel.visible && foxBotBaseY !== null) {
//         const bounceHeight = 0.1;
//         const bounceSpeed = 5;
//         const time = Date.now() * 0.001;
//         foxBotBaseY = FoxBotModel.position.y;
//         FoxBotModel.position.y = foxBotBaseY + Math.abs(Math.sin(time * bounceSpeed)) * bounceHeight;
//     }

//     // Tank Head swing animation
//     if (TankHeadModel && TankHeadModel.visible) {
//         const deltaTime = 0.2;
//         tankHeadSwingAngle += tankHeadSwingDirection * tankHeadSwingSpeed * deltaTime;
        
//         if (tankHeadSwingAngle >= tankHeadMaxSwingAngle || tankHeadSwingAngle <= -tankHeadMaxSwingAngle) {
//             tankHeadSwingDirection *= -1;
//             tankHeadSwingAngle = Math.max(-tankHeadMaxSwingAngle, Math.min(tankHeadMaxSwingAngle, tankHeadSwingAngle));
//         }
        
//         TankHeadModel.rotation.y = THREE.MathUtils.degToRad(tankHeadSwingAngle);
//     }

  

//   raycaster.setFromCamera( pointer, camera );

// 	const intersects = raycaster.intersectObjects( intersectObjects );

//   if (intersects.length > 0) {
//     document.body.style.cursor = "pointer";
//   }else{
//     document.body.style.cursor = "default";
//     intersectObject = "";
//   }

// 	for ( let i = 0; i < intersects.length; i ++ ) {
//     // console.log(intersects[0].object.parent.name);
//     intersectObject = intersects[0].object.parent.name
// 	}

//     // console.log(camera.position);

//     renderer.render( scene, camera );
// }
function animate() {
  updatePlayer();
  updateFirstPersonCamera();

    // View Controls - Only apply these if not in first-person mode
    if (!isFirstPersonMode) {
        if (is3DMode) {
            controls.maxDistance = 35;
            controls.minDistance = 3;
            controls.minPolarAngle = THREE.MathUtils.degToRad(35);
            controls.maxPolarAngle = THREE.MathUtils.degToRad(60);
        } else {
            // 2D mode restrictions - limit movement for top-down view
            controls.maxDistance = 35;
            controls.minDistance = 10;
            controls.minPolarAngle = THREE.MathUtils.degToRad(0);
            controls.maxPolarAngle = THREE.MathUtils.degToRad(0);
        }

        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        if (controls.target.x > 5) controls.target.x = 5;
        if (controls.target.x < -4.5) controls.target.x = -4.5;
        if (controls.target.z > 5) controls.target.z = 5;
        if (controls.target.z < -4.5) controls.target.z = -4.5;
        if (controls.target.y > 8) controls.target.y = 8;
        if (controls.target.y < 2) controls.target.y = 2;
    }


  controls.update();

    // FoxBot bounce animation
    if (FoxBotModel && FoxBotModel.visible && foxBotBaseY !== null) {
        const bounceHeight = 0.1;
        const bounceSpeed = 5;
        const time = Date.now() * 0.001;
        foxBotBaseY = FoxBotModel.position.y;
        FoxBotModel.position.y = foxBotBaseY + Math.abs(Math.sin(time * bounceSpeed)) * bounceHeight;
    }

    // Tank Head swing animation
    if (TankHeadModel && TankHeadModel.visible) {
        const deltaTime = 0.2;
        tankHeadSwingAngle += tankHeadSwingDirection * tankHeadSwingSpeed * deltaTime;
        
        if (tankHeadSwingAngle >= tankHeadMaxSwingAngle || tankHeadSwingAngle <= -tankHeadMaxSwingAngle) {
            tankHeadSwingDirection *= -1;
            tankHeadSwingAngle = Math.max(-tankHeadMaxSwingAngle, Math.min(tankHeadMaxSwingAngle, tankHeadSwingAngle));
        }
        
        TankHeadModel.rotation.y = THREE.MathUtils.degToRad(tankHeadSwingAngle);
    }

  

  raycaster.setFromCamera( pointer, camera );

	const intersects = raycaster.intersectObjects( intersectObjects );

  // Handle cursor changes for both first-person and third-person modes
  if (intersects.length > 0) {
    // Check if we're intersecting with a switch object
    const isSwitchObject = ["SwitchLR", "SwitchHW", "SwitchST", "SwitchB1", "SwitchB2", "SwitchMB", "Switch2F", "ClickMe"].includes(intersects[0].object.parent.name);
    
    if (isFirstPersonMode) {
      // In first-person mode, only show pointer for switches, otherwise keep crosshair
      if (isSwitchObject) {
        canvas.style.cursor = 'pointer';
      } else {
        // Only set to crosshair if not currently grabbing
        if (!isMouseDown) {
          canvas.style.cursor = 'crosshair';
        }
      }
    } else {
      // In third-person mode, use default pointer behavior
      document.body.style.cursor = "pointer";
    }
    intersectObject = intersects[0].object.parent.name;
  } else {
    // No intersections
    if (isFirstPersonMode) {
      // Only set to crosshair if not currently grabbing
      if (!isMouseDown) {
        canvas.style.cursor = 'crosshair';
      }
    } else {
      document.body.style.cursor = "default";
    }
    intersectObject = "";
  }

	for ( let i = 0; i < intersects.length; i ++ ) {
    // console.log(intersects[0].object.parent.name);
    intersectObject = intersects[0].object.parent.name
	}

    // console.log(camera.position);

    renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );

// Codes for Display of Date and Weather
// Weather API configuration
const weatherHeaders = {
    'Content-Type': 'application/json'
};

// Format the current date
function formatDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

// Update the date display
document.getElementById('current-date').textContent = formatDate();

async function getWeather() {
    try {
        // Use the full backend URL instead of relative path
        const response = await fetch("https://valk-huone-1.onrender.com/api/weather");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error('Weather fetch error:', error);
        displayError('Failed to load weather data. Please try again later.');
    }
}

function displayWeather(data) {
    const weatherContent = document.getElementById('weather-content');
            
    // Extract the relevant data from the response
    const condition = data.current.condition.text;
    const iconUrl = "https:" + data.current.condition.icon; // Add https: to make it a valid URL
    const temperature = Math.round(data.current.temp_c); // Temperature in Celsius
    const humidity = data.current.humidity;
    const windSpeed = data.current.wind_kph;
    const feelsLike = Math.round(data.current.feelslike_c);
            
    // Create the weather display HTML
    weatherContent.innerHTML = `
        <img src="${iconUrl}" alt="${condition}" class="weather-icon">
        <div id="outer-temperature" class="temperature">${temperature}°C</div>
        <div class="condition">${condition}</div>
        <div class="details">
            <div class="detail-item">
                <div class="detail-label">Humidity</div>
                <div id="outer-humidity" class="detail-value">${humidity}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Wind</div>
                <div id="outer-wind-speed" class="detail-value">${windSpeed} km/h</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Feels Like</div>
                <div id="outer-feels-like" class="detail-value">${feelsLike}°C</div>
            </div>
        </div>
    `;
}

function displayError(message) {
    const weatherContent = document.getElementById('weather-content');
    weatherContent.innerHTML = `
        <div class="error">
            <p>Failed to load weather data</p>
            
            <p>Try again later.</p>
        </div>
    `;
}

// Fetch weather data when page loads
getWeather();

// ------ Theme codes ------
const themeToggleButton = document.querySelector(".theme-mode-toggle-button");
const firstIcon = document.querySelector(".first-icon");
const secondIcon = document.querySelector(".second-icon");

let isBright = true;

// Toggle Theme Function
function toggleTheme() {
  isBright = !isBright;

  const isDarkTheme = document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");

  if (firstIcon.style.display === "none") {
    firstIcon.style.display = "block";
    secondIcon.style.display = "none";
  } else {
    firstIcon.style.display = "none";
    secondIcon.style.display = "block";
  }

  gsap.to(light.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.31,
    // b: isDarkTheme ? 1.0 : 0.78,
    b: isDarkTheme ? 1.0 : 0.48,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(light, {
    intensity: isDarkTheme ? 0.8 : 0.9,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun, {
    intensity: isDarkTheme ? 1 : 0.8,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.21,
    // b: isDarkTheme ? 1.0 : 0.88,
    b: isDarkTheme ? 1.0 : 0.28,
    duration: 1,
    ease: "power2.inOut",
  });

  renderer.setClearColor(isBright ? 0xeeeeee : 0x111111, 1);

}

// Theme toggle button
themeToggleButton.addEventListener("click", function() {
    // playButtonSound();
    toggleTheme();
});