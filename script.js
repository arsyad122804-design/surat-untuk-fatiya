// --- STATE MANAGEMENT ---
let isEnvelopeOpen = false;
let isMusicPlaying = false;
let activeEnvelope = null;
let currentVideoId = 'cSFiGd6hDLE'; // Single background song

// Surprise Message Tracking
const readEnvelopes = new Set();
let isSurpriseActive = false;
let surpriseShown = false; // Ensure surprise triggers only once

// DOM Elements
const appContainer = document.getElementById('appContainer');
const resetBtn = document.getElementById('resetBtn');
const musicToggle = document.getElementById('musicToggle');
const instruction = document.getElementById('instruction');
const surpriseOverlay = document.getElementById('surpriseOverlay');
const closeSurpriseBtn = document.getElementById('closeSurprise');

// --- 3D PARALLAX TILT EFFECT (INDIVIDUAL ENVELOPES) ---
const wrappers = document.querySelectorAll('.envelope-wrapper');
wrappers.forEach(wrap => {
    const item = wrap.closest('.envelope-item');
    
    item.addEventListener('mousemove', (e) => {
        if (isEnvelopeOpen || isSurpriseActive) return; // Disable hover tilt when reading
        
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        
        const rY = (x / (rect.width / 2)) * 15; // Max tilt Y: 15deg
        const rX = -(y / (rect.height / 2)) * 15; // Max tilt X: 15deg
        
        wrap.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
    });
    
    item.addEventListener('mouseleave', () => {
        if (!wrap.closest('.active-item')) {
            wrap.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    });
});

// --- YOUTUBE MUSIC PLAYER ---
let ytPlayer = null;
let isYTAPIReady = false;

// Load YouTube Iframe API dynamically
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Automatically called when YouTube API is loaded (must be global for YT API)
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        videoId: currentVideoId,
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'rel': 0,
            'loop': 1,
            'playlist': currentVideoId
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    isYTAPIReady = true;
    // Auto-play background music as soon as player is ready
    startMusic(currentVideoId);
}

// Custom loop listener (loops video when ended)
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && isMusicPlaying) {
        ytPlayer.playVideo();
    }
}

function startMusic(videoId) {
    isMusicPlaying = true;
    musicToggle.classList.add('playing');
    musicToggle.querySelector('.music-text').textContent = 'Matikan Musik 🔇';
    
    if (ytPlayer && isYTAPIReady) {
        if (currentVideoId !== videoId) {
            currentVideoId = videoId;
            ytPlayer.loadVideoById({
                videoId: videoId
            });
        } else {
            ytPlayer.playVideo();
        }
        ytPlayer.setVolume(50); // Mellow 50% volume
    }
}

function stopMusic() {
    isMusicPlaying = false;
    musicToggle.classList.remove('playing');
    musicToggle.querySelector('.music-text').textContent = 'Putar Musik 🎵';
    
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
    }
}

// Toggle music trigger button
musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMusicPlaying) {
        stopMusic();
    } else {
        startMusic(currentVideoId);
    }
});

