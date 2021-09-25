THREE.Object3D.prototype.rotateAroundWorldAxis = function () {

    // rotate object around axis in world space (the axis passes through point)
    // axis is assumed to be normalized
    // assumes object does not have a rotated parent

    var q = new THREE.Quaternion();

    return function rotateAroundWorldAxis(point, axis, angle) {

        q.setFromAxisAngle(axis, angle);

        this.applyQuaternion(q);

        this.position.sub(point);
        this.position.applyQuaternion(q);
        this.position.add(point);

        return this;

    }

}();

var sX = 0;
var sY = 0;
var sZ = 1000;

var star;
var asteroidBelt;

var cameraType = 1;

var animationTimer = 0;
var ship;
var rightWingLower;
var rightWingUpper;
var leftWingUpper;
var leftWingLower;

var leftEngine;
var rightEngine;

var leftEngineLight;
var rightEngineLight;

var engineFlag = false;

var wingDistance = 0.05;
var animationStartTick = 0;
var wingsEngagedFlag = false;
var wingsDisengagedFlag = true;
const backgroundColor = 0x000000;

// x, y, z, roll, pitch, yaw
var wingerPos = [0, 0, 0, 0, 0, 0];
var wingerThrust = 0;
var wingerRoll = 0;

var controls;

/*////////////////////////////////////////*/

var renderCalls = [];

/*////////////////////////////////////////*/

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 12000);
camera.position.set(sX, sY + 15, sZ + 30);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth * 0.75, window.innerHeight * 0.75);
renderer.setClearColor(backgroundColor);//0x );

renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = Math.pow(0.94, 5.0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

document.body.appendChild(renderer.domElement);

function renderScene() {
    renderer.render(scene, camera);
}
renderCalls.push(renderScene);

var light2 = new THREE.AmbientLight(0xffffff, 2, 100000);
light2.position.set(10000, 10000, 10000);
scene.add(light2);

/* ////////////////////////////////////////////////////////////////////////// */



var loader = new THREE.GLTFLoader();
loader.crossOrigin = true;
loader.load('obj/ship2.gltf', function (data) {
    ship = data.scene;
    ship.position.set(sX, sX, sZ);
    ship.scale.x = 2;
    ship.scale.y = 2;
    ship.scale.z = 2;
    scene.add(ship);
    var light3 = new THREE.SpotLight(0xffffff, 2, 10000);
    light3.castShadow = true;
    light3.position.set(0, 10, 10);
    ship.add(light3);
});

function addRightWingLower() {
    loader.load('obj/wing.gltf', function (data) {
        rightWingLower = data.scene;
        rightWingLower.position.set(2, wingDistance, 2.5);
        rightWingLower.scale.x = 0.7;
        rightWingLower.scale.y = 0.7;
        rightWingLower.scale.z = 0.7;
        ship.add(rightWingLower);
    });
}

function addRightWingUpper() {
    loader.load('obj/wing.gltf', function (data) {
        rightWingUpper = data.scene;
        rightWingUpper.position.set(2, -wingDistance, 2.5);
        rightWingUpper.scale.x = 0.7;
        rightWingUpper.scale.y = 0.7;
        rightWingUpper.scale.z = 0.7;
        ship.add(rightWingUpper);
    });
}

function addLeftWingUpper() {
    loader.load('obj/wing.gltf', function (data) {
        leftWingUpper = data.scene;
        leftWingUpper.position.set(-2, wingDistance, 2.5);
        leftWingUpper.rotation.set(Math.PI, Math.PI, 0);
        leftWingUpper.scale.x = 0.7;
        leftWingUpper.scale.y = 0.7;
        leftWingUpper.scale.z = 0.7;
        ship.add(leftWingUpper);
    });
}

function addLeftWingLower() {
    loader.load('obj/wing.gltf', function (data) {
        leftWingLower = data.scene;
        leftWingLower.position.set(-2, -wingDistance, 2.5);
        leftWingLower.rotation.set(Math.PI, Math.PI, 0);
        leftWingLower.scale.x = 0.7;
        leftWingLower.scale.y = 0.7;
        leftWingLower.scale.z = 0.7;
        ship.add(leftWingLower);
    });
}

function addLeftEngine() {
    loader.load('obj/engine.gltf', function (data) {
        leftEngine = data.scene;
        leftEngine.position.set(-0.9, 0.5, 4.5);
        leftEngine.scale.x = 1;
        leftEngine.scale.y = 1;
        leftEngine.scale.z = 1;
        ship.add(leftEngine);
        leftEngineLight = new THREE.PointLight(0x4b47ff, 100, 10);
        leftEngineLight.position.set(0, 0, 1);
        leftEngine.add(leftEngineLight);
        leftEngineLight.visible = false;
    });
}

function addRightEngine() {
    loader.load('obj/engine.gltf', function (data) {
        rightEngine = data.scene;
        rightEngine.position.set(0.9, 0.5, 4.5);
        rightEngine.scale.x = 1;
        rightEngine.scale.y = 1;
        rightEngine.scale.z = 1;
        ship.add(rightEngine);
        rightEngineLight = new THREE.PointLight(0x4b47ff, 100, 10);
        rightEngineLight.position.set(0, 0, 1);
        rightEngine.add(rightEngineLight);
        rightEngineLight.visible = false;
    });
}


function updateWingerState() {
    sZ -= wingerThrust / 100;
    sX -= (wingerThrust / 100) * Math.sin(wingerRoll);
}

var rotationStep = 0.005;

function engageWings() {
    var point = new THREE.Vector3(0, 0, 0);
    var axis = new THREE.Vector3(0, 0, 1);
    rightWingUpper.rotateAroundWorldAxis(point, axis, rotationStep);
    leftWingUpper.rotateAroundWorldAxis(point, axis, -rotationStep);
    
    rightWingLower.rotateAroundWorldAxis(point, axis, -rotationStep);
    leftWingLower.rotateAroundWorldAxis(point, axis, rotationStep);
}

function disengageWings() {
    var point = new THREE.Vector3(0, 0, 0);
    var axis = new THREE.Vector3(0, 0, 1);
    rightWingUpper.rotateAroundWorldAxis(point, axis, -rotationStep);
    leftWingUpper.rotateAroundWorldAxis(point, axis, rotationStep);

    rightWingLower.rotateAroundWorldAxis(point, axis, rotationStep);
    leftWingLower.rotateAroundWorldAxis(point, axis, -rotationStep);
}

function addStar() {
    var sunSize = 50;
    var coronaSize = sunSize * 1.25;
    const geometry1 = new THREE.SphereGeometry(sunSize, 64, 64);
    const geometry2 = new THREE.SphereGeometry(coronaSize, 64, 64);
    const material1 = new THREE.MeshPhongMaterial({
        // TAKEN FROM WIKIPEDIA
        // https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_sun.jpg
        map: THREE.ImageUtils.loadTexture('textures/sun.jpg'),
        bumpMap: THREE.ImageUtils.loadTexture('textures/sun_bump.jpg'),
        bumpScale: 0.3
    });
    const material2 = new THREE.MeshPhongMaterial({
        color: "white",
        emissive: "yellow",
        transparent: true,
        opacity: 0.25
    });
    const sphere1 = new THREE.Mesh(geometry1, material1);
    sphere1.position.set(0, 0, 0);
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.position.set(0, 0, 0);
    star = new THREE.PointLight(0xFFFF00, 1000000, 500);
    star.decay = 2;
    star.castShadow = true;
    star.add(sphere1);
    star.add(sphere2);
    scene.add(star);
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function radnomAngle() {
    return (Math.random() - 0.5) * 2 * Math.PI;
}

function randomFloat(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

function addAsteroids(N = 50) {
    console.log(N);
    asteroidBelt = new THREE.PointLight(0xff0040, 1, 0);
    star.add(asteroidBelt);
    for (var i = 0; i < N; i++) {
        var hSeg = randomInt(5, 20);
        var vSeg = randomInt(5, 20);
        var r = randomInt(5, 25);
        const geometry = new THREE.SphereGeometry(r, hSeg, vSeg);
        const material = new THREE.MeshPhongMaterial({
            // TAKEN FROM WIKIPEDIA
            // https://commons.wikimedia.org/wiki/File:Generic_Celestia_asteroid_texture.jpg
            map: THREE.ImageUtils.loadTexture('textures/asteroid.jpg'),
            bumpMap: THREE.ImageUtils.loadTexture('textures/asteroid_bump.jpg'),
            displacementMap: THREE.ImageUtils.loadTexture('textures/asteroid_bump.jpg'),
            bumpScale: randomFloat(0.7, 0.9),
            displacementScale: randomFloat(0.7, 0.9)
        });
        const sphere = new THREE.Mesh(geometry, material);
        var phi = radnomAngle();
        var rad = randomInt(300, 900);
        var x = rad * Math.sin(phi);
        var y = randomInt(-10, 10);
        var z = rad * Math.cos(phi);
        sphere.position.set(x, y, z);
        asteroidBelt.add(sphere);
    }
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    // W
    if (keyCode == 87) {
        animationStartTick = animationTimer;
        if (wingsEngagedFlag == false) {
            wingsEngagedFlag = true;
            wingsDisengagedFlag = false;
        }
        else {
            wingsEngagedFlag = false;
            wingsDisengagedFlag = true;
        }
    }
    // 1
    else if (keyCode == 49) {
        console.log("camera pos 1");
        camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 12000);
        camera.position.set(sX, sY + 15, sZ + 30);
        //camera.position.set(0, 10, 15);
        cameraType = 1;
    }
    // 2
    else if (keyCode == 50) {
        console.log("camera pos 2");
        camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 12000);
        camera.position.set(sX, sY + 10, sZ + 15);
        cameraType = 2;
    }
    // 3
    else if (keyCode == 51) {
        console.log("camera orbital");
        camera.position.set(sX, sY + 25, sZ + 45);
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        cameraType = 3;
    }
    // D 
    else if (keyCode == 68) {
        if (engineFlag == false) {
            leftEngineLight.visible = true;
            rightEngineLight.visible = true;
            engineFlag = true;
            ship.position.z -= 2;
            wingerThrust += 50;
        }
        else {
            leftEngineLight.visible = false;
            rightEngineLight.visible = false;
            engineFlag = false;
            ship.position.z += 2;
            if (wingerThrust > 50)
                wingerThrust -= 50;
        }
    }
    // KeyUp
    else if (keyCode == 38) {
        wingerThrust += 1;
    }
    // KeyDown
    else if (keyCode == 40) {
        wingerThrust -= 1;
        if (wingerThrust < 0)
            wingerThrust = 0;
    }

    // KeyLeft
    else if (keyCode == 37) {
        wingerRoll += Math.PI/150;
    }
    // KeyRight
    else if (keyCode == 39) {
        wingerRoll -= Math.PI/150;
    }


    console.log(wingerThrust);
};

addStar();
addAsteroids(50);
addRightWingLower();
addRightWingUpper();
addLeftWingUpper();
addLeftWingLower();
addLeftEngine();
addRightEngine();


function render() {
    requestAnimationFrame(render);
    renderCalls.forEach((callback) => { callback(); });
    //if (ship != null)
    //    ship.rotation.y += 0.01;
    if (wingsEngagedFlag && animationTimer - animationStartTick < 50) {
            engageWings();
            console.log("engaged");
        }

        else if (wingsDisengagedFlag && animationTimer - animationStartTick < 50) {
            disengageWings();
        }
        else {

        }
    updateWingerState();
    switch(cameraType) {
        case 1:
            camera.position.set(sX, sY + 15, sZ + 30);
            break;
        case 2:
            camera.position.set(sX, sY + 10, sZ + 15);
            break;
        case 3: 
            //camera.position.set(sX, sY + 25, sZ + 45);
            break;
    }
    asteroidBelt.rotation.y -= 1e-2 - 5e-4;
    star.rotation.y += 1e-2;
    animationTimer += 1;
    ship.position.set(sX, sY, sZ);
    ship.rotation.z = wingerRoll;
    if (wingerThrust > 0 && wingerRoll != 0)
        ship.rotation.y = wingerRoll / 2;
    document.getElementById("info").innerHTML = "Spaceship Thrust: " + String(wingerThrust);
}

render();