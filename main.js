// alert("hello world");
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


let modelsLoaded = 0;
const totalModelsToLoad = 3;

let houseRoofModel = null;
let house2FModel = null;
let isRoofHidden = false;
let isSecondFloorHidden = false;

let buttonSound = null;
let isAudioLoaded = false;


let hoveredObject = null;
const hoverScaleFactor = 1.2; // How much to scale up on hover
const hoverAnimationDuration = 0.3; // Duration of the scale animation

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min( window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const modalContent = {
    DashPartners: {
        title: "Contact Person",
        content: "Mark Johnson Panelo is a CIC program master's student at Metropolia University of Applied Sciences. He is currently working on the Digital Twin project for the UrbanFarmLab. <br>NOTE: For more information about Mark, visit the link above.",
        link:"https://www.linkedin.com/in/mark-johnson-panelo-82030a325",
        image: "meCartoon.jpg",
    },
    DashAbout: {
        title: "Strawberry Room",
        content: "This is Strawberry Room, the Digital Twin of Metropolia's UrbanFarmLab. A dynamic virtual representation that mirror physical form, condition and events inside the Lab. For more information about the UrbanFarmLab, visit the link above.",
        link:"https://www.metropolia.fi/en/rdi/collaboration-platforms/urbanfarmlab",
        image: "Teacher.jpg",
    },
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(".modal-project-description");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitButton = document.querySelector(".modal-visit-button");

function showModal(id) {
    const content = modalContent[id];
    if (content) {
        if (content.isCamera) {
            cameraToggleButton.click();
        } else {
            modalTitle.textContent = content.title;
            modalProjectDescription.innerHTML = content.content;

            // Remove any existing image container first
            const existingImage = document.querySelector('.modal-image-container');
            if (existingImage) existingImage.remove();

            // Only add new image if one is specified
            if (content.image) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'modal-image-container';
                imageContainer.innerHTML = `
                    <img src="${content.image}" alt="${content.title}" 
                         style="max-width: 500px; width: 100%; margin: 0 auto 20px; display: block;">
                `;
                
                // Insert the image before the description
                modalProjectDescription.parentNode.insertBefore(
                    imageContainer, 
                    modalProjectDescription
                );
            }

            if (content.link) {
                modalVisitButton.href = content.link;
                modalVisitButton.classList.remove("hidden");
            } else {
                modalVisitButton.classList.add("hidden");
            }

            modal.classList.toggle("hidden");
        }
    }
}

function hideModal(){
    modal.classList.toggle("hidden");
}

let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
    // "AirCon",
    // "Screen",
    "DashPartners",
    "DashAbout",
    // "Thermometer",
    "StrawBerries1",
    "StrawBerries2",
    "StrawBerries3",
];

// Loading screen and loading manager
const loadingScreen = document.getElementById("loadingScreen");
const enterButton = document.querySelector(".enter-button");

const manager = new THREE.LoadingManager();

manager.onLoad = function () {
  const t1 = gsap.timeline();

  t1.to(enterButton, {
    opacity: 1,
    duration: 0,
  });
  animateObjectsGrowth();
//   setupArrowButtonListeners();
};

enterButton.addEventListener("click", () => {
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 2,
    onComplete: () => {
      loadingScreen.remove();
      document.getElementById("mainContent").style.display = "block";
    },
  });
});



const loader = new GLTFLoader();

loader.load( './House1F.glb', function ( glb ) {

  
  glb.scene.traverse((child) => {


    if (intersectObjectsNames.includes(child.name)) {
      intersectObjects.push(child);
    }

    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }


  });
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
  scene.add(houseRoofModel);
  modelsLoaded++;
  checkAllModelsLoaded();
});

loader.load('./House2F.glb', function(gltf) {
  house2FModel = gltf.scene;
  scene.add(house2FModel);
  modelsLoaded++;
  checkAllModelsLoaded();
});


const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
// sun.position.set( -2, 5, -2 );
sun.position.set( -40, 40, 40 );
sun.target.position.set( 0, 0, 0 );
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.normalBias = 0.2;
scene.add( sun );

