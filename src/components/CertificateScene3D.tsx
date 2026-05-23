import { useEffect, useRef } from "react";
import * as THREE from "three";

const IELTS_IMG = "data:image/png;base64,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";
const CERT_IMG  = "data:image/jpeg;base64,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";

export const CertificateScene3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth  || 600;
    const H = mount.clientHeight || 480;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 8); dir.castShadow = true; scene.add(dir);
    const blueL = new THREE.PointLight(0x4f8ef7, 3, 28);
    blueL.position.set(-6, 3, 6); scene.add(blueL);
    const goldL = new THREE.PointLight(0xf7c948, 2.5, 28);
    goldL.position.set(6, -3, 6); scene.add(goldL);

    /* ── Texture loader helper ── */
    const makeTexture = (src: string, imgW: number, imgH: number) => {
      const canvas = document.createElement("canvas");
      // Canvas matches image aspect exactly
      canvas.width  = 512;
      canvas.height = Math.round(512 * imgH / imgW);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const tex = new THREE.CanvasTexture(canvas);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        tex.needsUpdate = true;
      };
      img.src = src;
      return tex;
    };

    /* ── IELTS card — 194×259 portrait ── */
    // Real ratio: 194/259 = 0.749 wide per 1 tall
    // 3D size: width=2.7, height=2.7/0.749=3.6
    const ieltsW = 2.7, ieltsH = 3.6, ieltsD = 0.07;
    const ieltsTex = makeTexture(IELTS_IMG, 194, 259);
    const ieltsMats = [
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: ieltsTex, roughness: 0.06, metalness: 0.03 }),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }),
    ];
    const ieltsMesh = new THREE.Mesh(new THREE.BoxGeometry(ieltsW, ieltsH, ieltsD), ieltsMats);
    ieltsMesh.position.set(-1.3, 0.4, 0.2);
    ieltsMesh.rotation.set(0.12, -0.3, 0.05);
    ieltsMesh.castShadow = true;
    scene.add(ieltsMesh);

    /* ── O'zbek sertifikat — 168×299 portrait ── */
    // Real ratio: 168/299 = 0.562 wide per 1 tall
    // 3D size: width=2.2, height=2.2/0.562=3.9
    const certW2 = 2.2, certH2 = 3.9, certD2 = 0.07;
    const certTex = makeTexture(CERT_IMG, 168, 299);
    const certMats = [
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: certTex, roughness: 0.06, metalness: 0.03 }),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }),
    ];
    const certMesh = new THREE.Mesh(new THREE.BoxGeometry(certW2, certH2, certD2), certMats);
    certMesh.position.set(1.3, -0.3, -0.2);
    certMesh.rotation.set(-0.08, 0.32, -0.04);
    certMesh.castShadow = true;
    scene.add(certMesh);

    /* ── Particles ── */
    const pGeo = new THREE.BufferGeometry();
    const pCount = 70;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i*3]   = (Math.random()-.5)*14;
      pPos[i*3+1] = (Math.random()-.5)*12;
      pPos[i*3+2] = (Math.random()-.5)*6;
      const t = Math.random();
      if (t < .33) { pCol[i*3]=.97; pCol[i*3+1]=.79; pCol[i*3+2]=.28; }
      else if (t < .66) { pCol[i*3]=.28; pCol[i*3+1]=.85; pCol[i*3+2]=.64; }
      else { pCol[i*3]=.31; pCol[i*3+1]=.56; pCol[i*3+2]=.97; }
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(pGeo,
      new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.7 }));
    scene.add(particles);

    /* ── Mouse / drag interaction ── */
    let mouseX = 0, mouseY = 0;
    let isDragging = false, lastMX = 0;
    let autoRotate = true, manualY = 0;
    let targetRX = 0, targetRY = 0;

    const onMM = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / W - .5) * 2;
      mouseY = -((e.clientY - r.top)  / H - .5) * 2;
      if (isDragging) { manualY += (e.clientX - lastMX) * 0.008; lastMX = e.clientX; autoRotate = false; }
    };
    const onMD = (e: MouseEvent) => { isDragging = true; lastMX = e.clientX; mount.style.cursor = "grabbing"; };
    const onMU = () => { isDragging = false; mount.style.cursor = "grab"; setTimeout(() => autoRotate = true, 2500); };
    mount.addEventListener("mousemove", onMM);
    mount.addEventListener("mousedown", onMD);
    window.addEventListener("mouseup",  onMU);

    let lastTX = 0;
    mount.addEventListener("touchstart", (e) => { lastTX = e.touches[0].clientX; autoRotate = false; });
    mount.addEventListener("touchmove",  (e) => { manualY += (e.touches[0].clientX - lastTX) * .01; lastTX = e.touches[0].clientX; });
    mount.addEventListener("touchend",   () => { setTimeout(() => autoRotate = true, 2500); });

    const onResize = () => {
      const nW = mount.clientWidth, nH = mount.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix(); renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    /* ── Animation ── */
    let frame: number, t = 0, autoAngle = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.007;
      if (autoRotate) autoAngle += 0.005;
      targetRX += (mouseY * 0.18 - targetRX) * 0.04;
      targetRY += (mouseX * 0.18 - targetRY) * 0.04;
      const baseY = autoRotate ? autoAngle : manualY;

      ieltsMesh.rotation.x = 0.12 + Math.sin(t * .6)  * .05 + targetRX * .4;
      ieltsMesh.rotation.y = baseY - 0.30 + Math.sin(t * .4)  * .04 + targetRY * .4;
      ieltsMesh.position.y = 0.40 + Math.sin(t * .9)  * .13;

      certMesh.rotation.x  = -0.08 + Math.sin(t * .5 + 1.5) * .05 + targetRX * .3;
      certMesh.rotation.y  = baseY + 0.32 + Math.sin(t * .35 + .8) * .04 + targetRY * .3;
      certMesh.position.y  = -0.30 + Math.sin(t * .8 + 2)  * .11;

      particles.rotation.y = t * .035;
      particles.rotation.x = t * .015;
      blueL.position.x = Math.sin(t * .5) * 6;
      goldL.position.x = Math.cos(t * .4) * 6;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("mousemove", onMM);
      mount.removeEventListener("mousedown", onMD);
      window.removeEventListener("mouseup",  onMU);
      window.removeEventListener("resize",   onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: "grab", minHeight: "480px" }}
    />
  );
};
