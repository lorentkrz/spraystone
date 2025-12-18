import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import Lottie from 'react-lottie-player';
import { useI18n } from '@/i18n';
const LOTTIE_CHEER = 'https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json';
export interface GameModalProps {
  isVisible: boolean;
  onClose: () => void;
  progress?: number;
  onComplete?: () => void;
}
const hyperfluxSrcDoc = String.raw`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hyperflux Defender</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg,#fef5e6 0%,#f7e4cf 55%,#f3dcc3 100%);
        color: #2d2a26;
        font-family: 'Orbitron', sans-serif;
      }
      .playfield {
        position: relative;
        aspect-ratio: 16/9;
        border-radius: 32px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(247, 230, 208, 0.95));
        box-shadow: 0 35px 80px rgba(84, 65, 42, 0.25);
      }
      .playfield-surface {
        position: absolute;
        inset: clamp(12px, 1.8vw, 22px);
        border-radius: 24px;
        overflow: hidden;
        background: #f8ecdc;
      }
      #gameCanvas {
        border: 3px solid rgba(212, 165, 116, 0.65);
        border-radius: 20px;
        background: radial-gradient(circle at top, #fdf5e6, #f0deca);
        display: block;
        width: 100%;
        height: 100%;
        box-shadow: inset 0 0 35px rgba(125, 94, 60, 0.25);
      }
      .game-shell {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: clamp(14px, 2vw, 26px);
        max-width: 900px;
        margin: 0 auto;
      }
      .hud {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .hud-card {
        flex: 1;
        min-width: 140px;
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(212, 165, 116, 0.35);
        text-align: center;
        box-shadow: inset 0 1px 3px rgba(255,255,255,0.7);
      }
      .hud-label {
        font-size: 10px;
        letter-spacing: 0.35em;
        color: #c4955e;
      }
      .hud-value {
        margin-top: 6px;
        font-size: 24px;
        font-weight: 700;
        color: #7a4f2b;
      }
      .overlay {
        position: absolute;
        inset: 0;
        background: rgba(254, 245, 230, 0.92);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 20px;
        text-align: center;
        color: #2d2a26;
        padding: 24px;
      }
      .overlay button {
        margin-top: 24px;
        padding: 12px 28px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(100deg, #d4a574, #c4955e);
        color: #ffffff;
        font-weight: 700;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 12px 25px rgba(120, 87, 55, 0.25);
      }
      #renderStatus {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        background: rgba(45, 42, 38, 0.75);
        border-radius: 12px;
        font-size: 11px;
        border: 1px solid rgba(212, 165, 116, 0.5);
        color: #fef5e6;
      }
      @media (max-width: 640px) {
        .hud {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="game-shell">
      <div class="hud">
        <div class="hud-card">
          <div class="hud-label">SCORE</div>
          <div id="scoreDisplay" class="hud-value">0</div>
        </div>
        <div class="hud-card">
          <div class="hud-label">WAVE</div>
          <div id="waveDisplay" class="hud-value">1</div>
        </div>
        <div class="hud-card">
          <div class="hud-label">HEALTH</div>
          <div id="healthDisplay" class="hud-value" style="color:#b04732;">100</div>
        </div>
      </div>
      <div class="playfield">
        <div class="playfield-surface">
          <canvas id="gameCanvas" width="800" height="450"></canvas>
          <div id="overlay" class="overlay">
            <h2 id="overlayTitle" style="font-size:32px;margin-bottom:16px;color:#7a4f2b;">Hyperflux Defender</h2>
            <p
              id="overlayMessage"
              style="max-width:360px;color:#6b5241;font-size:14px;margin-bottom:12px;line-height:1.5;"
            >
              Defend the Spraystone core while we build your Spraystone preview. Stay in the fight until the render hands back the facade.
              Move with your mouse or finger, click or tap to shoot.
            </p>
            <button id="startButton">Start Game</button>
          </div>
          <div id="renderStatus">Rendering in background...</div>
        </div>
      </div>
    </div>
    <script>
      (() => {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const overlay = document.getElementById('overlay');
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayMessage = document.getElementById('overlayMessage');
        const startButton = document.getElementById('startButton');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const waveDisplay = document.getElementById('waveDisplay');
        const healthDisplay = document.getElementById('healthDisplay');
        const renderStatus = document.getElementById('renderStatus');
        const introMessage =
          'Defend the Spraystone core while we build your preview. Move with mouse or touch, click or tap to shoot.';
        let width = canvas.width;
        let height = canvas.height;
        const stars = [];
        const bullets = [];
        const enemies = [];
        const player = {
          x: width / 2,
          y: height - 60,
          width: 28,
          height: 28,
          targetX: width / 2,
          health: 100,
          alive: true
        };
        let frame = 0;
        let score = 0;
        let wave = 1;
        let running = false;
        let spawnInterval = 60;
        function resize() {
          const rect = canvas.parentElement.getBoundingClientRect();
          width = rect.width;
          height = rect.height;
          canvas.width = width;
          canvas.height = height;
        }
        window.addEventListener('resize', resize);
        resize();
        function createStarField() {
          stars.length = 0;
          for (let i = 0; i < 150; i++) {
            stars.push({
              x: Math.random() * width,
              y: Math.random() * height,
              size: Math.random() * 2 + 0.5,
              speed: Math.random() * 0.6 + 0.2
            });
          }
        }
        createStarField();
        canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          player.targetX = ((e.clientX - rect.left) / rect.width) * width;
        });
        canvas.addEventListener(
          'touchmove',
          (e) => {
            const rect = canvas.getBoundingClientRect();
            player.targetX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
            e.preventDefault();
          },
          { passive: false }
        );
        function shoot() {
          bullets.push({ x: player.x, y: player.y - player.height / 2, speed: 8 });
        }
        function spawnEnemy() {
          const size = 26;
          enemies.push({
            x: Math.random() * (width - size) + size / 2,
            y: -size,
            size,
            speed: 1.2 + wave * 0.15
          });
        }
        function update() {
          frame++;
          stars.forEach((star) => {
            star.y += star.speed * (1 + wave * 0.02);
            if (star.y > height) {
              star.y = 0;
              star.x = Math.random() * width;
            }
          });
          player.x += (player.targetX - player.x) * 0.12;
          player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x));
          if (frame % 20 === 0) shoot();
          bullets.forEach((bullet) => {
            bullet.y -= bullet.speed;
          });
          for (let i = bullets.length - 1; i >= 0; i--) {
            if (bullets[i].y < -10) bullets.splice(i, 1);
          }
          if (frame % Math.max(20, spawnInterval - wave * 4) === 0) spawnEnemy();
          enemies.forEach((enemy) => {
            enemy.y += enemy.speed;
          });
          for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].y > height + enemies[i].size) {
              enemies.splice(i, 1);
              damagePlayer(10);
            }
          }
          for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            for (let j = bullets.length - 1; j >= 0; j--) {
              const bullet = bullets[j];
              const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
              if (dist < enemy.size / 2) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 50;
                scoreDisplay.textContent = String(score);
                break;
              }
            }
          }
          if (score / (wave * 300) >= 1) {
            wave++;
            waveDisplay.textContent = String(wave);
          }
        }
        function damagePlayer(amount) {
          player.health = Math.max(0, player.health - amount);
          const val = Math.round(player.health);
          healthDisplay.textContent = String(val);
          if (val > 60) healthDisplay.style.color = '#2b7a5c';
          else if (val > 25) healthDisplay.style.color = '#c87932';
          else healthDisplay.style.color = '#b04732';
          if (val <= 0) {
            running = false;
            if (overlay) overlay.style.display = 'flex';
            if (overlayTitle) overlayTitle.textContent = 'Game Over';
            if (overlayMessage) {
              overlayMessage.textContent = 'Final score ' + score + '. Wave ' + wave + '.';
            }
          }
        }
        function draw() {
          ctx.clearRect(0, 0, width, height);
          const backdrop = ctx.createLinearGradient(0, 0, 0, height);
          backdrop.addColorStop(0, '#fdf6ea');
          backdrop.addColorStop(1, '#f3ddc3');
          ctx.fillStyle = backdrop;
          ctx.fillRect(0, 0, width, height);
          stars.forEach((star) => {
            ctx.fillStyle = star.size > 1 ? 'rgba(212,165,116,0.9)' : 'rgba(191,165,140,0.7)';
            ctx.fillRect(star.x, star.y, star.size, star.size);
          });
          ctx.fillStyle = '#c57239';
          bullets.forEach((bullet) => ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 12));
          ctx.fillStyle = '#8b5a3c';
          enemies.forEach((enemy) => {
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y - enemy.size / 2);
            ctx.lineTo(enemy.x + enemy.size / 2, enemy.y);
            ctx.lineTo(enemy.x, enemy.y + enemy.size / 2);
            ctx.lineTo(enemy.x - enemy.size / 2, enemy.y);
            ctx.closePath();
            ctx.fill();
          });
          ctx.fillStyle = '#d4a574';
          ctx.shadowColor = 'rgba(139, 90, 48, 0.4)';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(player.x, player.y - player.height / 2);
          ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
          ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        function loop() {
          if (!running) return;
          update();
          draw();
          requestAnimationFrame(loop);
        }
        function startGame() {
          score = 0;
          wave = 1;
          player.health = 100;
          scoreDisplay.textContent = '0';
          waveDisplay.textContent = '1';
          healthDisplay.textContent = '100';
          bullets.length = 0;
          enemies.length = 0;
          frame = 0;
          running = true;
          if (overlayTitle) overlayTitle.textContent = 'Hyperflux Defender';
          if (overlayMessage) overlayMessage.textContent = introMessage;
          if (overlay) overlay.style.display = 'none';
          loop();
        }
        const requestStart = (event) => {
          event?.preventDefault?.();
          if (running) return;
          startGame();
        };
        if (startButton) {
          startButton.addEventListener('click', requestStart);
        } else {
          startGame();
        }
        window.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && overlay && overlay.style.display !== 'none') {
            requestStart(event);
          }
        });
        window.addEventListener('message', (event) => {
          const data = event.data || {};
          if (data.type === 'spraystone-progress') {
            const pct = Math.round(data.value || 0);
            renderStatus.textContent =
              pct >= 99 ? 'Render complete - returning to app' : 'Rendering in background... ' + pct + '%';
          }
        });
      })();
    </script>
  </body>
</html>`;
export const GameModal: React.FC<GameModalProps> = ({ isVisible, onClose, progress, onComplete }) => {
  const { t } = useI18n();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [session, setSession] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  useEffect(() => {
    if (isVisible) {
      setSession((prev) => prev + 1);
      setShowCongrats(false);
    }
  }, [isVisible]);
  const postProgress = useCallback(
    (value?: number) => {
      if (!iframeRef.current?.contentWindow) return;
      iframeRef.current.contentWindow.postMessage({ type: 'spraystone-progress', value: value ?? 0 }, '*');
    },
    []
  );
  useEffect(() => {
    if (isVisible) {
      postProgress(progress);
    }
  }, [progress, isVisible, postProgress, session]);
  const handleIframeLoad = () => {
    postProgress(progress);
  };
  useEffect(() => {
    if (!isVisible) return;
    if (typeof progress === 'number' && progress >= 99) {
      setShowCongrats(true);
      const timeout = setTimeout(() => {
        setShowCongrats(false);
        onComplete?.();
        onClose();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [progress, isVisible, onClose, onComplete]);
  const statusText =
    typeof progress === 'number'
      ? progress >= 99
        ? t('gameModal.status.ready')
        : t('gameModal.status.rendering', { percent: Math.round(progress) })
      : t('gameModal.status.preparing');
  const isRendering = typeof progress !== 'number' || progress < 99;
  return (
    <ReactModal
      isOpen={isVisible}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      closeTimeoutMS={240}
      style={{
        overlay: {
          backgroundColor: 'rgba(8,8,8,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        },
        content: {
          position: 'relative',
          inset: 'auto',
          width: 'min(94vw, 1160px)',
          maxHeight: '92vh',
          border: 'none',
          borderRadius: '32px',
          padding: 0,
          overflow: 'hidden',
          background: 'linear-gradient(145deg,#fef5e6 0%,#f1e0c9 40%,#f8efe0 100%)',
          boxShadow: '0 40px 90px rgba(13,12,10,0.45)'
        }
      }}
      contentLabel={t('gameModal.contentLabel')}
    >
      <div className="flex max-h-[92vh] flex-col gap-4 bg-gradient-to-br from-[#fef5e6]/90 via-[#f9ebd2]/90 to-[#f5e3cb]/90 p-5 text-[#2d2a26]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c4955e]">
              {t('gameModal.title')}
            </p>
            <p className="mt-1 text-sm text-[#5e5243]">
              {t('gameModal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d4a574]/40 bg-white/80 px-3 py-2 text-sm font-semibold text-[#7a5b3d] shadow-sm transition hover:bg-white"
            aria-label={t('gameModal.closeAria')}
          >
            {t('gameModal.close')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#d4a574]/30 bg-white/80 px-4 py-3 text-sm text-[#5e5243] shadow-inner shadow-white/60">
          <p className="flex-1 min-w-[220px]">
            {t('gameModal.info')}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a574]/40 bg-[#fff6ea] px-3 py-1 text-xs font-semibold text-[#7a5b3d]">
            {isRendering ? (
              <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-[#d4a574]/60 border-t-transparent" />
            ) : (
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            )}
            {statusText}
          </div>
        </div>
        <div className="rounded-[28px] border border-[#d4a574]/30 bg-white/70 p-2 shadow-2xl shadow-[#d4a574]/15">
          <div className="relative w-full overflow-hidden rounded-[24px]" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              key={session}
              ref={iframeRef}
              srcDoc={hyperfluxSrcDoc}
              title="Hyperflux Defender"
              className="absolute inset-0 h-full w-full rounded-[24px] border-none"
              sandbox="allow-scripts allow-same-origin"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      </div>
      {showCongrats && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#fef5e6]/85 backdrop-blur">
          <Lottie play loop path={LOTTIE_CHEER} style={{ width: 160, height: 160 }} />
          <p className="mt-4 text-3xl font-extrabold text-[#2d2a26]">
            {t('gameModal.ready')}
          </p>
        </div>
      )}
    </ReactModal>
  );
};