const light = new THREE.AmbientLight( 0x404040, 4 );
scene.add( light );

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000 );
camera.position.set(-15, 10, 30); // <-- Initial / Start position (X, Y, Z)
camera.lookAt(0, 7, 0); // <-- Where the camera is pointing (X, Y, Z)

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
  { position: [-.82, 3.75, 3.5], intensity: 300 },
  { position: [-3.62, 3.75, 3.5], intensity: 300 },
  { position: [-.82, 3.75, 2.04], intensity: 300 },
  { position: [-3.62, 3.75, 2.04], intensity: 300 },
  // hallway
  { position: [-0.32, 3.75, 0], intensity: 300 },
  { position: [-3.95, 3.75, 0], intensity: 400 },
  // bedroom1
  { position: [-3.95, 3.75, -2.2], intensity: 300 },
  { position: [-3.95, 3.75, -3.66], intensity: 300 },
  // bedroom2
  { position: [-0.32, 3.75, -2.2], intensity: 300 },
  { position: [-0.32, 3.75, -3.66], intensity: 300 },
  // Master bedroom 
  { position: [3.71, 3.75, -1], intensity: 300 },
  { position: [3.71, 3.75, -3], intensity: 300 },
  // stairs
  { position: [4.5, 5.53, 2.79], intensity: 300 },
  { position: [3, 5.53, 2.79], intensity: 300 },
  // Second floor lights 1
  { position: [-2.48, 6.41, 1.38], intensity: 300 },
  // Second floor lights 2
  { position: [2.56, 6.41, -1.47], intensity: 300 },
  { position: [-2.48, 6.41, -1.47], intensity: 300 },
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
  rectLight3: rectLights[2],
  rectLight4: rectLights[3],
  // hallway
  rectLight5: rectLights[4],
  rectLight6: rectLights[5],
  // br1
  rectLight7: rectLights[6],
  rectLight8: rectLights[7],
  // br2
  rectLight9: rectLights[8],
  rectLight10: rectLights[9],
  // mbr
  rectLight11: rectLights[10],
  rectLight12: rectLights[11],
  // stairs
  rectLight13: rectLights[12],
  rectLight14: rectLights[13],
  // 2f1
  rectLight15: rectLights[14],
  // 2f2
  rectLight16: rectLights[15],
  rectLight17: rectLights[16],

};


function onResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.left = -aspect * 50;
    camera.right = aspect * 50;
    camera.top = 50;
    camera.bottom = -50;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min( window.devicePixelRatio, 2));
}

function onClick() {
    if(intersectObject !== ""){
        showModal(intersectObject);
    }
}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(intersectObjects);
    
    // Reset previously hovered object
    if (hoveredObject) {
        gsap.to(hoveredObject.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: hoverAnimationDuration
        });
        hoveredObject = null;
    }
    
    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object.parent;
        const objectName = intersectedObject.name;
        
        // Only apply hover effect to specific objects
        if (["DashPartners", "DashAbout"].includes(objectName)) {
            document.body.style.cursor = 'pointer';
            hoveredObject = intersectedObject;
            
            // Animate scale up
            gsap.to(hoveredObject.scale, {
                x: hoverScaleFactor,
                y: hoverScaleFactor,
                z: hoverScaleFactor,
                duration: hoverAnimationDuration
            });
            
            intersectObject = objectName;
            return;
        }
    }
    
    // Default cursor if not hovering over our objects
    document.body.style.cursor = 'default';
    intersectObject = "";
}

modalExitButton.addEventListener("click", function() {
    playButtonSound();
    hideModal();
});
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener( "pointermove", onPointerMove );


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
        threeDToggleButton.style.backgroundColor = 'lightgreen';
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
    playButtonSound();
    toggleViewMode();
});


function checkAllModelsLoaded() {
  if (modelsLoaded >= totalModelsToLoad) {
    setupArrowButtonListeners();
  }
}

function setupArrowButtonListeners() {
  const arrowDownButton = document.getElementById('arrowDownToggleButton');
  const arrowUpButton = document.getElementById('arrowUpToggleButton');
  
  arrowDownButton.addEventListener('click', () => {
    playButtonSound();

    if (!isRoofHidden && !isSecondFloorHidden) {
      // First click: Hide the roof
      if (houseRoofModel) {
        houseRoofModel.visible = false;
        isRoofHidden = true;
        // arrowDownButton.textContent = arrowDownPin;
      }
    } else if (isRoofHidden && !isSecondFloorHidden) {
      // Second click: Hide the second floor
      if (house2FModel) {
        house2FModel.visible = false;
        isSecondFloorHidden = true;
        namedLights.rectLight15.visible = false;
        namedLights.rectLight16.visible = false;
        namedLights.rectLight17.visible = false;
        // arrowDownButton.textContent = arrowDownPin;
      }
    } else {
      // Third click: Nothing happens (both are already hidden)
      // arrowDownButton.textContent = arrowDownPin;
    }
  });
  
  arrowUpButton.addEventListener('click', () => {
    playButtonSound();

    if (isSecondFloorHidden) {
      // First click: Show the second floor
      if (house2FModel) {
        house2FModel.visible = true;
        isSecondFloorHidden = false;
        namedLights.rectLight15.visible = true;
        namedLights.rectLight16.visible = true;
        namedLights.rectLight17.visible = true;
        // arrowUpButton.textContent = arrowUpPin;
      }
    } else if (isRoofHidden) {
      // Second click: Show the roof
      if (houseRoofModel) {
        houseRoofModel.visible = true;
        isRoofHidden = false;
        // arrowUpButton.textContent = arrowUpPin;
      }
    } else {
      // If both are already visible, do nothing or reset text
      // arrowUpButton.textContent = arrowUpPin;
    }
  });
}

