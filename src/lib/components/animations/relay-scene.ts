/** A tiny, bounded WebGL scene: two reusable meshes, no textures or downloads. */
const vertex = `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat3 rotation;
uniform vec3 translation;
uniform float scale;
uniform float aspect;
out vec3 vNormal;
out vec3 vPosition;
out vec2 vUv;
void main() {
  vec3 p = rotation * position * scale + translation;
  vNormal = rotation * normal;
  vPosition = p;
  vUv = uv;
  p.z -= 5.8;
  gl_Position = vec4(p.x * 2.9 / aspect, p.y * 2.9, -1.01005 * p.z - .201005, -p.z);
}`;

const fragment = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
uniform vec3 color;
uniform float kind;
uniform float phase;
uniform float dark;
out vec4 fragColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 eye = normalize(vec3(0., 0., 5.8) - vPosition);
  vec3 key = normalize(vec3(-3., 4., 5.));
  float diffuse = max(dot(n, key), 0.);
  float rim = pow(1. - max(dot(n, eye), 0.), 3.);
  vec3 reflected = reflect(-eye, n);
  // Broad studio softbox and narrow warm rim, rather than expensive environment textures.
  float softbox = pow(max(dot(reflected, normalize(vec3(-.5, .8, 1.))), 0.), 12.);
  float strip = pow(max(dot(reflected, normalize(vec3(1., .2, .8))), 0.), 40.);
  vec3 result = color * (.25 + diffuse * .9) + vec3(.9, .95, 1.) * softbox * 2.0;
  result += vec3(1., .68, .28) * strip * .65;
  result += mix(vec3(.18, .2, .26), vec3(.35, .4, .55), dark) * rim;
  if (kind < .5) {
    // Fine engraved meridians read as a relay globe, not a generic spinner.
    vec2 grid = abs(fract(vUv * vec2(18., 10.) + .5) - .5);
    vec2 edge = fwidth(vUv * vec2(18., 10.));
    float line = 1. - min(smoothstep(0., edge.x * .75, grid.x), smoothstep(0., edge.y * .75, grid.y));
    result = mix(result, result * .72, line * .55);
    result += vec3(.16, .12, .22) * rim;
  } else if (kind < 1.5) {
    // Each bright segment is the tapered wake of a moving signal, not an arbitrary pulse.
    float angle = vUv.x * 6.283185;
    float tail = 1. - smoothstep(0., .65, mod(phase - angle + 12.56637, 6.283185));
    float echo = 1. - smoothstep(0., .35, mod(phase + 3.14159 - angle + 12.56637, 6.283185));
    result += vec3(2.5, 1.15, .15) * (tail * .9 + echo * .4);
  } else {
    result += vec3(1.3, .65, .16);
  }
  result = result / (result + vec3(1.));
  fragColor = vec4(pow(result, vec3(1. / 2.2)), 1.);
}`;

type Mesh = { vao: WebGLVertexArrayObject; vertex: WebGLBuffer; index: WebGLBuffer; count: number };
export type RelayScene = { draw: (seconds: number, dark: boolean) => void; resize: (width: number, height: number, dpr: number) => void; dispose: () => void };

/** Returns null on unsupported/denied WebGL; callers retain the matching SVG artwork. */
export function createRelayScene(canvas: HTMLCanvasElement): RelayScene | null {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power', depth: true, stencil: false });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [];
  const vaos: WebGLVertexArrayObject[] = [];
  const program = gl.createProgram();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    for (const vao of vaos) gl.deleteVertexArray(vao);
    for (const shader of shaders) gl.deleteShader(shader);
    if (program) gl.deleteProgram(program);
  };
  try {
    if (!program) throw new Error('No WebGL program');
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('No WebGL shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('WebGL shader link failed');
    gl.useProgram(program);
    const uniforms = Object.fromEntries(['rotation', 'translation', 'scale', 'aspect', 'color', 'kind', 'phase', 'dark'].map(key => [key, gl.getUniformLocation(program, key)]));
    const attributes = ['position', 'normal', 'uv'].map(key => gl.getAttribLocation(program, key));
    function mesh(torus: boolean): Mesh {
      const data: number[] = [], indices: number[] = [];
      const segments = torus ? 112 : 48, rows = torus ? 10 : 28;
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, a = u * Math.PI * 2;
        for (let j = 0; j <= rows; j++) {
          const v = j / rows, b = v * Math.PI * (torus ? 2 : 1);
          const nx = Math.cos(a) * (torus ? Math.cos(b) : Math.sin(b));
          const ny = torus ? Math.sin(a) * Math.cos(b) : Math.cos(b);
          const nz = torus ? Math.sin(b) : Math.sin(a) * Math.sin(b);
          data.push(torus ? Math.cos(a) + nx * .015 : nx,
            torus ? Math.sin(a) + ny * .015 : ny, torus ? nz * .015 : nz, nx, ny, nz, u, v);
          if (i < segments && j < rows) {
            const k = i * (rows + 1) + j;
            indices.push(k, k + rows + 1, k + 1, k + 1, k + rows + 1, k + rows + 2);
          }
        }
      }
      const vao = gl!.createVertexArray(), vertex = gl!.createBuffer(), index = gl!.createBuffer();
      if (vao) vaos.push(vao);
      if (vertex) buffers.push(vertex);
      if (index) buffers.push(index);
      if (!vao || !vertex || !index) throw new Error('No WebGL buffer');
      gl!.bindVertexArray(vao);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, vertex);
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(data), gl!.STATIC_DRAW);
      attributes.forEach((location, i) => {
        gl!.enableVertexAttribArray(location);
        gl!.vertexAttribPointer(location, i === 2 ? 2 : 3, gl!.FLOAT, false, 32, i * 12);
      });
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, index);
      gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl!.STATIC_DRAW);
      const result = { vao, vertex, index, count: indices.length };
      return result;
    }
    const sphere = mesh(false), ring = mesh(true);
    const matrix = new Float32Array(9);
    let aspect = 1;
    // Euler orientation, stored column-major. Reused for every object and frame.
    function orient(x: number, y: number, z: number) {
      const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
      matrix[0] = c*e; matrix[1] = a*f+b*d*e; matrix[2] = b*f-a*d*e;
      matrix[3] = -c*f; matrix[4] = a*e-b*d*f; matrix[5] = b*e+a*d*f;
      matrix[6] = d; matrix[7] = -b*c; matrix[8] = a*c;
    }
    function drawMesh(mesh: Mesh, size: number, kind: number, x = 0, y = 0, z = 0) {
      gl!.uniformMatrix3fv(uniforms.rotation, false, matrix);
      gl!.uniform3f(uniforms.translation, x, y, z);
      gl!.uniform1f(uniforms.scale, size);
      gl!.uniform1f(uniforms.kind, kind);
      gl!.bindVertexArray(mesh.vao);
      gl!.drawElements(gl!.TRIANGLES, mesh.count, gl!.UNSIGNED_SHORT, 0);
    }
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    return {
      resize(width, height, dpr) {
        if (disposed) return;
        const ratio = Math.min(Math.max(dpr, 1), 1.5);
        canvas.width = Math.max(1, Math.round(Math.min(width, 560) * ratio));
        canvas.height = Math.max(1, Math.round(Math.min(height, 400) * ratio));
        aspect = canvas.width / canvas.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw(seconds, dark) {
        if (disposed || gl.isContextLost()) return;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform1f(uniforms.aspect, aspect);
        gl.uniform1f(uniforms.dark, dark ? 1 : 0);
        const sway = Math.sin(seconds * .24) * .13;
        const lift = Math.sin(seconds * .65) * .035;
        orient(.18, seconds * .11, -.14);
        gl.uniform3f(uniforms.color, .78, .83, .91);
        drawMesh(sphere, .58, 0, 0, lift, 0);
        for (let i = 0; i < 3; i++) {
          orient(.85 + i * .72 + Math.sin(seconds * .22 + i) * .16,
            -.25 + i * .58 + Math.sin(seconds * .17 + i * 1.8) * .2,
            -.4 + i * .5 + sway + seconds * .025 * (i === 1 ? -1 : 1));
          gl.uniform1f(uniforms.phase, seconds * (.55 - i * .065) + i * 2.1);
          const radius = 1.02 + i * .24;
          gl.uniform3f(uniforms.color, i === 1 ? .48 : .72, i === 1 ? .52 : .47, i === 1 ? .61 : .2);
          drawMesh(ring, radius, 1, 0, lift, 0);
          for (let j = 0; j < 2; j++) {
            const a = seconds * (.55 - i * .065) + i * 2.1 + j * Math.PI;
            const px = Math.cos(a) * radius, py = Math.sin(a) * radius;
            const x = matrix[0] * px + matrix[3] * py;
            const y = matrix[1] * px + matrix[4] * py + lift;
            const z = matrix[2] * px + matrix[5] * py;
            gl.uniform3f(uniforms.color, .9, .55, .18);
            drawMesh(sphere, j === 0 ? .064 : .032, 2, x, y, z);
          }
        }
        gl.bindVertexArray(null);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
