const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

/* Add Heartbeat/Pulse logic */
let pulse = 0;

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
    animate();
}

function createParticles() {
    particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speedX: Math.random() * 0.5 - 0.25,
            speedY: Math.random() * 0.5 - 0.25
        });
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Slow pulse heartbeat effect
    pulse += 0.02;
    const opacity = (Math.sin(pulse) * 0.05 + 0.05);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

    particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

export { init as initParticles };

