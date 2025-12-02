import { useRef, useEffect, useCallback, useMemo } from 'react';
import './DotGrid.css';

const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

const DotGrid = ({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  repelStrength = 30,
  returnSpeed = 0.15,
  clickRippleRadius = 200,
  clickRippleStrength = 50,
  className = '',
  style
}) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const pointerRef = useRef({
    x: -1000,
    y: -1000,
    lastX: -1000,
    lastY: -1000
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ 
          cx, 
          cy, 
          xOffset: 0, 
          yOffset: 0,
          vx: 0,
          vy: 0,
          targetX: 0,
          targetY: 0
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Animation loop with physics
  useEffect(() => {
    if (!circlePath) return;

    let rafId;
    const proxSq = proximity * proximity;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        // Calculate distance to pointer
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Repel from pointer
        if (dist < proximity && dist > 0) {
          const force = (1 - dist / proximity) * repelStrength;
          const angle = Math.atan2(dy, dx);
          dot.targetX = Math.cos(angle) * force;
          dot.targetY = Math.sin(angle) * force;
        } else {
          // Return to origin
          dot.targetX = 0;
          dot.targetY = 0;
        }

        // Smooth physics interpolation
        dot.vx += (dot.targetX - dot.xOffset) * returnSpeed;
        dot.vy += (dot.targetY - dot.yOffset) * returnSpeed;
        
        // Apply friction
        dot.vx *= 0.85;
        dot.vy *= 0.85;
        
        // Update position
        dot.xOffset += dot.vx;
        dot.yOffset += dot.vy;

        // Calculate final position
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;

        // Color interpolation based on distance
        let fillStyle = baseColor;
        if (distSq <= proxSq) {
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fillStyle = `rgb(${r},${g},${b})`;
        }

        // Draw dot
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath, repelStrength, returnSpeed]);

  // Grid building
  useEffect(() => {
    buildGrid();
    let ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      wrapperRef.current && ro.observe(wrapperRef.current);
    } else {
      window.addEventListener('resize', buildGrid);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', buildGrid);
    };
  }, [buildGrid]);

  // Mouse movement
  useEffect(() => {
    const onMove = (e) => {
      const pr = pointerRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
    };

    const throttledMove = throttle(onMove, 16);
    window.addEventListener('mousemove', throttledMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', throttledMove);
    };
  }, []);

  // Click ripple effect
  useEffect(() => {
    const onClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dx = dot.cx - clickX;
        const dy = dot.cy - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < clickRippleRadius) {
          const falloff = 1 - dist / clickRippleRadius;
          const force = clickRippleStrength * falloff;
          const angle = Math.atan2(dy, dx);
          
          // Add impulse to velocity
          dot.vx += Math.cos(angle) * force;
          dot.vy += Math.sin(angle) * force;
        }
      }
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [clickRippleRadius, clickRippleStrength]);

  return (
    <section className={`dot-grid ${className}`} style={style}>
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
};

export default DotGrid;
