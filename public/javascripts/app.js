/*
 * OOO
 * https://www.booottle.ooo
 * NETRO
 * https://netro.cc/
 */

function App() {

  var element;

  // cannon.js
  var world;

  var playerShape;
  var playerBody;

  var boxBodies = [];
  var boxMeshes = [];
  var sphereBodies = [];
  var sphereMeshes = [];
  var bottleBodies = [];
  var bottleConstraints = [];
  var bottleMeshes = [];
  //var bottleMeshesDev = [];

  var physicsMaterial;
  var kinematicBody;

  // three.js
  var renderer;
  var scene;
  var controls;
  var camera;

  var clock;
  var textureLoader;
  var jsonLoader;

  var threeToLoad;
  var threeLoaded;

  // bottles
  var maxBottles = 40;
  var bottleMaterials = [];
  var bottleGeometry;
  var bottleScale = 0.0295;

  var bottleTopShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.15, 0.05));
  var bottleBottomShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.05, 0.05));
  var bottleTopGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
  var bottleBottomGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

  var shootDirection = new THREE.Vector3();
  var shootVelo;

  var mouseDownTime;

  // gui
  var blocker;
  var instructions;
  var loading;
  var bar;
  
  var loadMonitor;
  
  //var stats;
  

  /*
   *  Main init
   */
  function initialize() {
    element = document.body;

    blocker = document.getElementById('blocker');
    instructions = document.getElementById('instructions');
    instructions.style.display = 'none';

    loading = document.getElementById('loading');
    bar = document.getElementById('bar');
    
    if (!Detector.webgl) {
      //Detector.addGetWebGLMessage();
      document.getElementById('clickToPlay').style.display = 'none';
      document.getElementById('messageWebGL').style.display = 'block';
      instructions.style.display = 'block';
    } else {
      loading.style.display = 'inline';

      initSystem();
      initCannon();
      initThree();

      loadMonitor = setInterval(loadingProgress, 40);

      animate();
    }
  }


  /*
   *  Init cannon.js physics
   */
  function initCannon() {
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    world.gravity.set(0, -9.81, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    var solver = new CANNON.GSSolver();
    solver.iterations = 7;
    solver.tolerance = 0.1;

    var split = true;
    if (split) world.solver = new CANNON.SplitSolver(solver);
    else world.solver = solver;

    physicsMaterial = new CANNON.Material('physicsMaterial');
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
      friction: 0.3,
      restitution: 0.1,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
      frictionEquationStiffness: 1e7,
      frictionEquationRelaxation: 3
    });
    world.addContactMaterial(physicsContactMaterial);

    // player
    playerShape = new CANNON.Sphere(0.5);
    playerBody = new CANNON.Body({ mass: 70.0, material: physicsMaterial });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 1.0, 0);
    playerBody.linearDamping = 0.985;
    world.addBody(playerBody);

    // floor plane
    var floorShape = new CANNON.Plane();
    var floorBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
    world.addBody(floorBody);
  }

  /*
   *  Init three.js
   */
  function initThree() {
    clock = new THREE.Clock();
    textureLoader = new THREE.TextureLoader();
    jsonLoader = new THREE.JSONLoader();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeeeeff, 0, 100);
    scene.visible = false;

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    controls = new THREE.PointerLockControls(camera, playerBody);
    scene.add(controls.getObject());

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(scene.fog.color, 1);
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setPixelRatio(2);
    renderer.setSize(window.innerWidth, window.innerHeight);

    element.appendChild(renderer.domElement);

    // lights
    var ambient = new THREE.AmbientLight(0x333333);
    scene.add(ambient);

    light = new THREE.SpotLight(0xffffff, 1.75, 0.0, Math.PI/3, 0.0, 2.0);
    light.position.set(0, 12, 0);
    light.target.position.set(0, 0, 0);
    scene.add(light);


    // floor
    var floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
    floorGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    var floorTex = textureLoader.load('/images/box-tex-04b.jpg');
    var floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x459cdb,
      map: floorTex,
      emissive: 0x000022,
      side: THREE.FrontSide
    });
    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floorMesh);


    // boxes
    var boxMaterial = new THREE.MeshLambertMaterial({
      color: 0xaaaaaa
    });

    // dice wall
    addBox(-4.1, 1, -10, 1, 1, 1, 0, boxMaterial);
    addBox(-2, 1, -10.2, 1, 1, 1, 0, boxMaterial);
    addBox(1, 1, -9.2, 1, 1, 1, 0, boxMaterial);

    addBox(-3.1, 3, -10.3, 1, 1, 1, 0, boxMaterial);
    addBox(-0.4, 3, -10.4, 1, 1, 1, 0, boxMaterial);
    addBox(1.9, 3, -9.8, 1, 1, 1, 0, boxMaterial);

    addBox(-1.4, 5, -10.8, 1, 1, 1, 0, boxMaterial);
    addBox(1.5, 5, -9.94, 1, 1, 1, 0, boxMaterial);

    // steps
    addBox(-10, 1, 4, 1, 2, 0.5, 0, boxMaterial);
    addBox(-10, 1.25, 2, 1, 2.5, 0.5, 0, boxMaterial);
    addBox(-10, 1.5, 0, 1, 3, 0.5, 0, boxMaterial);
    addBox(-10, 1.75, -2, 1, 3.5, 0.5, 0, boxMaterial);
    addBox(-10, 2, -4, 1, 4, 0.5, 0, boxMaterial);

    // sphere
    var radius = 1.0;
    var sphereShape = new CANNON.Sphere(radius);
    var sphereBody = new CANNON.Body({ mass: 500, material: physicsMaterial });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0, 2, 10);
    world.addBody(sphereBody);
    sphereBodies.push(sphereBody);

    var sphereGeometry = new THREE.SphereGeometry(radius, 24, 18);
    var sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0xbbbbbb
    });
    var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(0, 2, 9.5);
    scene.add(sphereMesh);
    sphereMeshes.push(sphereMesh);

    // pins
    addBox(-4, 0.8, 10, 0.1, 0.8, 0.1, 0, boxMaterial);
    addBox(-6, 1.0, 9, 0.05, 1, 0.05, 0, boxMaterial);

    // bank
    addBox(4, 0.1, 10, 0.2, 0.1, 1, 0, boxMaterial);
    addBox(6, 0.3, 10, 0.2, 0.3, 0.8, 0, boxMaterial);
    addBox(4.9, 0.4, 10, 1.3, 0.075, 0.7, 200, boxMaterial);

    // board wall
    addBox(9.0, 2.5, 0.0, 0.1, 2.5, 5, 0, boxMaterial);

    addBox(8.8, 3.9, -1.25, 0.1, 0.05, 3, 0, boxMaterial);

    addBox(8.6, 2.6, -3.8, 0.3, 0.05, 0.8, 0, boxMaterial);
    addBox(8.6, 2.2, -1.9, 0.3, 0.05, 0.6, 0, boxMaterial);
    addBox(8.6, 1.1, -0.2, 0.3, 0.05, 0.4, 0, boxMaterial);
    addBox(8.6, 2.7, 1.6, 0.3, 0.05, 0.7, 0, boxMaterial);
    
    addBox(8.4, 4.1, 3.5, 0.5, 0.05, 0.6, 0, boxMaterial);
    addBox(8.6, 2.4, 3.5, 0.3, 0.05, 0.5, 0, boxMaterial);
    addBox(8.8, 0.7, 3.5, 0.1, 0.05, 0.1, 0, boxMaterial);

    // kinematic plate
    var halfExtents = new CANNON.Vec3(0.5, 0.08, 0.5);
    var kinematicShape = new CANNON.Box(halfExtents);
    var kinematicGeometry = new THREE.BoxGeometry(halfExtents.x*2, halfExtents.y*2, halfExtents.z*2);

    kinematicBody = new CANNON.Body({
      mass: 0,
      material: physicsMaterial,
      type: CANNON.Body.KINEMATIC,
      position: new CANNON.Vec3(0, 0.7, 7)
    });
    kinematicBody.addShape(kinematicShape);
    world.add(kinematicBody);
    boxBodies.push(kinematicBody);
    
    var kinematicMesh = new THREE.Mesh(kinematicGeometry, boxMaterial);
    kinematicMesh.position.set(0, 0.7, 7);
    scene.add(kinematicMesh);
    boxMeshes.push(kinematicMesh);


    // load bottle
    var textureFiles = ["bottle-texture-map-white.jpg", "bottle-texture-map-black.jpg", "bottle-texture-map-green.jpg", "bottle-texture-map-yellow.jpg"];
    for (var i=0; i<textureFiles.length; i++) {
      var bottleTex = textureLoader.load('/images/' + textureFiles[i]);

      var bottleMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x000022,
        specular: 0xffffff,
        shininess: 60,
        side: THREE.FrontSide,
        map: bottleTex
      });

      bottleMaterials.push(bottleMaterial);
    }
    
    jsonLoader.load('/javascripts/bottle.json', function(geometry) {
      bottleGeometry = geometry;
      bottleGeometry.translate(0, -1.75, 0);
    });


    //stats = new Stats();
    //element.appendChild(stats.domElement);
    
    THREE.DefaultLoadingManager.onProgress = function(item, loaded, total) {
      threeToLoad = total;
      threeLoaded = loaded;
    };
  }


  function addBox(x, y, z, w, h, d, mass, material) {
    var halfExtents = new CANNON.Vec3(w, h, d);
    var shape = new CANNON.Box(halfExtents);
    var geometry = new THREE.BoxGeometry(halfExtents.x*2, halfExtents.y*2, halfExtents.z*2);

    var body = new CANNON.Body({ mass: mass, material: physicsMaterial });
    body.addShape(shape);
    body.position.set(x, y, z);
    world.addBody(body);
    if (mass > 0) boxBodies.push(body);

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    if (mass > 0) boxMeshes.push(mesh);
  }


  function loadingProgress() {
    var loaded = threeLoaded;
    var toLoad = threeToLoad;
    console.log(loaded + " objects of " + toLoad + " loaded, please wait!");
    
    if (loaded >= toLoad) {
      clearInterval(loadMonitor);
      setTimeout(function() {
        scene.visible = true;
        clock.start();

        loading.style.display = 'none';
        instructions.style.display = 'block';
        instructions.style.cursor = 'pointer';
      }, 500);
    }
    var barWidth = 100 * loaded / toLoad;
    bar.style.width = barWidth + '%';
  }


  function animate(time) {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();

    if (controls.enabled) {
      updateKineticBody();

      //world.step(delta);
      world.step(0.02);
/*
      for (var i=0; i<bottleBodies.length; i++) {
        bottleMeshesDev[i].position.copy(bottleBodies[i].position);
        bottleMeshesDev[i].quaternion.copy(bottleBodies[i].quaternion);
      }
*/
      for (var i=0; i<bottleMeshes.length; i++) {
        bottleMeshes[i].position.copy(bottleBodies[i*2].position);
        bottleMeshes[i].quaternion.copy(bottleBodies[i*2].quaternion);
      }

      for (var i=0; i<boxBodies.length; i++) {
        boxMeshes[i].position.copy(boxBodies[i].position);
        boxMeshes[i].quaternion.copy(boxBodies[i].quaternion);
      }

      for (var i=0; i<sphereBodies.length; i++) {
        sphereMeshes[i].position.copy(sphereBodies[i].position);
        sphereMeshes[i].quaternion.copy(sphereBodies[i].quaternion);
      }
    }

    controls.update(delta);
    renderer.render(scene, camera);

    //stats.update();
  }


  function updateKineticBody() {
    var x = Math.sin(clock.elapsedTime * 0.075) * 7.0;
    var z = Math.cos(clock.elapsedTime * 0.075) * 7.0;
    kinematicBody.position.set(x, kinematicBody.position.y, z);
  }


  /*
   *  Throw bottle
   */
  function getShootDir(targetVec) {
    var vector = targetVec;
    targetVec.set(0, 0, 1);
    vector.unproject(camera);
    var ray = new THREE.Ray(playerBody.position, vector.sub(playerBody.position).normalize());
    targetVec.copy(ray.direction);
  }

  function onMouseDown(event) {
    if (controls.enabled == true) {
      mouseDownTime = new Date();
    }
  }

  function onMouseUp(event) {
    if (controls.enabled == true) {
      var mouseUpTime = new Date();
      var timeDiff = mouseUpTime - mouseDownTime;
      shootVelo = timeDiff * 0.001 * 40;
      throwBottle();
    }
  }

  function throwBottle() {
    var x = playerBody.position.x;
    var y = playerBody.position.y;
    var z = playerBody.position.z;

    var bottleTopBody = new CANNON.Body({ mass: 0.1, material: physicsMaterial });
    var bottleBottomBody = new CANNON.Body({ mass: 1, material: physicsMaterial });

    bottleTopBody.addShape(bottleTopShape);
    bottleBottomBody.addShape(bottleBottomShape);

    world.addBody(bottleTopBody);
    world.addBody(bottleBottomBody);

    bottleBodies.push(bottleTopBody);
    bottleBodies.push(bottleBottomBody);

/*
    var bottleTopMesh = new THREE.Mesh(bottleTopGeometry, material);
    var bottleBottomMesh = new THREE.Mesh(bottleBottomGeometry, material);

    scene.add(bottleTopMesh);
    scene.add(bottleBottomMesh);

    bottleMeshesDev.push(bottleTopMesh);
    bottleMeshesDev.push(bottleBottomMesh);
*/

    getShootDir(shootDirection);

    // move the bottle outside the player sphere
    x += shootDirection.x * (playerShape.radius*Math.SQRT2);
    y += Math.abs(shootDirection.y) * (playerShape.radius*Math.SQRT2);
    z += shootDirection.z * (playerShape.radius*Math.SQRT2);

    bottleTopBody.position.set(x, y, z);
    bottleBottomBody.position.set(x, y-0.2, z);

    //bottleTopMesh.position.set(x, y, z);
    //bottleBottomMesh.position.set(x, y-0.2, z);

    var bottleConstraint = new CANNON.LockConstraint(bottleTopBody, bottleBottomBody, { maxForce: 1e7 });
    world.addConstraint(bottleConstraint);
    bottleConstraints.push(bottleConstraint);

    //bottleBottomBody.velocity.set(shootDirection.x * shootVelo, shootDirection.y * shootVelo, shootDirection.z * shootVelo);    
    bottleBottomBody.velocity.set(shootDirection.x * shootVelo, shootDirection.y * shootVelo + shootVelo * 2.0, shootDirection.z * shootVelo);

    
    var bottleMesh = new THREE.Mesh(bottleGeometry, bottleMaterials[Math.floor(Math.random()*bottleMaterials.length)]);
    bottleMesh.position.set(x, y, z);
    bottleMesh.scale.set(bottleScale, bottleScale, bottleScale);
      
    scene.add(bottleMesh);
    bottleMeshes.push(bottleMesh);

    if (bottleMeshes.length > maxBottles) removeBottle();
  }

  function removeBottle() {
    scene.remove(bottleMeshes[0]);
    bottleMeshes.shift();

    world.removeConstraint(bottleConstraints[0]);
    bottleConstraints.shift();

    world.removeBody(bottleBodies[0]);
    bottleBodies.shift();
    world.removeBody(bottleBodies[0]);
    bottleBodies.shift();
  }


  /*
   *  SYSTEM
   */
  function initSystem() {
    initFullscreen();
    initPointerLock();
    
    var onKeyDown = function(event) {
      //console.log(event.keyCode);
      switch (event.keyCode) {
        case 27: // escape
          break;
        case 70: // f
          enterFullscreen();
          break;
        case 80: // p
          enterPointerLock();
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function initFullscreen() {
    if ('fullscreenElement' in document || 'mozFullscreenElement' in document || 'mozFullScreenElement' in document || 'webkitFullscreenElement' in document || 'msFullscreenElement' in document) {
      var fullscreenchange = function(event) {
        if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element || document.webkitFullscreenElement === element || document.msFullscreenElement === element) {
          //FULLSCREEN ACTIVATED
        } else {
          //FULLSCREEN DEACTIVATED
        }
      }
      document.addEventListener('fullscreenchange', fullscreenchange, false);
      document.addEventListener('mozfullscreenchange', fullscreenchange, false);
      document.addEventListener('webkitfullscreenchange', fullscreenchange, false);
      document.addEventListener('msfullscreenchange', fullscreenchange, false);
      
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen;
    }
  }
  
  function enterFullscreen() {
    element.requestFullscreen();
  }
  
  function initPointerLock() {
    if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
      var pointerlockchange = function(event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
          controls.enabled = true;
          blocker.style.display = 'none';
        } else {
          controls.enabled = false;
          blocker.style.display = 'block';
          clearSelection();
        }
      }
      
      var pointerlockerror = function(event) {
        console.log("POINTER LOCK ERROR");
      }

      document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
      
      document.addEventListener('pointerlockchange', pointerlockchange, false);
      document.addEventListener('mozpointerlockchange', pointerlockchange, false);
      document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
      document.addEventListener('pointerlockerror', pointerlockerror, false);
      document.addEventListener('mozpointerlockerror', pointerlockerror, false);
      document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
      
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
      
      instructions.addEventListener('click', function(event) {
        enterPointerLock();
      }, false);
    } else {
      document.getElementById('clickToPlay').style.display = 'none';
      document.getElementById('messagePointerLock').style.display = 'block';
    }
  }
  
  function enterPointerLock() {
    element.requestPointerLock();
  }

  function clearSelection() {
    console.log("CLREA SELECTION");
    if (document.selection) {
      document.selection.empty();
    } else if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }

  
  return {
    initialize: initialize
  };
}

var app = new App();
window.addEventListener('load', app.initialize, false);