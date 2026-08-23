import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { cursorStore } from '../../lib/cursorStore';

// Raymarched gradient scene with domain-warped fbm + animated palette
function GradientScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }),
    []
  );

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uScroll;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      vec2 mouse = uMouse * 0.5;
      float t = uTime * 0.08;
      
      // Scroll-driven effects
      float scrollNorm = clamp(uScroll / 2000.0, 0.0, 1.0); // 0→1 over 2000px
      float scrollSpeed = abs(dFdx(uScroll)) * 0.01; // Scroll velocity
      float scrollPulse = smoothstep(0.0, 0.3, scrollSpeed); // Fast scroll detection

      // Domain warping — scroll shifts warp offset for parallax depth
      float scrollOffset = scrollNorm * 3.0;
      float n1 = snoise(uv * 2.0 + vec2(t + scrollOffset * 0.3, t * 0.7 - scrollOffset * 0.2));
      float n2 = snoise(uv * 3.0 + vec2(n1 * 1.5 + mouse.x * 0.3, n1 * 1.2 + mouse.y * 0.3 + scrollOffset * 0.15));
      float n3 = snoise(uv * 5.0 + vec2(n2 * 1.2, n2 * 0.8 + t * 0.5));
      float fbm = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

      // Scroll-driven animated color palette
      float hueShift = sin(t * 0.3 + scrollNorm * 2.0) * 0.1;
      float scrollWarmth = scrollNorm * 0.15;
      
      // Colors shift from cool navy → warm indigo → vibrant purple as you scroll
      vec3 color1 = vec3(0.043, 0.075, 0.149 - scrollWarmth * 0.1);
      vec3 color2 = vec3(0.502 + hueShift + scrollWarmth, 0.514 - scrollWarmth * 0.3, 1.0);
      vec3 color3 = vec3(0.365 + scrollWarmth * 0.5, 0.902 + hueShift * 0.5, 1.0 - scrollWarmth);
      vec3 color4 = vec3(0.753 + scrollWarmth * 0.3, 0.757, 1.0 - hueShift + scrollNorm * 0.1);

      // Radial gradient from mouse position
      float mouseDist = length(uv - vec2(0.5) - mouse * 0.3);
      float mouseGlow = smoothstep(0.5, 0.0, mouseDist) * 0.4;

      // Deep color mixing with contrast
      float contrast = 1.3 + scrollPulse * 0.2; // Contrast spikes on fast scroll
      float n = (fbm - 0.5) * contrast + 0.5;
      vec3 color = mix(color1, color2, smoothstep(0.2, 0.6, n));
      color = mix(color, color3, smoothstep(0.5, 0.9, n + mouseGlow));
      color = mix(color, color4, smoothstep(0.7, 1.0, n * n));

      // Emissive hotspots — glow intensifies with scroll speed
      float emissiveBoost = 1.0 + scrollPulse * 0.5;
      color += vec3(0.502, 0.514, 1.0) * mouseGlow * 0.8 * emissiveBoost;
      color += vec3(0.365, 0.902, 1.0) * pow(smoothstep(0.6, 1.0, n), 3.0) * 0.3 * emissiveBoost;

      // Atmospheric fog — depth increases with scroll
      float fogDensity = 0.1 + scrollNorm * 0.15;
      float fog = smoothstep(0.3, 0.8, uv.y) * fogDensity;
      color = mix(color, vec3(0.043, 0.075, 0.149), fog);

      // Film grain — pulses with scroll
      float grain = (fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (0.03 + scrollPulse * 0.02);
      color += grain;

      // Vignette — tightens on fast scroll for drama
      float vigRadius = 0.9 - scrollPulse * 0.1;
      float vig = smoothstep(vigRadius, 0.3, length(uv - 0.5));
      color *= vig * 0.4 + 0.6;

      gl_FragColor = vec4(color, 0.65 + n * 0.15);
    }
  `;

  useFrame(state => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.set(cursorStore.x, cursorStore.y);
    uniforms.uScroll.value = window.scrollY;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Interactive particle system with mouse repulsion + attraction
function InteractiveParticles({ count = 500 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const dataRef = useRef({
    positions: new Float32Array(count * 3),
    velocities: new Float32Array(count * 3),
    basePositions: new Float32Array(count * 3),
    sizes: new Float32Array(count),
  });

  useMemo(() => {
    const { positions, velocities, basePositions, sizes } = dataRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.sin(phi) * Math.sin(theta);
      const pz = radius * Math.cos(phi) - 3;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      basePositions[i3] = px;
      basePositions[i3 + 1] = py;
      basePositions[i3 + 2] = pz;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

      sizes[i] = Math.random() * 0.03 + 0.01;
    }
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!meshRef.current) return;

    const { positions, velocities, basePositions, sizes } = dataRef.current;
    const time = state.clock.elapsedTime;

    // Use shared cursor store
    const mx = cursorStore.x * 5;
    const my = cursorStore.y * 3;
    const mSpeed = cursorStore.getSpeed();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      let px = positions[i3] ?? 0;
      let py = positions[i3 + 1] ?? 0;
      let pz = positions[i3 + 2] ?? 0;

      // Calculate distance to mouse
      const dx = px - mx;
      const dy = py - my;
      const dz = pz - -2;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Attract particles toward cursor when moving fast
      const attractRadius = 3.0 + mSpeed * 2;
      if (dist < attractRadius && dist > 0.01) {
        const force = (1 - dist / attractRadius) * 0.03 * (1 + mSpeed * 0.5);
        px -= (dx / dist) * force;
        py -= (dy / dist) * force;
      }

      // Mouse repulsion force (close range)
      const repulsionRadius = 2.0;
      const repulsionStrength = 0.08;
      if (dist < repulsionRadius && dist > 0.01) {
        const force = (1 - dist / repulsionRadius) * repulsionStrength;
        px += (dx / dist) * force;
        py += (dy / dist) * force;
        pz += (dz / dist) * force;
      }

      // Spring back to base position
      const springK = 0.005;
      const bx = basePositions[i3] ?? 0;
      const by = basePositions[i3 + 1] ?? 0;
      const bz = basePositions[i3 + 2] ?? 0;
      px += (bx - px) * springK;
      py += (by - py) * springK;
      pz += (bz - pz) * springK;

      // Orbital motion
      const angle = time * 0.2 + i * 0.01;
      px += Math.sin(angle) * 0.002;
      py += Math.cos(angle) * 0.002;

      // Apply velocities
      const vx = velocities[i3] ?? 0;
      const vy = velocities[i3 + 1] ?? 0;
      const vz = velocities[i3 + 2] ?? 0;
      px += vx;
      py += vy;
      pz += vz;

      // Write back
      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      // Update instance matrix
      dummy.position.set(px, py, pz);
      const sz = sizes[i] ?? 0.02;
      dummy.scale.setScalar(sz * (1 + Math.sin(time + i) * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#8083ff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// Floating wireframe geometry with cursor tracking + fog
function FloatingGeometry() {
  const groupRef = useRef<THREE.Group>(null);

  const meshes = useMemo(
    () => [
      {
        geo: new THREE.IcosahedronGeometry(0.8, 1),
        pos: [-2, 1, -4] as [number, number, number],
        speed: 0.3,
        rotSpeed: 0.2,
        fogNear: 3,
        fogFar: 8,
      },
      {
        geo: new THREE.OctahedronGeometry(0.6, 0),
        pos: [2.5, -0.5, -3] as [number, number, number],
        speed: 0.4,
        rotSpeed: 0.3,
        fogNear: 2,
        fogFar: 7,
      },
      {
        geo: new THREE.TorusGeometry(0.5, 0.15, 8, 16),
        pos: [0, -1.5, -5] as [number, number, number],
        speed: 0.2,
        rotSpeed: 0.15,
        fogNear: 4,
        fogFar: 9,
      },
      {
        geo: new THREE.IcosahedronGeometry(0.4, 0),
        pos: [-1.5, -1, -3.5] as [number, number, number],
        speed: 0.35,
        rotSpeed: 0.25,
        fogNear: 2.5,
        fogFar: 7.5,
      },
      {
        geo: new THREE.DodecahedronGeometry(0.5, 0),
        pos: [1.5, 1.5, -4.5] as [number, number, number],
        speed: 0.25,
        rotSpeed: 0.18,
        fogNear: 3.5,
        fogFar: 8.5,
      },
    ],
    []
  );

  useFrame(state => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    // Use shared cursor store
    const cx = cursorStore.x;
    const cy = cursorStore.y;
    const scrollNorm = Math.min(window.scrollY / 2000, 1);

    groupRef.current.children.forEach((child, i) => {
      const mesh = meshes[i];
      if (!mesh) return;

      // Floating animation with scroll-driven parallax
      child.position.y = mesh.pos[1] + Math.sin(time * mesh.speed + i) * 0.3 - scrollNorm * 2;
      child.position.x = mesh.pos[0] + Math.cos(time * mesh.speed * 0.7 + i) * 0.2;
      child.position.z = mesh.pos[2] + scrollNorm * 1.5; // Depth shift on scroll

      // Rotation
      child.rotation.x += mesh.rotSpeed * 0.01;
      child.rotation.y += mesh.rotSpeed * 0.015;

      // Cursor-reactive tilt
      const targetRotX = cy * 0.3;
      const targetRotY = cx * 0.3;
      child.rotation.x += (targetRotX - child.rotation.x) * 0.02;
      child.rotation.y += (targetRotY - child.rotation.y) * 0.02;

      // Atmospheric fog — objects fade with distance + scroll
      const meshChild = child as THREE.Mesh;
      if (meshChild.material && 'opacity' in meshChild.material) {
        const mat = meshChild.material as THREE.MeshPhysicalMaterial;
        const baseOpacity = 0.15;
        const fogFade = 1 - scrollNorm * 0.3;
        const mouseProximity =
          1 -
          Math.min(
            Math.sqrt((cx * 5 - child.position.x) ** 2 + (cy * 3 - child.position.y) ** 2) / 10,
            1
          );
        mat.opacity = baseOpacity * fogFade * (1 + mouseProximity * 0.2);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meshes.map((mesh, i) => (
        <mesh key={i} position={mesh.pos} geometry={mesh.geo}>
          <meshPhysicalMaterial
            color={i % 2 === 0 ? '#8083ff' : '#5de6ff'}
            wireframe
            transparent
            opacity={0.15}
            roughness={0.3}
            metalness={0.8}
            envMapIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Scene composition with post-processing
function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#8083ff" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#5de6ff" />

      <GradientScene />
      <InteractiveParticles count={400} />
      <FloatingGeometry />

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.001, 0.001] as any} />
        <Vignette offset={0.3} darkness={0.7} blendFunction={BlendFunction.NORMAL} />
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.1} />
      </EffectComposer>
    </>
  );
}

// Adaptive quality settings
function getQualitySettings() {
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile || cores < 4) {
    return { particles: 100, postProcessing: false, dpr: 1 };
  } else if (cores < 8) {
    return { particles: 250, postProcessing: true, dpr: 1.5 };
  }
  return { particles: 400, postProcessing: true, dpr: 2 };
}

// Main component
export default function WebGLBackground() {
  const [isVisible, setIsVisible] = useState(true);
  const quality = useMemo(() => getQualitySettings(), []);

  useEffect(() => {
    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 -z-10" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, quality.dpr]}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
