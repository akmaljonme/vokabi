import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

export const Scene3DStats = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || isMobile) return;

    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0x6ee7f7, 2);
    dl.position.set(5, 5, 5);
    scene.add(dl);
    const pl = new THREE.PointLight(0xa78bfa, 3, 30);
    pl.position.set(-5, 2, 3);
    scene.add(pl);

    // Floating rings
    const rings: THREE.Mesh[] = [];
    const ringColors = [0x6ee7f7, 0xa78bfa, 0x34d399, 0xf59e0b];
    ringColors.forEach((color, i) => {
      const geo = new THREE.TorusGeometry(1.2 + i * 0.6, 0.04, 16, 80);
      const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 3 + i * 0.4;
      ring.rotation.y = i * 0.7;
      scene.add(ring);
      rings.push(ring);
    });

    // Central glowing sphere
    const sphereGeo = new THREE.SphereGeometry(0.8, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7f7, metalness: 1, roughness: 0,
      emissive: 0x6ee7f7, emissiveIntensity: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Orbiting dots
    const dots: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.06, 8, 8);
      const color = ringColors[i % ringColors.length];
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      dots.push({ mesh, angle: (i / 12) * Math.PI * 2, radius: 1.5 + (i % 3) * 0.8, speed: 0.008 + i * 0.001, yOffset: Math.sin(i) * 0.5 });
    }

    let frame: number, t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.01;
      rings.forEach((r, i) => { r.rotation.z += 0.003 + i * 0.001; r.rotation.x += 0.001; });
      sphere.rotation.y = t * 0.3;
      dots.forEach(d => {
        d.angle += d.speed;
        d.mesh.position.set(Math.cos(d.angle) * d.radius, d.yOffset + Math.sin(t + d.angle) * 0.3, Math.sin(d.angle) * d.radius);
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = mount.clientWidth, nH = mount.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [isMobile]);

  return <div ref={mountRef} className="w-full h-full" />;
};
