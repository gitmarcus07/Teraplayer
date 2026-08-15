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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export default function VideoPlayer({ src, poster, title }) {
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
  const hideTimer = useRef(null);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
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

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setBuffering(false);
    };
    const onWait = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);

    // xAPiverse returns HLS manifests from /fast_stream without a .m3u8
    // filename extension, so detect both normal HLS URLs and that endpoint.
    const isHls =
      typeof src === "string" &&
      (/\.m3u8(?:$|[?#])/i.test(src) || /\/fast_stream(?:[/?#]|$)/i.test(src));

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
      });

      hls.loadSource(src);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data?.fatal) return;

        console.error("HLS playback error:", data);

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            hls = null;
            setBuffering(false);
            break;
        }
      });
    } else if (isHls && v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
    } else {
      v.src = src || "";
    }

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);

      if (hls) {
        hls.destroy();
        hls = null;
      }

      v.removeAttribute("src");
      v.load();
    };
  }, [src]);

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
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-black shadow-2xl shadow-primary/5"
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      data-testid="video-player"
    >
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Loading spinner */}
      {buffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Center play button */}
      {!playing && !buffering && (
        <button
          onClick={togglePlay}
          data-testid="center-play-btn"
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 ease-out hover:scale-110 sm:h-20 sm:w-20"
          aria-label="Play"
        >
          <Play className="h-6 w-6 fill-white sm:h-8 sm:w-8" strokeWidth={0} />
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
          aria-label="Seek"
        />

        <div className="mt-2 flex items-center gap-1.5 text-white sm:gap-3">
          <button
            data-testid="play-btn"
            onClick={togglePlay}
            className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/10"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            data-testid="seek-back-btn"
            onClick={() => seek(-10)}
            className="hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:block"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            data-testid="seek-fwd-btn"
            onClick={() => seek(10)}
            className="hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:block"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              data-testid="mute-btn"
              onClick={toggleMute}
              className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/10"
              aria-label={muted ? "Unmute" : "Mute"}
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
              className="tp-range hidden w-20 sm:block"
              aria-label="Volume"
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
                  className="rounded-lg px-2 py-2 text-sm transition-colors duration-200 hover:bg-white/10"
                  aria-label="Playback speed"
                >
                  <Gauge className="mr-1 inline h-4 w-4" />
                  {rate}x
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
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
              className="hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:block"
              aria-label="Picture in picture"
            >
              <PictureInPicture2 className="h-5 w-5" />
            </button>
            <button
              data-testid="fullscreen-btn"
              onClick={enterFullscreen}
              className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/10"
              aria-label="Fullscreen"
            >
              {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
