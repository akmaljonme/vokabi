import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const CertificateScene3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(6, 10, 8);
    dir.castShadow = true;
    scene.add(dir);

    const blueLight = new THREE.PointLight(0x4f8ef7, 3, 25);
    blueLight.position.set(-5, 3, 5);
    scene.add(blueLight);

    const goldLight = new THREE.PointLight(0xf7c948, 2.5, 25);
    goldLight.position.set(5, -3, 5);
    scene.add(goldLight);

    const greenLight = new THREE.PointLight(0x48d9a4, 2, 20);
    greenLight.position.set(0, -5, 3);
    scene.add(greenLight);

    // ── Certificate texture builder ────────────────────────────
    const makeCertTexture = (opts: {
      bg: string; accent: string; title: string;
      subtitle: string; level: string; levelColor: string;
      badgeColor: string; org: string; logoText: string;
    }) => {
      const canvas = document.createElement("canvas");
      canvas.width = 768; canvas.height = 480;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 768, 480);
      grad.addColorStop(0, opts.bg);
      grad.addColorStop(0.5, shadeColor(opts.bg, 15));
      grad.addColorStop(1, shadeColor(opts.bg, -20));
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, 768, 480, 24);
      ctx.fill();

      // Subtle grid pattern
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      for (let x = 0; x < 768; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
      }
      for (let y = 0; y < 480; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(768, y); ctx.stroke();
      }
      ctx.restore();

      // Outer border (gold/accent)
      const borderGrad = ctx.createLinearGradient(0, 0, 768, 480);
      borderGrad.addColorStop(0, opts.accent);
      borderGrad.addColorStop(0.5, lightenColor(opts.accent, 40));
      borderGrad.addColorStop(1, opts.accent);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 7;
      ctx.roundRect(10, 10, 748, 460, 18);
      ctx.stroke();

      // Inner border
      ctx.strokeStyle = opts.accent + "40";
      ctx.lineWidth = 1.5;
      ctx.roundRect(24, 24, 720, 432, 12);
      ctx.stroke();

      // Corner ornaments
      [
        [36, 36, false, false], [732, 36, true, false],
        [36, 444, false, true], [732, 444, true, true],
      ].forEach(([x, y, fx, fy]) => drawCornerOrnament(ctx, x as number, y as number, opts.accent, fx as boolean, fy as boolean));

      // ── Logo badge (left side) ──────────────────────────────
      const badgeX = 100, badgeY = 170;
      const badgeR = 58;
      const bGrad = ctx.createRadialGradient(badgeX - 15, badgeY - 15, 5, badgeX, badgeY, badgeR);
      bGrad.addColorStop(0, lightenColor(opts.badgeColor, 50));
      bGrad.addColorStop(1, opts.badgeColor);
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = bGrad;
      ctx.fill();
      ctx.strokeStyle = opts.accent;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Badge shine
      ctx.save();
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.clip();
      const shine = ctx.createLinearGradient(badgeX - badgeR, badgeY - badgeR, badgeX + 10, badgeY);
      shine.addColorStop(0, "rgba(255,255,255,0.4)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(badgeX - badgeR, badgeY - badgeR, badgeR * 2, badgeR * 2);
      ctx.restore();

      // Badge level text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px 'Arial Black', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText(opts.level, badgeX, badgeY);
      ctx.shadowBlur = 0;

      // Decorative ring around badge
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR + 12, 0, Math.PI * 2);
      ctx.strokeStyle = opts.accent + "30";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Main title ─────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.font = "bold 52px 'Georgia', 'Times New Roman', serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      ctx.fillText(opts.title, 180, 120);
      ctx.shadowBlur = 0;

      // Logo text small
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = opts.accent;
      ctx.fillText(opts.logoText, 180, 148);

      // Subtitle
      ctx.font = "13px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(opts.subtitle, 180, 168);

      // Divider
      const divGrad = ctx.createLinearGradient(180, 0, 720, 0);
      divGrad.addColorStop(0, opts.accent);
      divGrad.addColorStop(0.7, opts.accent + "80");
      divGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(180, 195); ctx.lineTo(720, 195);
      ctx.stroke();

      // Score/band label
      ctx.font = "12px Arial";
      ctx.fillStyle = opts.accent + "cc";
      ctx.fillText("BAND SCORE", 180, 228);

      ctx.font = "bold 44px 'Georgia', serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10;
      ctx.fillText(opts.level, 180, 278);
      ctx.shadowBlur = 0;

      // Stars
      ctx.font = "22px sans-serif";
      ctx.fillStyle = opts.accent;
      ctx.fillText("★ ★ ★ ★ ★", 340, 268);

      // Org name
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(opts.org, 180, 320);

      // "Certificate of Achievement"
      ctx.font = "italic 13px 'Georgia', serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("Certificate of Achievement in English Proficiency", 180, 348);

      // Bottom seal line
      ctx.beginPath();
      ctx.moveTo(180, 390); ctx.lineTo(400, 390);
      ctx.strokeStyle = opts.accent + "60";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "10px Arial";
      ctx.fillStyle = opts.accent + "99";
      ctx.fillText("OFFICIAL CERTIFICATION", 180, 408);

      // Holographic rainbow strip
      const holoGrad = ctx.createLinearGradient(180, 0, 720, 0);
      [0, 50, 100, 160, 220, 280, 330, 360].forEach((h, i, arr) => {
        holoGrad.addColorStop(i / (arr.length - 1), `hsla(${h},85%,65%,0.7)`);
      });
      ctx.fillStyle = holoGrad;
      ctx.roundRect(180, 448, 540, 8, 4);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    };

    // ── IELTS Certificate ─────────────────────────────────────
    const certW = 4.6, certH = 2.9, certD = 0.10;
    const ieltsGeo = new THREE.BoxGeometry(certW, certH, certD);
    const ieltsTex = makeCertTexture({
      bg: "#0a1628", accent: "#f7c948",
      title: "IELTS", subtitle: "International English Language Testing System",
      level: "7.5", levelColor: "#1a3a7a",
      badgeColor: "#1a4090", org: "British Council / IDP / Cambridge",
      logoText: "ACADEMIC MODULE",
    });
    const ieltsMats = [
      new THREE.MeshStandardMaterial({ color: 0x071020, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x071020, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x071020, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x071020, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: ieltsTex, roughness: 0.1, metalness: 0.25 }),
      new THREE.MeshStandardMaterial({ color: 0x071020, roughness: 0.2, metalness: 0.6 }),
    ];
    const ieltsMesh = new THREE.Mesh(ieltsGeo, ieltsMats);
    ieltsMesh.position.set(-0.8, 0.85, 0.1);
    ieltsMesh.rotation.set(0.18, -0.22, 0.07);
    ieltsMesh.castShadow = true;
    scene.add(ieltsMesh);

    // ── CEFR Certificate ──────────────────────────────────────
    const cefrGeo = new THREE.BoxGeometry(certW, certH, certD);
    const cefrTex = makeCertTexture({
      bg: "#071f14", accent: "#48d9a4",
      title: "CEFR", subtitle: "Common European Framework of Reference for Languages",
      level: "C1", levelColor: "#0e5c33",
      badgeColor: "#0e6b3a", org: "Council of Europe — Language Policy",
      logoText: "ADVANCED LEVEL",
    });
    const cefrMats = [
      new THREE.MeshStandardMaterial({ color: 0x05120d, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x05120d, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x05120d, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x05120d, roughness: 0.2, metalness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: cefrTex, roughness: 0.1, metalness: 0.25 }),
      new THREE.MeshStandardMaterial({ color: 0x05120d, roughness: 0.2, metalness: 0.6 }),
    ];
    const cefrMesh = new THREE.Mesh(cefrGeo, cefrMats);
    cefrMesh.position.set(0.8, -0.85, -0.15);
    cefrMesh.rotation.set(-0.12, 0.28, -0.05);
    cefrMesh.castShadow = true;
    scene.add(cefrMesh);

    // ── Floating particles ─────────────────────────────────────
    const particleGeo = new THREE.BufferGeometry();
    const count = 80;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const t = Math.random();
      if (t < 0.33) { colors[i*3]=0.97; colors[i*3+1]=0.79; colors[i*3+2]=0.28; } // gold
      else if (t < 0.66) { colors[i*3]=0.28; colors[i*3+1]=0.85; colors[i*3+2]=0.64; } // green
      else { colors[i*3]=0.31; colors[i*3+1]=0.56; colors[i*3+2]=0.97; } // blue
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Mouse / Touch interaction ──────────────────────────────
    let mouseX = 0, mouseY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let autoRotate = true;
    let manualRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / W - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / H - 0.5) * 2;
      if (isDragging) {
        const dx = e.clientX - lastMouseX;
        manualRotY += dx * 0.008;
        lastMouseX = e.clientX;
        autoRotate = false;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      mount.style.cursor = "grabbing";
    };
    const onMouseUp = () => {
      isDragging = false;
      mount.style.cursor = "grab";
      setTimeout(() => { autoRotate = true; }, 2000);
    };

    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Touch
    let lastTouchX = 0;
    const onTouchStart = (e: TouchEvent) => { lastTouchX = e.touches[0].clientX; autoRotate = false; };
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - lastTouchX;
      manualRotY += dx * 0.01;
      lastTouchX = e.touches[0].clientX;
    };
    const onTouchEnd = () => { setTimeout(() => { autoRotate = true; }, 2000); };
    mount.addEventListener("touchstart", onTouchStart);
    mount.addEventListener("touchmove", onTouchMove);
    mount.addEventListener("touchend", onTouchEnd);

    // Resize
    const onResize = () => {
      const nW = mount.clientWidth;
      const nH = mount.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ─────────────────────────────────────────
    let frame: number;
    let t = 0;
    let targetRX = 0, targetRY = 0;
    let autoAngle = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;

      if (autoRotate) {
        autoAngle += 0.006;
      }

      targetRX += (mouseY * 0.25 - targetRX) * 0.04;
      targetRY += (mouseX * 0.25 - targetRY) * 0.04;

      const baseRotY = autoRotate ? autoAngle : manualRotY;

      // IELTS cert
      ieltsMesh.rotation.x = 0.18 + Math.sin(t * 0.6) * 0.06 + targetRX * 0.5;
      ieltsMesh.rotation.y = baseRotY - 0.22 + Math.sin(t * 0.4) * 0.05 + targetRY * 0.5;
      ieltsMesh.position.y = 0.85 + Math.sin(t * 0.9) * 0.14;
      ieltsMesh.position.z = 0.1 + Math.sin(t * 0.7) * 0.08;

      // CEFR cert — offset by half rotation for nice interplay
      cefrMesh.rotation.x = -0.12 + Math.sin(t * 0.5 + 1.5) * 0.06 + targetRX * 0.4;
      cefrMesh.rotation.y = baseRotY + 0.28 + Math.sin(t * 0.35 + 0.8) * 0.05 + targetRY * 0.4;
      cefrMesh.position.y = -0.85 + Math.sin(t * 0.8 + 2) * 0.12;
      cefrMesh.position.z = -0.15 + Math.sin(t * 0.6 + 1) * 0.06;

      // Particles
      particles.rotation.y = t * 0.04 + targetRY * 0.1;
      particles.rotation.x = t * 0.02 + targetRX * 0.08;

      // Dynamic lights
      blueLight.position.x = Math.sin(t * 0.5) * 5 + targetRX * 2;
      goldLight.position.x = Math.cos(t * 0.4) * 5 + targetRY * 2;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      mount.removeEventListener("touchstart", onTouchStart);
      mount.removeEventListener("touchmove", onTouchMove);
      mount.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: "grab", minHeight: "420px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
};

// ── Utilities ──────────────────────────────────────────────────
function shadeColor(hex: string, amt: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function lightenColor(hex: string, amt: number) { return shadeColor(hex, amt); }
function drawCornerOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 18); ctx.lineTo(0, 0); ctx.lineTo(18, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI / 2);
  ctx.stroke();
  ctx.restore();
}