// --- LOVE & FIREWORKS PARTICLES CANVAS SYSTEM ---
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let rockets = [];
let shimmers = [];
let ambientSpawntimer = 0;

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Standard heart/sparkle class
class Particle {
    constructor(x, y, isBurst = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 12 + 6;
        this.speedX = isBurst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 2;
        this.speedY = isBurst ? (Math.random() * -12) - 4 : (Math.random() * -2) - 1.5;
        this.opacity = 1;
        this.decay = isBurst ? Math.random() * 0.015 + 0.008 : Math.random() * 0.005 + 0.002;
        
        // Colors: Gorgeous rose, pinks, deep reds, gold/silver sparkles
        const colorPalette = [
            'rgba(244, 63, 94, ',  // Rose Pink
            'rgba(255, 117, 143, ', // Warm Pink
            'rgba(253, 247, 255, ', // White/Cream sparkle
            'rgba(212, 175, 55, ',  // Gold Sparkle
            'rgba(186, 16, 44, '    // Deep Crimson
        ];
        this.colorBase = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        
        // Sway details
        this.swaySpeed = Math.random() * 0.05 + 0.01;
        this.swayValue = Math.random() * Math.PI * 2;
        
        this.type = Math.random() > 0.35 ? 'heart' : 'sparkle';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= this.decay;
        
        // Add subtle horizontal sway (sine wave)
        this.swayValue += this.swaySpeed;
        this.x += Math.sin(this.swayValue) * 0.5;
        
        // Drag for bursts
        this.speedX *= 0.97;
        this.speedY += 0.05; // slight gravity pull
        if (this.speedY > 2) this.speedY = 2; // cap fall speed
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.colorBase + this.opacity + ')';
        
        if (this.type === 'heart') {
            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-s / 2, -s / 2, -s, 0, 0, s * 0.95);
            ctx.bezierCurveTo(s, 0, s / 2, -s / 2, 0, 0);
            ctx.fill();
        } else {
            const s = this.size / 2;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Firework Rocket Class
class FireworkRocket {
    constructor() {
        this.x = Math.random() * (canvas.width - 200) + 100;
        this.y = canvas.height + 20;
        // Target height to explode (upper half of screen)
        this.targetY = Math.random() * (canvas.height * 0.4) + canvas.height * 0.12;
        this.speedY = (Math.random() * -5) - 10;
        this.speedX = (Math.random() - 0.5) * 3;
        this.exploded = false;
        
        // Random bright colors
        this.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.12; // Gravity slowly decelerates the rocket
        
        // Explode if rising ends or target height is reached
        if (this.speedY >= 0 || this.y <= this.targetY) {
            this.exploded = true;
            explodeFirework(this.x, this.y, this.color);
        }
    }
    
    draw() {
        // Rocket path
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// Shimmer Firework Sparkles
class ShimmerParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        
        // Directional circular spread
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.color = color;
        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.gravity = 0.07;
    }
    
    update() {
        this.vx *= 0.98; // Air friction drag
        this.vy *= 0.98;
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.opacity -= this.decay;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.random() * 3.5 + 1, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// Trigger Firework Explosion
function explodeFirework(x, y, color) {
    const count = Math.floor(Math.random() * 35) + 55;
    for (let i = 0; i < count; i++) {
        shimmers.push(new ShimmerParticle(x, y, color));
    }
}

// Sparkle Burst Trigger Function
function createHeartBurst(x, y, count = 40) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, true));
    }
}

// Background Animation Loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw and update active general particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update and draw Rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        rockets[i].update();
        rockets[i].draw();
        if (rockets[i].exploded) {
            rockets.splice(i, 1);
        }
    }

    // Update and draw Firework Shimmers
    for (let i = shimmers.length - 1; i >= 0; i--) {
        shimmers[i].update();
        shimmers[i].draw();
        if (shimmers[i].opacity <= 0) {
            shimmers.splice(i, 1);
        }
    }
    
    // Continuous ambient floating hearts
    ambientSpawntimer++;
    const spawnRate = isEnvelopeOpen ? 4 : 20; 
    if (ambientSpawntimer % spawnRate === 0 && !isSurpriseActive) {
        particles.push(new Particle(Math.random() * canvas.width, canvas.height + 20, false));
    }
    
    // Continuous firework rockets spawning during active surprise
    if (isSurpriseActive && ambientSpawntimer % 35 === 0) {
        rockets.push(new FireworkRocket());
    }
    
    // Slow stream of hearts rising directly out of the open letter card
    if (isEnvelopeOpen && activeEnvelope && ambientSpawntimer % 15 === 0) {
        const letterHeart = new Particle(window.innerWidth / 2 + (Math.random() - 0.5) * 220, window.innerHeight / 2 - 120, false);
        letterHeart.speedY = -1.2 - Math.random() * 1.5;
        letterHeart.speedX = (Math.random() - 0.5) * 1.5;
        particles.push(letterHeart);
    }
    
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Cursor clicks spawn hearts/sparkles
document.addEventListener('click', (e) => {
    if (e.target.closest('.glass-btn') || e.target.closest('.envelope')) return;
    
    if (isSurpriseActive) {
        // Clicks spawn mini-firework explosions when in surprise mode
        const randomColor = `hsl(${Math.random() * 360}, 100%, 75%)`;
        explodeFirework(e.clientX, e.clientY, randomColor);
    } else {
        createHeartBurst(e.clientX, e.clientY, 12);
    }
});

