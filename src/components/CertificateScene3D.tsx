import { useEffect, useRef } from "react";
import * as THREE from "three";

export const CertificateScene3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 560;
    const H = mount.clientHeight || 400;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointBlue = new THREE.PointLight(0x4f8ef7, 2, 20);
    pointBlue.position.set(-4, 2, 4);
    scene.add(pointBlue);

    const pointGold = new THREE.PointLight(0xf7c948, 1.5, 20);
    pointGold.position.set(4, -2, 4);
    scene.add(pointGold);

    // ── Helper: draw certificate texture ──────────────────────
    const makeCertTexture = (opts: {
      bg: string; accent: string; title: string;
      subtitle: string; level: string; levelColor: string;
      badgeColor: string; org: string;
    }) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 320;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 512, 320);
      grad.addColorStop(0, opts.bg);
      grad.addColorStop(1, shadeColor(opts.bg, -30));
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, 512, 320, 18);
      ctx.fill();

      // Shiny border
      ctx.strokeStyle = opts.accent;
      ctx.lineWidth = 6;
      ctx.roundRect(8, 8, 496, 304, 14);
      ctx.stroke();

      // Inner border (thin)
      ctx.strokeStyle = opts.accent + "60";
      ctx.lineWidth = 1.5;
      ctx.roundRect(20, 20, 472, 280, 10);
      ctx.stroke();

      // Corner ornaments
      drawCornerOrnament(ctx, 30, 30, opts.accent);
      drawCornerOrnament(ctx, 482, 30, opts.accent, true);
      drawCornerOrnament(ctx, 30, 290, opts.accent, false, true);
      drawCornerOrnament(ctx, 482, 290, opts.accent, true, true);

      // Watermark pattern
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.font = "bold 16px sans-serif";
          ctx.fillText("✦", 60 + i * 80, 60 + j * 70);
        }
      }
      ctx.restore();

      // Badge circle (top center)
      const cx = 256, cy = 74;
      const badgeGrad = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 42);
      badgeGrad.addColorStop(0, lightenColor(opts.badgeColor, 40));
      badgeGrad.addColorStop(1, opts.badgeColor);
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fillStyle = badgeGrad;
      ctx.fill();
      ctx.strokeStyle = opts.accent;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Badge shine
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.clip();
      const shine = ctx.createLinearGradient(cx - 42, cy - 42, cx + 20, cy);
      shine.addColorStop(0, "rgba(255,255,255,0.35)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(cx - 42, cy - 42, 84, 84);
      ctx.restore();

      // Badge level text
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 28px 'Arial'`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(opts.level, cx, cy);

      // Title
      ctx.font = "bold 28px 'Georgia', serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 8;
      ctx.fillText(opts.title, 256, 140);
      ctx.shadowBlur = 0;

      // Subtitle
      ctx.font = "15px 'Arial'";
      ctx.fillStyle = opts.accent;
      ctx.fillText(opts.subtitle, 256, 168);

      // Divider line
      const divGrad = ctx.createLinearGradient(80, 0, 432, 0);
      divGrad.addColorStop(0, "transparent");
      divGrad.addColorStop(0.3, opts.accent);
      divGrad.addColorStop(0.7, opts.accent);
      divGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 185); ctx.lineTo(432, 185);
      ctx.stroke();

      // Description
      ctx.font = "13px 'Arial'";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Certificate of Achievement", 256, 208);

      // Org name
      ctx.font = "bold 13px 'Arial'";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(opts.org, 256, 232);

      // Stars row
      const stars = "★ ★ ★ ★ ★";
      ctx.font = "16px sans-serif";
      ctx.fillStyle = opts.accent;
      ctx.fillText(stars, 256, 262);

      // Holographic strip bottom
      const holoGrad = ctx.createLinearGradient(80, 0, 432, 0);
      const hues = [0, 40, 90, 150, 210, 270, 320, 360];
      hues.forEach((h, i) => {
        holoGrad.addColorStop(i / (hues.length - 1), `hsla(${h},80%,65%,0.6)`);
      });
      ctx.fillStyle = holoGrad;
      ctx.roundRect(80, 284, 352, 8, 4);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    };

    // ── IELTS cert — dark blue ────────────────────────────────
    const ieltsGeo = new THREE.BoxGeometry(3.8, 2.4, 0.12);
    const ieltsMats = [
      new THREE.MeshStandardMaterial({ color: 0x1a2340, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1a2340, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1a2340, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1a2340, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({
        map: makeCertTexture({
          bg: "#0d1b3e", accent: "#f7c948",
          title: "IELTS", subtitle: "International English Language Testing",
          level: "7.5", levelColor: "#1a56a0",
          badgeColor: "#1a56a0", org: "British Council / IDP",
        }),
        roughness: 0.15, metalness: 0.3,
      }),
      new THREE.MeshStandardMaterial({ color: 0x0d1b3e, roughness: 0.3, metalness: 0.5 }),
    ];
    const ieltsMesh = new THREE.Mesh(ieltsGeo, ieltsMats);
    ieltsMesh.position.set(-1.2, 0.6, 0);
    ieltsMesh.rotation.set(0.15, -0.3, 0.08);
    ieltsMesh.castShadow = true;
    scene.add(ieltsMesh);

    // ── CEFR cert — deep green ────────────────────────────────
    const cefrGeo = new THREE.BoxGeometry(3.8, 2.4, 0.12);
    const cefrMats = [
      new THREE.MeshStandardMaterial({ color: 0x0d2e1f, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x0d2e1f, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x0d2e1f, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x0d2e1f, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({
        map: makeCertTexture({
          bg: "#0d2e1f", accent: "#48d9a4",
          title: "CEFR", subtitle: "Common European Framework of Reference",
          level: "C1", levelColor: "#1a7a4a",
          badgeColor: "#1a7a4a", org: "Council of Europe",
        }),
        roughness: 0.15, metalness: 0.3,
      }),
      new THREE.MeshStandardMaterial({ color: 0x0d2e1f, roughness: 0.3, metalness: 0.5 }),
    ];
    const cefrMesh = new THREE.Mesh(cefrGeo, cefrMats);
    cefrMesh.position.set(1.2, -0.5, -0.3);
    cefrMesh.rotation.set(-0.1, 0.35, -0.06);
    cefrMesh.castShadow = true;
    scene.add(cefrMesh);

    // ── Floating particles around certs ───────────────────────
    const particleGeo = new THREE.BufferGeometry();
    const count = 60;
    const positions = new Float32Array(count * 3);
    const pColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      const isGold = Math.random() > 0.5;
      pColors[i * 3]     = isGold ? 0.97 : 0.28;
      pColors[i * 3 + 1] = isGold ? 0.79 : 0.85;
      pColors[i * 3 + 2] = isGold ? 0.28 : 0.64;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / W - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / H - 0.5) * 2;
    };
    mount.addEventListener("mousemove", onMouseMove);

    // Touch support
    const onTouch = (e: TouchEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.touches[0].clientX - rect.left) / W - 0.5) * 2;
      mouseY = -((e.touches[0].clientY - rect.top) / H - 0.5) * 2;
    };
    mount.addEventListener("touchmove", onTouch);

    // Resize
    const onResize = () => {
      const nW = mount.clientWidth;
      const nH = mount.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    // Animation
    let frame: number;
    let t = 0;
    let targetRX = 0, targetRY = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;

      targetRX += (mouseY * 0.3 - targetRX) * 0.05;
      targetRY += (mouseX * 0.3 - targetRY) * 0.05;

      // IELTS — yengil tebranish + mouse parallax
      ieltsMesh.rotation.x = 0.15 + Math.sin(t * 0.7) * 0.05 + targetRX * 0.4;
      ieltsMesh.rotation.y = -0.3 + Math.sin(t * 0.5) * 0.08 + targetRY * 0.5;
      ieltsMesh.position.y = 0.6 + Math.sin(t * 0.9) * 0.12;

      // CEFR — boshqa tezlikda tebranish
      cefrMesh.rotation.x = -0.1 + Math.sin(t * 0.6 + 1) * 0.05 + targetRX * 0.3;
      cefrMesh.rotation.y = 0.35 + Math.sin(t * 0.4 + 0.5) * 0.08 + targetRY * 0.4;
      cefrMesh.position.y = -0.5 + Math.sin(t * 0.8 + 2) * 0.10;

      // Particles slow rotation
      particles.rotation.y = t * 0.05;
      particles.rotation.x = t * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: "grab" }}
    />
  );
};

// ── Utility functions ──────────────────────────────────────────
function shadeColor(hex: string, amt: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lightenColor(hex: string, amt: number) {
  return shadeColor(hex, amt);
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  color: string, flipX = false, flipY = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 12); ctx.lineTo(0, 0); ctx.lineTo(12, 0);
  ctx.stroke();
  ctx.restore();
}
