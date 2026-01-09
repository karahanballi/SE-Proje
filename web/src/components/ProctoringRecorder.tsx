import { useEffect, useRef, useState } from "react";

type LogItem = { t: number; type: string; detail?: string };

export default function ProctoringRecorder({
  active,
  onStop,
}: {
  active: boolean;
  onStop?: (blob: Blob | null, logs: LogItem[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const chunksRef = useRef<BlobPart[]>([]);

  function pushLog(type: string, detail?: string) {
    setLogs((prev) => [...prev, { t: Date.now(), type, detail }]);
  }

  useEffect(() => {
    function onVis() {
      pushLog("visibility", document.hidden ? "hidden" : "visible");
    }
    function onBlur() {
      pushLog("window", "blur");
    }
    function onFocus() {
      pushLog("window", "focus");
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    (async () => {
      try {
        setError(null);
        setReady(false);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setReady(true);
        pushLog("camera", "granted");

        // MediaRecorder
        const mimeCandidates = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];
        const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";

        const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = rec;
        chunksRef.current = [];

        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstart = () => {
          setRecording(true);
          pushLog("record", "start");
        };
        rec.onstop = () => {
          setRecording(false);
          pushLog("record", "stop");
          const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
          onStop?.(blob, logs);
        };

        rec.start(2000); // 2sn parça
      } catch (e: any) {
        setError(e?.message || "Kamera açılamadı");
        pushLog("camera", "denied");
      }
    })();

    return () => {
      // cleanup
      try {
        recorderRef.current?.stop();
      } catch {}
      recorderRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const stopNow = () => {
    try {
      recorderRef.current?.stop();
    } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Webcam Proctoring (Demo)</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Durum: {error ? "Hata" : recording ? "Kayıt alınıyor" : ready ? "Hazır" : "Başlatılıyor"}
          </div>
        </div>

        {recording && (
          <button
            onClick={stopNow}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
          >
            Kaydı Durdur
          </button>
        )}
      </div>

      {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <video ref={videoRef} muted playsInline className="w-full bg-black" />
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-600 dark:text-slate-300">Loglar</summary>
        <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-white/10 dark:bg-slate-950">
          {logs.map((l, i) => (
            <div key={i}>
              {new Date(l.t).toLocaleTimeString()} • {l.type} {l.detail ? `(${l.detail})` : ""}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
