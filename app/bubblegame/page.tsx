/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */

"use client";
import React, { useRef, useEffect, useState } from "react";
import "./bubbleshooter.css";

type Bubble = { x: number; y: number; color: string };
type Bullet = { x: number; y: number; dx: number; dy: number; color: string };

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [shooter, setShooter] = useState({ x: 250, y: 480, angle: -Math.PI / 2 });
  const [bullet, setBullet] = useState<Bullet | null>(null);
  const [nextBubble, setNextBubble] = useState<{ color: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const colors = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#ff9ff3", "#5f27cd"];
  const bubbleRadius = 20;
  const canvasSize = 500;

  // Initialize bubbles (UNCHANGED)
  useEffect(() => {
    const initialBubbles: Bubble[] = [];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        initialBubbles.push({
          x: col * bubbleRadius * 2 + bubbleRadius + (row % 2 ? bubbleRadius : 0),
          y: row * bubbleRadius * Math.sqrt(3) + bubbleRadius,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    setBubbles(initialBubbles);
    setNextBubble({ color: colors[Math.floor(Math.random() * colors.length)] });
  }, []);

  // Draw everything (UNCHANGED)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, "#ff9ff3");
    bgGradient.addColorStop(0.3, "#48dbfb");
    bgGradient.addColorStop(0.6, "#ffeaa7");
    bgGradient.addColorStop(1, "#1dd1a1");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();
    }

    bubbles.forEach((b) => {
      const gradient = ctx.createRadialGradient(b.x - 5, b.y - 5, 2, b.x, b.y, bubbleRadius);
      gradient.addColorStop(0, "white");
      gradient.addColorStop(0.2, b.color);
      gradient.addColorStop(1, "rgba(0,0,0,0.2)");

      ctx.beginPath();
      ctx.arc(b.x, b.y, bubbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + 50 * Math.cos(shooter.angle), shooter.y + 50 * Math.sin(shooter.angle));
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();

    let dx = Math.cos(shooter.angle);
    let dy = Math.sin(shooter.angle);
    let x = shooter.x;
    let y = shooter.y;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x, y);

    for (let i = 0; i < 1000; i += 5) {
      x += dx * 5;
      y += dy * 5;

      if (x < bubbleRadius || x > canvasSize - bubbleRadius) dx *= -1;
      ctx.lineTo(x, y);
      if (y < bubbleRadius) break;
    }

    ctx.stroke();
    ctx.setLineDash([]);

    if (bullet) {
      const g = ctx.createRadialGradient(bullet.x - 5, bullet.y - 5, 2, bullet.x, bullet.y, bubbleRadius);
      g.addColorStop(0, "white");
      g.addColorStop(0.2, bullet.color);
      g.addColorStop(1, "rgba(0,0,0,0.2)");

      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bubbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    if (gameOver) {
      ctx.fillStyle = "white";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🎉 You Win!", canvas.width / 2, canvas.height / 2);
    }
  }, [bubbles, shooter, bullet, gameOver]);

  // Find connected
  const findConnected = (start: Bubble, allBubbles: Bubble[]) => {
    const visited = new Set<string>();
    const stack = [start];
    const connected: Bubble[] = [];

    while (stack.length) {
      const current = stack.pop()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      connected.push(current);

      for (const b of allBubbles) {
        if (b.color === start.color && Math.hypot(b.x - current.x, b.y - current.y) <= bubbleRadius * 2 + 1) {
          stack.push(b);
        }
      }
    }

    return connected;
  };

  // Snap to grid
  const snapToGrid = (x: number, y: number) => {
    let minDist = Infinity;
    let nearestX = x;
    let nearestY = y;

    bubbles.forEach((b) => {
      const steps = [
        [0, -bubbleRadius * Math.sqrt(3)],
        [bubbleRadius * 2, 0],
        [-bubbleRadius * 2, 0],
        [bubbleRadius, -bubbleRadius * Math.sqrt(3)],
        [-bubbleRadius, -bubbleRadius * Math.sqrt(3)],
        [bubbleRadius, bubbleRadius * Math.sqrt(3)],
        [-bubbleRadius, bubbleRadius * Math.sqrt(3)],
      ];

      steps.forEach(([dx, dy]) => {
        const nx = b.x + dx;
        const ny = b.y + dy;
        const dist = Math.hypot(nx - x, ny - y);

        if (dist < minDist) {
          minDist = dist;
          nearestX = nx;
          nearestY = ny;
        }
      });
    });

    if (nearestY < bubbleRadius) nearestY = bubbleRadius;
    return { x: nearestX, y: nearestY };
  };

  // Bullet movement
  useEffect(() => {
    if (!bullet) return;

    const interval = setInterval(() => {
      setBullet((prev) => {
        if (!prev) return null;

        const newX = prev.x + prev.dx;
        const newY = prev.y + prev.dy;

        if (newX < bubbleRadius || newX > canvasSize - bubbleRadius) {
          prev.dx *= -1;
        }

        for (const b of bubbles) {
          if (Math.hypot(newX - b.x, newY - b.y) < bubbleRadius * 2) {
            const snapped = snapToGrid(newX, newY);
            const newBubble: Bubble = { x: snapped.x, y: snapped.y, color: prev.color };

            let newBubbles = [...bubbles, newBubble];
            const connected = findConnected(newBubble, newBubbles);

            if (connected.length >= 3) {
              newBubbles = newBubbles.filter((bb) => !connected.includes(bb));
            }

            setBubbles(newBubbles);
            if (newBubbles.length === 0) setGameOver(true);

            return null;
          }
        }

        if (newY < bubbleRadius) {
          const snapped = snapToGrid(newX, newY);
          setBubbles([...bubbles, { x: snapped.x, y: snapped.y, color: prev.color }]);
          return null;
        }

        return { ...prev, x: newX, y: newY };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [bullet, bubbles]);

  // Shoot
  const shootAt = (mouseX: number, mouseY: number) => {
    if (bullet || !nextBubble || gameOver) return;

    const angle = Math.atan2(mouseY - shooter.y, mouseX - shooter.x);
    setShooter((s) => ({ ...s, angle }));

    const speed = 8;

    setBullet({
      x: shooter.x,
      y: shooter.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: nextBubble.color,
    });

    setNextBubble({ color: colors[Math.floor(Math.random() * colors.length)] });
  };

  // Mouse controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const angle = Math.atan2(mouseY - shooter.y, mouseX - shooter.x);
      setShooter((s) => ({ ...s, angle }));
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      shootAt(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [shooter.y, bullet, nextBubble, gameOver]);

  return (
    <div className="game-container">
      <h1 className="game-title">🎯 Bubble Shooter</h1>
      <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="game-canvas" />
      {!gameOver && nextBubble && (
        <div className="next-bubble-container">
          <p>Next Bubble:</p>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              margin: "10px auto",
              background: nextBubble.color,
              boxShadow: "0 0 10px white",
            }}
          />
        </div>
      )}
      <p className="game-instructions">👉 Aim with mouse, click to shoot</p>
    </div>
  );
}
