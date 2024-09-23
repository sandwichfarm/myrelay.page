<script>
  import { onMount, onDestroy } from "svelte";

  let canvasId = "loadingAnimation"; // You can set this to the ID you want to use
  let canvasElement;
  
  let CANVAS;
  let CTX;
  const CHARS = [];
  const MAX_CHARS = 500;
  const SEPARATION = 0.7;
  let ww, wh, camera, frame;
  let time = 0;

  export const setCanvas = (canvas) => {
    CANVAS = canvas;
    CTX = CANVAS.getContext("2d");
  };

  class Vector {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    rotate(dir, ang) {
      const X = this.x;
      const Y = this.y;
      const Z = this.z;

      const SIN = Math.sin(ang);
      const COS = Math.cos(ang);

      if (dir === "x") {
        this.y = Y * COS - Z * SIN;
        this.z = Y * SIN + Z * COS;
      } else if (dir === "y") {
        this.x = X * COS - Z * SIN;
        this.z = X * SIN + Z * COS;
      }
    }

    project() {
      const ZP = this.z + camera.z;
      const DIV = ZP / wh;
      const XP = (this.x + camera.x) / DIV;
      const YP = (this.y + camera.y) / DIV;
      const CENTER = getCenter();
      return [XP + CENTER[0], YP + CENTER[1], ZP];
    }
  }

  class Char {
    constructor(letter, pos) {
      this.letter = letter;
      this.pos = pos;
    }

    rotate(dir, ang) {
      this.pos.rotate(dir, ang);
    }

    render() {
      const PIXEL = this.pos.project();
      const XP = PIXEL[0];
      const YP = PIXEL[1];
      const MAX_SIZE = 50;
      const SIZE = (1 / PIXEL[2] * MAX_SIZE) | 0;
      const BRIGHTNESS = SIZE / MAX_SIZE;
      const COL = `rgba(255, 255, ${100 * BRIGHTNESS | 0 + 150}, ${BRIGHTNESS})`;

      CTX.beginPath();
      CTX.fillStyle = COL;
      CTX.font = SIZE + "px monospace";
      CTX.fillText(this.letter, XP, YP);
      CTX.fill();
      CTX.closePath();
    }
  }

  function getCenter() {
    return [ww / 2, wh / 2];
  }

  function signedRandom() {
    return Math.random() - Math.random();
  }

  function render() {
    for (let i = 0; i < CHARS.length; i++) {
      CHARS[i].render();
    }
  }

  function update() {
    CTX.clearRect(0, 0, ww, wh);
    for (let i = 0; i < CHARS.length; i++) {
      const DX = 0.005 * Math.sin(time * 0.001);
      const DY = 0.005 * Math.cos(time * 0.001);
      CHARS[i].rotate("x", DX);
      CHARS[i].rotate("y", DY);
    }
    ++time;
  }

  function loop() {
    if (typeof window !== "undefined") {
      frame = window.requestAnimationFrame(loop);
    }
    update();
    render();
  }

  function createChars() {
    for (let i = 0; i < MAX_CHARS; i++) {
      const CHARACTER = String.fromCharCode((Math.random() * 93 + 34) | 0);
      const X = signedRandom() * SEPARATION;
      const Y = signedRandom() * SEPARATION;
      const Z = signedRandom() * SEPARATION;
      const POS = new Vector(X, Y, Z);
      const CHAR = new Char(CHARACTER, POS);
      CHARS.push(CHAR);
    }
  }

  function setDim() {
    if (typeof window !== "undefined") {
      ww = window.innerWidth;
      wh = window.innerHeight;
      CANVAS.width = ww * window.devicePixelRatio | 0;
      CANVAS.height = wh * window.devicePixelRatio | 0;
      CTX.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  export function initCamera() {
    camera = new Vector(0, 0, SEPARATION + 1);
  }

  function resetLoop() {
    setDim();
    initCamera();
    createChars();
  }

  export function startLoop() {
    resetLoop();
    loop();
  }

  export function stopLoop() {
    camera = null;
    CHARS.length = 0;
    if (typeof window !== "undefined") {
      window.cancelAnimationFrame(frame);
    }
  }

  // Initialize when component mounts
  onMount(() => {
    if (typeof window !== "undefined") {
      const canvas = canvasElement || document.getElementById(canvasId);
      if (canvas) {
        setCanvas(canvas);
        window.addEventListener("resize", setDim);
        startLoop();
      }
    }
  });

  // Cleanup when component unmounts
  onDestroy(() => {
    stopLoop();
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", setDim);
    }
  });
</script>

<canvas bind:this={canvasElement} id={canvasId} style="width: 100%; height: 400px;"></canvas>