// Codes for Display of Time and Date
function updateDateTime() {
    const now = new Date();
    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString(undefined, optionsDate);

    const formattedTime = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    document.getElementById('vantaa-date').textContent = formattedDate;
    document.getElementById('vantaa-clock').textContent = formattedTime;
}

updateDateTime();
setInterval(updateDateTime, 1000);

enterButton.addEventListener("click", () => {
  // playButtonSound();

    gsap.to(loadingScreen, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          
            loadingScreen.remove();
            document.getElementById("mainContent").style.display = "block";

            // Start growth animation after 500 milliseconds
            setTimeout(() => {
                animateObjectsGrowth();
            }, 500);
        },
    });


});

function initAudio() {
    buttonSound = document.getElementById('buttonSound');

    // Set volume levels (0.0 to 1.0)
    buttonSound.volume = 0.1; // Adjust as needed
    
    buttonSound.addEventListener('canplaythrough', () => {
        isAudioLoaded = true;
    });
    
    buttonSound.addEventListener('error', () => {
        console.error("Error loading audio file");
    });
    
    // Preload the audio
    buttonSound.load();
}

function playButtonSound() {
    if (isAudioLoaded && buttonSound) {
        buttonSound.currentTime = 0; // Reset to start
        buttonSound.play().catch(e => {
            console.log("Audio play failed:", e);
        });
    }
}

document.addEventListener('DOMContentLoaded', initAudio);

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

  const containers = [
    document.getElementById('vantaa-date-container'),
    document.getElementById('vantaa-time-container'),

  ];  

  const newFontColor = isBright ? 'black' : 'white';
  containers.forEach(container => {
    if (container) {
      container.style.color = newFontColor;
    }
  });
}

// Theme toggle button
themeToggleButton.addEventListener("click", function() {
    playButtonSound();
    toggleTheme();
});

const showSwitchButton = document.getElementById("showSwitchButton");
let isUIVisible = false; // Start with UI hidden

showSwitchButton.addEventListener("click", () => {
    isUIVisible = !isUIVisible;
    playButtonSound();
    
    // Update button text
    showSwitchButton.textContent = isUIVisible ? '💡🙈' : '💡👀';

    // Toggle all UI elements
    const allUIElements = [
        ...controlButtons
    ].filter(element => element !== null);

    allUIElements.forEach(element => {
        element.classList.toggle("hidden", !isUIVisible);
    });
});

const controlButtons = [
    document.getElementById("livingRoomButton"),
    document.getElementById("hallwayButton"),
    document.getElementById("stairButton"),
    document.getElementById("bedroom1Button"),
    document.getElementById("bedroom2Button"),
    document.getElementById("masterBedRoomButton"),
    document.getElementById("secondFloor1Button"),
    document.getElementById("secondFloor2Button")
].filter(Boolean); // This removes any null elements

const livingRoomButton = document.getElementById("livingRoomButton");
let isLivingRoom = true;
const hallwayButton = document.getElementById("hallwayButton");
let isHallway = true;
const stairButton = document.getElementById("stairButton");
let isStair = true;
const bedroom1Button = document.getElementById("bedroom1Button");
let isBedroom1 = true;
const bedroom2Button = document.getElementById("bedroom2Button");
let isBedroom2 = true;
const masterBedRoomButton = document.getElementById("masterBedRoomButton");
let isMasterBedroom = true;
const secondFloor1Button = document.getElementById("secondFloor1Button");
let isSecondFloor1 = true;
const secondFloor2Button = document.getElementById("secondFloor2Button");
let isSecondFloor2 = true;

