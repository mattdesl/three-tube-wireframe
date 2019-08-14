const canvasSketch = require('canvas-sketch');
const createTubeWireframe = require('./');

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

const settings = {
  dimensions: [ 1024, 700 ],
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor('#fff', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(1.5, 1.5, 3);
  camera.lookAt(new THREE.Vector3());

  // Setup your scene
  const scene = new THREE.Scene();

  const geometry = new THREE.TorusGeometry(1, 0.25, 8, 16);
  const wireGeometry = createTubeWireframe(geometry, {
    thickness: 0.03,
    radiusSegments: 6,
    mode: 'quad'
  });
  const mesh = new THREE.Mesh(
    wireGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 'white',
      roughness: 0.75,
      flatShading: true
    })
  );
  mesh.position.x -= 0.05;
  mesh.position.y -= 0.1;
  scene.add(mesh);

  // Add some light
  const light = new THREE.PointLight('#fff', 1, 10);
  light.position.set(-1, -2, 4).multiplyScalar(1);
  scene.add(light);

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render ({ time }) {
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
