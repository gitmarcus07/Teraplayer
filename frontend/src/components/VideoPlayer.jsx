import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Loader2,
  Gauge,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { track } from "../lib/analytics";
import { useLang } from "../i18n/LanguageContext";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// Small content hash so we can key resume positions without ever persisting
// the (ephemeral, signed) stream URL itself.
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export default function VideoPlayer({ src, poster, title, autoPlay = false, onDownloadInstead, onProcessAnother, onRefreshSource }) {
  const { t } = useLang();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [rate, setRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [playbackError, setPlaybackError] = useState(null);
  const [resumePos, setResumePos] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const hideTimer = useRef(null);
  const retriesRef = useRef(0);
  const playerStartedRef = useRef(false);
  const errorTrackedRef = useRef(false);
  const lastSaveRef = useRef(0);
  const resumeKeyRef = useRef(null);
  const resumePendingRef = useRef(false);

  const saveResume = useCallback((pos) => {
    if (!resumeKeyRef.current) return;
    try {
      sessionStorage.setItem(resumeKeyRef.current, JSON.stringify({ t: pos, d: Date.now() }));
    } catch {
      /* session storage is best-effort only */
    }
  }, []);

  const clearResume = useCallback(() => {
    if (!resumeKeyRef.current) return;
    try {
      sessionStorage.removeItem(resumeKeyRef.current);
    } catch {
      /* ignore */
    }
  }, []);

  const surfaceError = useCallback(() => {
    setBuffering(false);
    setPlaybackError("Video playback couldn't be started.");
    if (!errorTrackedRef.current) {
      errorTrackedRef.current = true;
      track("playback_error");
    }
  }, []);

  const tryAgain = useCallback(() => {
    setPlaybackError(null);
    setBuffering(true);
    errorTrackedRef.current = false;
    setReloadToken((t) => t + 1);
  }, []);

  const resume = useCallback(() => {
    const v = videoRef.current;
    if (!v || resumePos == null) return;
    v.currentTime = resumePos;
    setResumePos(null);
    track("player_resume_clicked");
    v.play().catch(() => {});
  }, [resumePos]);

  const startOver = useCallback(() => {
    clearResume();
    setResumePos(null);
    track("player_restart_clicked");
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [clearResume]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {
        // Autoplay may be blocked (no active user gesture yet) — keep the play
        // button visible so the user can start playback by tapping it.
      });
    } else {
      v.pause();
    }
  }, []);

  const seek = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const changeVolume = useCallback((val) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen?.();
    }
  }, []);

  const enterPip = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture?.();
    } catch {
      /* silent */
    }
  }, []);

  const setSpeed = useCallback((r) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
  }, []);

  // Auto-hide controls
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 2500);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let hls = null;
    resumeKeyRef.current = src ? `tp:resume:${hashStr(src)}` : null;
    retriesRef.current = 0;
    playerStartedRef.current = false;
    errorTrackedRef.current = false;
    lastSaveRef.current = 0;
    setPlaybackError(null);
    setResumePos(null);

    // Detect a pending session resume up front so we never auto-play over the
    // resume prompt. The prompt's full eligibility check needs video metadata
    // (duration), so a saved position's presence is used here instead.
    resumePendingRef.current = false;
    if (resumeKeyRef.current) {
      try {
        const raw = sessionStorage.getItem(resumeKeyRef.current);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && typeof saved.t === "number" && saved.t >= 10) {
            resumePendingRef.current = true;
          }
        }
      } catch {
        /* ignore */
      }
    }

    // xAPiverse returns HLS manifests from /fast_stream without a .m3u8
    // filename extension, so detect both normal HLS URLs and that endpoint.
    const isHls =
      typeof src === "string" &&
      (/\.m3u8(?:$|[?#])/i.test(src) || /\/fast_stream(?:[/?#]|$)/i.test(src));

    const persist = () => {
      if (v && !v.ended && Number.isFinite(v.currentTime) && v.currentTime > 5) {
        saveResume(v.currentTime);
      }
    };

    const onPlay = () => {
      setPlaying(true);
      if (!playerStartedRef.current) {
        playerStartedRef.current = true;
        track("player_started");
      }
    };
    const onPause = () => {
      setPlaying(false);
      persist();
    };
    const onTime = () => {
      setCurrent(v.currentTime);
      const now = Date.now();
      if (now - lastSaveRef.current > 4000) {
        lastSaveRef.current = now;
        persist();
      }
    };
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setBuffering(false);
      // Offer a session-only resume when there's a meaningful saved position.
      let hasResume = false;
      if (resumeKeyRef.current && Number.isFinite(v.duration)) {
        try {
          const raw = sessionStorage.getItem(resumeKeyRef.current);
          if (raw) {
            const saved = JSON.parse(raw);
            if (
              saved &&
              typeof saved.t === "number" &&
              saved.t >= 10 &&
              v.duration > 30 &&
              saved.t < v.duration - 10
            ) {
              hasResume = true;
              setResumePos(saved.t);
            }
          }
        } catch {
          /* ignore */
        }
      }
      // Watch Now requested autoplay: start once metadata is ready, unless a
      // session resume prompt should be shown instead. If the browser blocks
      // autoplay the promise rejects and the center play button stays usable.
      if (autoPlay && !hasResume) {
        v.play().catch(() => {});
      }
    };
    const onEnded = () => {
      setPlaying(false);
      clearResume();
    };
    const onWait = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onNativeError = () => {
      if (isHls) return;
      surfaceError();
    };

    // Watch Now requested autoplay: try to start playback as early as the
    // source is attached, so the request stays as close as possible to the
    // user's activation. If the browser blocks it the promise rejects and the
    // center play button stays usable.
    const attemptAutoplay = () => {
      if (!autoPlay || resumePendingRef.current) return;
      v.play().catch(() => {
        // Autoplay may be blocked (no active user gesture yet) — keep the play
        // button visible so the user can start playback by tapping it.
      });
    };

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
      });

      hls.loadSource(src);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        attemptAutoplay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data?.fatal) return;

        // Recover at most twice, then surface a friendly message instead of
        // looping retries forever against a broken stream.
        if (retriesRef.current >= 2) {
          console.error("HLS playback failed:", data?.type, data?.details);
          hls?.destroy();
          hls = null;
          surfaceError();
          return;
        }

        retriesRef.current += 1;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            console.error("HLS playback failed:", data?.type, data?.details);
            hls.destroy();
            hls = null;
            surfaceError();
            break;
        }
      });
    } else if (isHls && v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
      attemptAutoplay();
    } else {
      v.src = src || "";
      attemptAutoplay();
    }

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("ended", onEnded);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onNativeError);

    return () => {
      persist();
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onNativeError);

      if (hls) {
        hls.destroy();
        hls = null;
      }

      v.removeAttribute("src");
      v.load();
    };
  }, [src, reloadToken, saveResume, clearResume, surfaceError, autoPlay]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!wrapRef.current) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          seek(-10);
          break;
        case "arrowright":
        case "l":
          seek(10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          enterFullscreen();
          break;
        case "p":
          enterPip();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, changeVolume, toggleMute, enterFullscreen, enterPip, volume]);

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="ds-card group relative aspect-video w-full overflow-hidden !rounded-2xl bg-black shadow-2xl shadow-primary/5"
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      data-testid="video-player"
    >
      <video
        ref={videoRef}
        poster={poster}
        aria-label={title || t("vp.playerAria")}
        className="h-full w-full object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Loading spinner */}
      {buffering && !playbackError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Session-only resume prompt */}
      {resumePos != null && !playbackError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
          data-testid="resume-prompt"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-4 text-center shadow-2xl">
            <div className="text-sm font-semibold text-foreground sm:text-base">
              {t("vp.resumeFrom").replace("{pos}", fmt(resumePos))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("vp.resumeBody")}</p>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" onClick={resume} data-testid="resume-btn">
                {t("vp.resumeBtn")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={startOver}
                data-testid="restart-btn"
              >
                {t("vp.restartBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Friendly playback error with recovery actions */}
      {playbackError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
          role="alert"
          data-testid="player-error"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-4 text-center shadow-2xl">
            <AlertCircle className="mx-auto mb-2 h-7 w-7 text-destructive" />
            <div className="text-sm font-semibold text-foreground sm:text-base">
              {t("vp.errTitle")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("vp.errBody")}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button onClick={tryAgain} data-testid="player-retry-btn">
                {t("vp.retry")}
              </Button>
              {onRefreshSource && (
                <Button
                  variant="secondary"
                  onClick={onRefreshSource}
                  data-testid="player-refresh-btn"
                >
                  {t("vp.refresh")}
                </Button>
              )}
              {onDownloadInstead && (
                <Button
                  variant="secondary"
                  onClick={onDownloadInstead}
                  data-testid="player-download-btn"
                >
                  {t("vp.dlInstead")}
                </Button>
              )}
              {onProcessAnother && (
                <Button
                  variant="outline"
                  onClick={onProcessAnother}
                  data-testid="player-process-another-btn"
                >
                  {t("vp.processAnother")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center play button */}
      {!playing && !buffering && !playbackError && (
        <button
          onClick={(e) => {
            // The bottom controls bar is rendered later and paints above this
            // button, so on short (mobile) players it can swallow taps at the
            // button's center. Raise the button above it and stop the event
            // from propagating to the parent player's click handling.
            e.stopPropagation();
            togglePlay();
          }}
          data-testid="center-play-btn"
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-normal ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 sm:h-20 sm:w-20"
          aria-label={title ? `${t("vp.play")} ${title}` : t("vp.play")}
        >
          <Play className="h-6 w-6 fill-white sm:h-8 sm:w-8" strokeWidth={0} aria-hidden="true" />
        </button>
      )}

      {/* Title overlay */}
      {title && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-sm font-medium text-white/90 transition-opacity duration-300 sm:px-6 sm:py-4 sm:text-base ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="line-clamp-1">{title}</span>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300 sm:px-5 sm:pb-4 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        data-testid="player-controls"
      >
        {/* progress */}
        <input
          data-testid="progress-slider"
          type="range"
          min={0}
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={(e) => {
            const v = videoRef.current;
            if (!v) return;
            v.currentTime = Number(e.target.value);
          }}
          className="tp-range w-full"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progressPct}%, hsl(var(--foreground) / 0.15) ${progressPct}%, hsl(var(--foreground) / 0.15) 100%)`,
          }}
          aria-label={t("vp.seek")}
        />

<div className="mt-2 flex items-center gap-1.5 text-white sm:gap-3">
           <button
             data-testid="play-btn"
             onClick={togglePlay}
             className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 sm:h-10 sm:w-10"
             aria-label={playing ? t("vp.pause") : t("vp.play")}
           >
             {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
           </button>
           <button
             data-testid="seek-back-btn"
             onClick={() => seek(-10)}
             className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 sm:hidden"
             aria-label={t("vp.rew")}
           >
             <RotateCcw className="h-5 w-5" />
           </button>
           <button
             data-testid="seek-fwd-btn"
             onClick={() => seek(10)}
             className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 sm:hidden"
             aria-label={t("vp.fwd")}
           >
             <RotateCw className="h-5 w-5" />
           </button>

<div className="flex items-center gap-1.5">
             <button
               data-testid="mute-btn"
               onClick={toggleMute}
               className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
               aria-label={muted ? t("vp.unmute") : t("vp.mute")}
             >
               {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
             </button>
             <input
               data-testid="volume-slider"
               type="range"
               min={0}
               max={1}
               step="0.05"
               value={muted ? 0 : volume}
               onChange={(e) => changeVolume(Number(e.target.value))}
               className="tp-range w-16 sm:block hidden"
               aria-label={t("vp.vol")}
             />
           </div>

<div className="ml-1 whitespace-nowrap font-mono text-xs text-white/80 sm:text-sm">
             {fmt(current)} <span className="text-white/40">/ {fmt(duration)}</span>
           </div>

           <div className="ml-auto flex items-center gap-1">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button
                   data-testid="speed-btn"
                   className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 px-2 text-sm transition-colors duration-200 hover:bg-white/20 sm:w-auto sm:px-3"
                   aria-label={t("vp.speed")}
                 >
                  <Gauge className="mr-1 inline h-4 w-4" />
                  {rate}x
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("vp.speed")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SPEEDS.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => setSpeed(s)}
                    data-testid={`speed-${s}`}
                  >
                    {s}x {rate === s && "•"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
<button
                data-testid="pip-btn"
                onClick={enterPip}
                className="hidden h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 sm:flex"
                aria-label={t("vp.pip")}
              >
                <PictureInPicture2 className="h-5 w-5" />
              </button>
              <button
                data-testid="fullscreen-btn"
                onClick={enterFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
                aria-label={t("vp.fs")}
              >
                {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
