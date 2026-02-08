// Galaxy background renderer (Milky Way style) with scroll-to-zoom
(function(){
    const canvas = document.getElementById('galaxyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = window.devicePixelRatio || 1;

    // galaxy state
    let stars = [];
    let farStars = [];
    const BASE_STAR_COUNT = 1400; // base default (will scale with screen)
    const ARMS = 4;
    let baseRotation = 0;
    // settings (exposed via controls)
    const settings = { intensity: 0.8, lux: false };

    // zoom control
    let zoom = 1;
    let targetZoom = 1;
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;

    function resize(){
        DPR = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR,0,0,DPR,0,0);
    }

    function randRange(a,b){ return a + Math.random()*(b-a); }

    function buildStars(){
        const scale = Math.max(0.6, Math.min(1.6, (W * H) / (1280*720)) );
        const starCount = Math.floor(BASE_STAR_COUNT * scale * (0.6 + settings.intensity));
        stars = new Array(starCount);
        farStars = new Array(Math.floor(starCount * 0.25));
        const maxR = Math.sqrt(W*W + H*H) * 0.6;
        for (let i=0;i<starCount;i++){
            const t = Math.pow(Math.random(), 0.7);
            const arm = i % ARMS;
            const armOffset = (arm / ARMS) * Math.PI*2;
            const angleNoise = (Math.random()-0.5) * 0.6;
            const twist = 4 + Math.random()*6;
            const r = t * maxR * (0.7 + Math.random()*0.5);
            const angle = armOffset + twist * (r / maxR) + angleNoise;
            const size = Math.max(0.5, Math.random()*2.4 * (1 - t*0.6));
            const brightness = 0.45 + Math.random()*0.7;
            const hue = 190 + Math.random()*160;
            stars[i] = { r, angle, size, brightness, hue, armOffset, twist, wobble: Math.random()*1000, depth: Math.random() };
        }
        for (let i=0;i<farStars.length;i++){
            farStars[i] = { x: (Math.random()-0.5)*W*1.6, y: (Math.random()-0.5)*H*1.2, size: Math.random()*1.4, hue: 200 + Math.random()*100, alpha: 0.08 + Math.random()*0.12 };
        }
    }

    function draw(){
        ctx.clearRect(0,0,W,H);

        // background subtle gradient
        const g = ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0, '#02021a');
        g.addColorStop(1, '#071127');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);

        ctx.save();
        // center coordinate system
        const cx = W/2, cy = H/2;
        ctx.translate(cx, cy);
        // apply zoom and a slow rotation
        baseRotation += 0.0006;
        zoom += (targetZoom - zoom) * 0.08; // smooth lerp
        ctx.scale(zoom, zoom);
        ctx.rotate(baseRotation);

        // draw faint galactic band + nebula blobs (lux mode enhances)
        const band = ctx.createRadialGradient(0,0,0,0,0,Math.min(W,H)*0.9);
        const bandAlpha = 0.02 * settings.intensity * (settings.lux ? 1.6 : 1);
        band.addColorStop(0, `rgba(255,255,255,${bandAlpha})`);
        band.addColorStop(0.35, `rgba(180,200,255,${bandAlpha*0.45})`);
        band.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = band;
        ctx.beginPath(); ctx.arc(0,0,Math.min(W,H)*0.9,0,Math.PI*2); ctx.fill();

        // nebula glow blobs for luxurious feel
        if (settings.intensity > 0.08) {
            for (let n=0;n<3;n++){
                const nx = Math.cos(n*2.1 + baseRotation*0.4) * Math.min(W,H)*0.18;
                const ny = Math.sin(n*1.7 - baseRotation*0.35) * Math.min(W,H)*0.12;
                const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, Math.min(W,H)*0.8);
                const cA = 0.08 * settings.intensity * (settings.lux ? 1.8 : 1);
                ng.addColorStop(0, `rgba(120,100,255,${cA})`);
                ng.addColorStop(0.3, `rgba(100,160,255,${cA*0.35})`);
                ng.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(nx, ny, Math.min(W,H)*0.8, 0, Math.PI*2); ctx.fill();
            }
        }

        // draw spiral arms glow (broad strokes)
        for (let a = 0; a < ARMS; a++){
            ctx.beginPath();
            ctx.lineWidth = Math.min(W,H) * (0.08 + 0.04 * settings.intensity);
            ctx.strokeStyle = `rgba(140,170,255,${0.03 * settings.intensity})`;
            ctx.arc(0,0,Math.min(W,H)*0.4, a*(Math.PI*2/ARMS) - 0.22, a*(Math.PI*2/ARMS) + 0.22);
            ctx.stroke();
        }

        // draw stars (two layers: farStars static, main spiral stars)
        // far stars (background) - faint
        for (let i=0;i<farStars.length;i++){
            const f = farStars[i];
            ctx.beginPath();
            ctx.fillStyle = `hsla(${f.hue},70%,70%,${f.alpha * settings.intensity})`;
            ctx.arc(f.x/zoom, f.y/zoom, f.size * (0.6 + settings.intensity), 0, Math.PI*2);
            ctx.fill();
        }

        // main spiral stars
        for (let i=0;i<stars.length;i++){
            const s = stars[i];
            const wobble = Math.sin((Date.now()+s.wobble)*0.001 + i) * 0.6;
            const r = s.r * (0.985 + 0.003 * Math.sin((Date.now()*0.0003)+(i%7)));
            const a = s.angle + (Math.sin((Date.now()*0.00012) + i)*0.02);
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r * 0.65;
            const distNorm = Math.min(1, r / (Math.min(W,H)*0.5));
            let b = s.brightness * (1.3 - distNorm*1.0) * settings.intensity;
            const size = s.size * (1.6 - distNorm*1.0) * (1 + (settings.lux ? 0.6 : 0));

            if (Math.abs(x) > (W*1.4/zoom) || Math.abs(y) > (H*1.4/zoom)) continue;

            ctx.beginPath();
            const hue = s.hue;
            ctx.fillStyle = `hsla(${hue},85%,60%,${b})`;
            // boosted glow in lux mode
            ctx.shadowColor = `hsla(${hue},85%,60%,${b})`;
            ctx.shadowBlur = (6 + (settings.lux ? 18 : 0)) * (1.2 - distNorm) * settings.intensity;
            ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    // animation loop
    let raf;
    function loop(){
        draw();
        // if background audio exists, nudge audio parameters from zoom
        try{
            if (window.bgAudio && typeof window.bgAudio.setIntensity === 'function'){
                // map zoom(1..4) to intensity 0..1
                const z = Math.min(1, (zoom - 1) / (ZOOM_MAX - 1));
                window.bgAudio.setIntensity(Math.max(0, Math.min(1, settings.intensity * (0.4 + z*0.8))));
                // subtle pan based on rotation
                const pan = Math.sin(baseRotation*0.4) * 0.4;
                window.bgAudio.setPan(pan);
            }
        }catch(e){ /* ignore */ }
        raf = requestAnimationFrame(loop);
    }

    // map window scroll to targetZoom
    function updateZoomFromScroll(){
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const scroll = docH > 0 ? (window.scrollY / docH) : 0;
        // zoom between 1 and 1 + scroll*3 (clamped)
        targetZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, 1 + scroll * 3));
    }

    // wheel also nudges zoom for direct control
    function onWheel(e){
        // invert wheel: scrolling down (positive deltaY) should zoom in
        const delta = -e.deltaY * 0.0015;
        targetZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, targetZoom + delta));
        // slight damp to avoid interfering with natural scroll
        setTimeout(updateZoomFromScroll, 80);
    }

    // touch / wheel smoothing
    let wheelTimeout;
    function onUserScroll(){
        updateZoomFromScroll();
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(()=>{ updateZoomFromScroll(); }, 120);
    }

    function start(){
        resize();
        buildStars();
        loop();
        // bind events
        window.addEventListener('resize', ()=>{ resize(); buildStars(); });
        window.addEventListener('scroll', onUserScroll, { passive: true });
        window.addEventListener('wheel', onWheel, { passive: true });

        // also allow double-tap/click to reset zoom
        window.addEventListener('dblclick', ()=>{ targetZoom = 1; });

        // expose simple API to control settings from DOM
        window.galaxyControls = {
            setIntensity(v){ settings.intensity = Math.max(0, Math.min(1, v)); buildStars(); },
            toggleLux(on){ settings.lux = !!on; },
            resetZoom(){ targetZoom = 1; }
        };

        // try to read slider if present
        const slider = document.getElementById('galaxyIntensity');
        if (slider){
            slider.value = settings.intensity;
            slider.addEventListener('input', (e)=>{ const v = parseFloat(e.target.value); window.galaxyControls.setIntensity(v); });
        }
        const luxBtn = document.getElementById('luxToggle');
        if (luxBtn){ luxBtn.addEventListener('click', ()=>{ settings.lux = !settings.lux; luxBtn.classList.toggle('active', settings.lux); }); }
        const resetBtn = document.getElementById('resetGalaxy');
        if (resetBtn){ resetBtn.addEventListener('click', ()=>{ window.galaxyControls.resetZoom(); }); }

        // attach toggle button to show/hide control panel
        const toggleBtn = document.getElementById('galaxyToggle');
        if (toggleBtn){
            const panel = document.getElementById('galaxyControls');
            if (panel) panel.style.display = 'none';
            toggleBtn.addEventListener('click', ()=>{ if (!panel) return; panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none'; });
        }

        // initialize zoom from current scroll
        updateZoomFromScroll();
    }

    // ensure we start after DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') start();
    else document.addEventListener('DOMContentLoaded', start);

})();