function toggleLivingRoom() {
    isLivingRoom = !isLivingRoom;
    if (isLivingRoom) {
        livingRoomButton.style.backgroundColor = 'lightgreen';
        namedLights.rectLight1.intensity = 300;
        namedLights.rectLight2.intensity = 300;
        namedLights.rectLight3.intensity = 300;
        namedLights.rectLight4.intensity = 400;        
    } else {
        livingRoomButton.style.backgroundColor = '#717dad';
        namedLights.rectLight1.intensity = 0;
        namedLights.rectLight2.intensity = 0;
        namedLights.rectLight3.intensity = 0;
        namedLights.rectLight4.intensity = 0;

    }
}
livingRoomButton.addEventListener("click", () => {
    playButtonSound();
    toggleLivingRoom();
});
function toggleHallway() {
    isHallway = !isHallway;
    if (isHallway) {
        hallwayButton.style.backgroundColor = 'lightgreen';
        namedLights.rectLight5.intensity = 300;
        namedLights.rectLight6.intensity = 300;
    } else {
        hallwayButton.style.backgroundColor = '#717dad';
        namedLights.rectLight5.intensity = 0;
        namedLights.rectLight6.intensity = 0;
    }
}
hallwayButton.addEventListener("click", () => {
    playButtonSound();
    toggleHallway();
});
function toggleStair() {
    isStair = !isStair;
    if (isStair) {
        stairButton.style.backgroundColor = 'lightgreen';
        namedLights.rectLight13.intensity = 300;
        namedLights.rectLight14.intensity = 300;
    } else {
        stairButton.style.backgroundColor = '#717dad';
        namedLights.rectLight13.intensity = 0;
        namedLights.rectLight14.intensity = 0;
    }
}
stairButton.addEventListener("click", () => {
    playButtonSound();
    toggleStair();
});
function toggleBedroom1() {
    isBedroom1 = !isBedroom1;
    if (isBedroom1) {
        bedroom1Button.style.backgroundColor = 'lightgreen';
        namedLights.rectLight7.intensity = 300;
        namedLights.rectLight8.intensity = 300;    
    } else {
        bedroom1Button.style.backgroundColor = '#717dad';
        namedLights.rectLight7.intensity = 0;
        namedLights.rectLight8.intensity = 0;
    }
}
bedroom1Button.addEventListener("click", () => {
    playButtonSound();
    toggleBedroom1();
});
function toggleBedroom2() {
    isBedroom2 = !isBedroom2;
    if (isBedroom2) {
        bedroom2Button.style.backgroundColor = 'lightgreen';
        namedLights.rectLight9.intensity = 300;
        namedLights.rectLight10.intensity = 300;    
    } else {
        bedroom2Button.style.backgroundColor = '#717dad';
        namedLights.rectLight9.intensity = 0;
        namedLights.rectLight10.intensity = 0;
    }
}
bedroom2Button.addEventListener("click", () => {
    playButtonSound();
    toggleBedroom2();
});
function toggleMasterBedroom() {
    isMasterBedroom = !isMasterBedroom;
    if (isMasterBedroom) {
        masterBedRoomButton.style.backgroundColor = 'lightgreen';
        namedLights.rectLight11.intensity = 300;
        namedLights.rectLight12.intensity = 300;    
    } else {
        masterBedRoomButton.style.backgroundColor = '#717dad';
        namedLights.rectLight11.intensity = 0;
        namedLights.rectLight12.intensity = 0;
    }
}
masterBedRoomButton.addEventListener("click", () => {
    playButtonSound();
    toggleMasterBedroom();
});
function toggleSecondFloor1() {
    isSecondFloor1 = !isSecondFloor1;
    if (isSecondFloor1) {
        secondFloor1Button.style.backgroundColor = 'lightgreen';
        namedLights.rectLight15.intensity = 300;
    } else {
        secondFloor1Button.style.backgroundColor = '#717dad';
        namedLights.rectLight15.intensity = 0;
    }
}
secondFloor1Button.addEventListener("click", () => {
    playButtonSound();
    toggleSecondFloor1();
});
function toggleSecondFloor2() {
    isSecondFloor2 = !isSecondFloor2;
    if (isSecondFloor2) {
        secondFloor2Button.style.backgroundColor = 'lightgreen';
        namedLights.rectLight16.intensity = 300;
        namedLights.rectLight17.intensity = 300;
    } else {
        secondFloor2Button.style.backgroundColor = '#717dad';
        namedLights.rectLight16.intensity = 0;
        namedLights.rectLight17.intensity = 0;
    }
}
secondFloor2Button.addEventListener("click", () => {
    playButtonSound();
    toggleSecondFloor2();
});


// View Controls
function animate() {    
  // View Controls
    if (is3DMode) {
        controls.maxDistance = 35;
        controls.minDistance = 3;
        controls.minPolarAngle = THREE.MathUtils.degToRad(35);
        controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
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


  controls.update();

  raycaster.setFromCamera( pointer, camera );

	const intersects = raycaster.intersectObjects(intersectObjects);

    if ( intersects.length > 0 ) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
        intersectObject = "";
    }

	for ( let i = 0; i < intersects.length; i ++ ) {
        intersectObject = intersects[0].object.parent.name;
	}


    renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );
