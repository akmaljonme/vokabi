import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

export const Background3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return; // mobilda o'chirilgan — battery/perf uchun

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // CSS variable dan primary rang olish — xavfsiz parsing
    let primaryColor = new THREE.Color(0x6366f1); // default indigo
    let accentColor = new THREE.Color(0x8b5cf6);
    let mutedColor = new THREE.Color(0xa78bfa);
    try {
      const style = getComputedStyle(document.documentElement);
      const primaryHSL = style.getPropertyValue("--primary").trim();
      if (primaryHSL) {
        const parts = primaryHSL.split(" ").map((v: string) => parseFloat(v));
        if (parts.length >= 3 && !parts.some(isNaN)) {
          const [h, s, l] = parts;
          primaryColor = new THREE.Color().setHSL(h / 360, s / 100, l / 100);
          accentColor = new THREE.Color().setHSL((h + 60) / 360, s / 100, l / 100);
          mutedColor = new THREE.Color().setHSL(h / 360, (s - 20) / 100, (l + 20) / 100);
        }
      }
    } catch {
      // default ranglar ishlatiladi
    }

    // --- Shapes ---
    const shapes: THREE.Mesh[] = [];
    const COUNT = 28;

    const geometries = [
      new THREE.OctahedronGeometry(0.7, 0),
      new THREE.TetrahedronGeometry(0.8, 0),
      new THREE.IcosahedronGeometry(0.6, 0),
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.TorusGeometry(0.5, 0.18, 8, 16),
    ];

    const colors = [primaryColor, accentColor, mutedColor];

    for (let i = 0; i < COUNT; i++) {
      const geo = geometries[Math.floor(Math.random() * geometries.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.06 + Math.random() * 0.08,
        wireframe: Math.random() > 0.5,
        roughness: 0.4,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(geo, mat);

      // Random position — keng tarqalgan
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40
      );

      // Random rotation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const scale = 0.5 + Math.random() * 2.5;
      mesh.scale.setScalar(scale);

      // Custom data for animation
      (mesh as any)._speed = {
        rx: (Math.random() - 0.5) * 0.003,
        ry: (Math.random() - 0.5) * 0.004,
        rz: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.008,
        yBase: mesh.position.y,
        yPhase: Math.random() * Math.PI * 2,
      };

      scene.add(mesh);
      shapes.push(mesh);
    }

    // Ambient + Point lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(primaryColor, 2, 60);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(accentColor, 1.5, 60);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Scroll parallax
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    let frameId: number;
    let t = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.01;

      // Smooth mouse follow
      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;

      // Camera subtle movement
      camera.position.x += (targetX * 3 - camera.position.x) * 0.02;
      camera.position.y += (-targetY * 3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Scroll effect — shapes drift upward as user scrolls
      const scrollOffset = scrollY * 0.008;

      shapes.forEach((mesh) => {
        const sp = (mesh as any)._speed;
        mesh.rotation.x += sp.rx;
        mesh.rotation.y += sp.ry;
        mesh.rotation.z += sp.rz;
        // Floating up-down
        mesh.position.y = sp.yBase + Math.sin(t + sp.yPhase) * 1.5 - scrollOffset * 0.3;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometries.forEach((g) => g.dispose());
      shapes.forEach((m) => (m.material as THREE.Material).dispose());
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
