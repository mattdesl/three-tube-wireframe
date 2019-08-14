const THREE = require('three');

const tmpAxis = new THREE.Vector3();
const modes = [
  'triangle',
  'quad',
  'cross-hatch',
  'diagonal0',
  'diagonal1',
  'horizontal',
  'vertical',
  'diagonal0-horizontal',
  'diagonal1-horizontal',
  'diagonal0-vertical',
  'diagonal1-vertical'
];

module.exports = createTubeWireframeGeometry;
module.exports.modes = modes;

function createTubeWireframeGeometry (geometry, opt = {}) {
  const {
    matrix = new THREE.Matrix4(),
    mode = 'triangle',
    filter = () => true
  } = opt;

  const cells = gatherCells(geometry, mode, filter);

  const allEdges = cells.map(cell => {
    return cell.map((current, i) => {
      const next = cell[(i + 1) % cell.length];
      return [ current, next ];
    });
  }).reduce((a, b) => a.concat(b), []);

  const edges = dedupeEdges(allEdges);
  const outGeometry = new THREE.Geometry();
  edges.forEach(([ a, b ]) => {
    const start = geometry.vertices[a];
    const end = geometry.vertices[b];
    const tube = createDynamicTube(start, end, opt);
    outGeometry.merge(tube, matrix);
  });
  return outGeometry;
}

function gatherCells (geometry, mode, filter) {
  if (mode === 'triangle') {
    return geometry.faces.filter((face, i) => {
      return filter(i, mode);
    }).map(face => {
      return [ face.a, face.b, face.c ];
    });
  }

  const cells = [];
  for (let i = 0; i < geometry.faces.length; i += 2) {
    const f0 = geometry.faces[i];
    const f1 = geometry.faces[i + 1];
    if (!filter(i, mode)) {
      continue;
    }
    if (mode === 'cross-hatch') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f0.b, f1.c ]);
    } else if (mode === 'diagonal0') {
      cells.push([ f0.a, f1.b ]);
    } else if (mode === 'diagonal1') {
      cells.push([ f0.b, f1.c ]);
    } else if (mode === 'diagonal0-vertical') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'diagonal1-vertical') {
      cells.push([ f0.b, f1.c ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'diagonal0-horizontal') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'diagonal1-horizontal') {
      cells.push([ f0.b, f1.c ]);
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'quad') {
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'horizontal') {
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'vertical') {
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    }
  }
  return cells;
}

function dedupeEdges (edges) {
  const map = {};
  const out = [];

  edges.forEach(edge => {
    const sorted = edge.slice();
    sorted.sort((a, b) => a - b);
    const key = sorted.join(':');
    if (!(key in map)) {
      map[key] = true;
      out.push(edge);
    }
  });

  return out;
}

function createDynamicTube (start, end, opt = {}) {
  const {
    lengthSegments = 1,
    radiusSegments = 4,
    thickness = 1,
    openEnded = false
  } = opt;

  const direction = end.clone().sub(start);

  const dist = direction.length();
  const length = dist;
  const geometry = new THREE.CylinderGeometry(thickness, thickness, length, radiusSegments, lengthSegments, openEnded);
  geometry.translate(0, length / 2, 0);

  const object = new THREE.Object3D();
  object.position.copy(start);
  quatFromDir(direction.clone().normalize(), object.quaternion);
  object.updateMatrix();
  geometry.applyMatrix(object.matrix);
  return geometry;
}

function quatFromDir (dir, quaternion = new THREE.Quaternion()) {
  // dir is assumed to be normalized
  if (dir.y > 0.99999) {
    quaternion.set(0, 0, 0, 1);
  } else if (dir.y < -0.99999) {
    quaternion.set(1, 0, 0, 0);
  } else {
    tmpAxis.set(dir.z, 0, -dir.x).normalize();
    const radians = Math.acos(dir.y);
    quaternion.setFromAxisAngle(tmpAxis, radians);
  }
  return quaternion;
}