// --- OPEN / CLOSE ENVELOPE INTERACTION ---
function openEnvelope(envelopeEl) {
    if (isEnvelopeOpen) return;
    
    isEnvelopeOpen = true;
    activeEnvelope = envelopeEl;
    
    const parentItem = envelopeEl.closest('.envelope-item');
    const videoId = envelopeEl.getAttribute('data-video');
    const index = envelopeEl.getAttribute('data-index');
    
    // Track that this specific envelope has been read
    readEnvelopes.add(index);
    
    // Step 1: Add focus class to center envelope on screen
    parentItem.classList.add('active-item');
    appContainer.classList.add('active-mode');
    instruction.classList.add('hide');
    
    // Reset wrapper rotation styling to prevent visual conflict with centering
    const wrapperEl = parentItem.querySelector('.envelope-wrapper');
    wrapperEl.style.transform = 'rotateX(0deg) rotateY(0deg)';
    
    // Step 2: Animate opening (delayed slightly to let centering transitions begin)
    setTimeout(() => {
        envelopeEl.classList.add('open');
        createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 60);
        
        // Ensure background music keeps playing (don't switch songs)
        if (!isMusicPlaying) startMusic(currentVideoId);
    }, 400);
    
    // Step 3: Delayed display of Reset button
    setTimeout(() => {
        resetBtn.classList.remove('hide');
        resetBtn.classList.add('show');
    }, 1200);
}

function closeEnvelope() {
    if (!isEnvelopeOpen || !activeEnvelope) return;
    
    const envelopeEl = activeEnvelope;
    const parentItem = envelopeEl.closest('.envelope-item');
    
    isEnvelopeOpen = false;
    
    // Step 1: Fold back the card and flap
    envelopeEl.classList.remove('open');
    resetBtn.classList.remove('show');
    resetBtn.classList.add('hide');
    
    // Keep music playing in the background (don't stop on close)
    
    // Step 2: Transition back to grid (delayed to let folding finish)
    setTimeout(() => {
        parentItem.classList.remove('active-item');
        appContainer.classList.remove('active-mode');
        activeEnvelope = null;
        
        instruction.classList.remove('hide');
        
        // --- SURPRISE TRIGGER CHECK ---
        // If all 3 envelopes are read, trigger the special message and fireworks show!
        if (readEnvelopes.size === 3 && !isSurpriseActive && !surpriseShown) {
            triggerSurpriseOverlay();
      surpriseShown = true; // Mark that surprise has been shown
        }
    }, 800);
}

// Trigger Surprise Overlay
function triggerSurpriseOverlay() {
    isSurpriseActive = true;
    instruction.classList.add('hide');
    
    setTimeout(() => {
        surpriseOverlay.classList.remove('hide');
        surpriseOverlay.classList.add('show');
        
        // Launch initial launch of 3 fireworks
        rockets.push(new FireworkRocket());
        setTimeout(() => rockets.push(new FireworkRocket()), 400);
        setTimeout(() => rockets.push(new FireworkRocket()), 800);
    }, 400);
}

// Close Surprise Overlay
closeSurpriseBtn.addEventListener('click', () => {
    surpriseOverlay.classList.remove('show');
    surpriseOverlay.classList.add('hide');
    isSurpriseActive = false;
    rockets = [];
    shimmers = [];
    instruction.classList.remove('hide');
});

// Add event listeners to all envelopes
const envelopes = document.querySelectorAll('.envelope');
envelopes.forEach(env => {
    env.addEventListener('click', (e) => {
        if (!isEnvelopeOpen && !isSurpriseActive) {
            openEnvelope(env);
        }
    });
});

// Reset Button closes active envelope
resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeEnvelope();
});
