import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

export const HowItWorks3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || isMobile) return;

    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 1.5);
    dl.position.set(3, 5, 5);
    scene.add(dl);

    // 3 step nodes connected by lines
    const stepColors = [0x6ee7f7, 0xa78bfa, 0x34d399];
    const stepPositions = [[-3.5, 0, 0], [0, 0, 0], [3.5, 0, 0]] as [number, number, number][];
    const nodes: THREE.Mesh[] = [];

    stepPositions.forEach(([x, y, z], i) => {
      // Outer ring
      const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 16, 60);
      const ringMat = new THREE.MeshStandardMaterial({ color: stepColors[i], metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      scene.add(ring);

      // Inner sphere
      const sGeo = new THREE.SphereGeometry(0.35, 32, 32);
      const sMat = new THREE.MeshStandardMaterial({ color: stepColors[i], metalness: 1, roughness: 0, emissive: stepColors[i], emissiveIntensity: 0.4 });
      const sphere = new THREE.Mesh(sGeo, sMat);
      sphere.position.set(x, y, z);
      scene.add(sphere);
      nodes.push(ring);

      // Point light at each node
      const pl = new THREE.PointLight(stepColors[i], 2, 8);
      pl.position.set(x, y, z);
      scene.add(pl);
    });

    // Connection lines
    for (let i = 0; i < 2; i++) {
      const points = [
        new THREE.Vector3(stepPositions[i][0] + 0.7, 0, 0),
        new THREE.Vector3(stepPositions[i + 1][0] - 0.7, 0, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.15, transparent: true });
      scene.add(new THREE.Line(geo, mat));
    }

    // Floating particles
    const partGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(120);
    for (let i = 0; i < 40; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.4 })));

    let frame: number, t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.01;
      nodes.forEach((r, i) => {
        r.rotation.z += 0.01 + i * 0.003;
        r.position.y = Math.sin(t + i * 1.2) * 0.15;
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = mount.clientWidth, nH = mount.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix(); renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); renderer.dispose(); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, [isMobile]);

  return <div ref={mountRef} className="w-full h-full" />;
};
