import { Buffer } from "buffer";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import jpeg from "jpeg-js";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Option = "A" | "B" | "C" | "D";
type AnswersMap = Record<number, Option | null>;
type Point = { x: number; y: number };
type ScanPoint = { x: number; y: number; val: number; q: number; opt: string };
type Corners = { tl: Point; tr: Point; bl: Point; br: Point };
type AnalyzeOk = { answers: AnswersMap; corners: Corners; debugPoints: ScanPoint[] };
type AnalyzeFail = { reason: "marker-not-found" };
type AnalyzeResult = AnalyzeOk | AnalyzeFail;

function b64ToU8(b64: string) {
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Bilinear mapping (senin yaklaşımın iyi, bunu koruyoruz)
function getPointOnPaper(corners: Corners, u: number, v: number): Point {
  const topX = lerp(corners.tl.x, corners.tr.x, u);
  const topY = lerp(corners.tl.y, corners.tr.y, u);
  const botX = lerp(corners.bl.x, corners.br.x, u);
  const botY = lerp(corners.bl.y, corners.br.y, u);
  return { x: lerp(topX, botX, v), y: lerp(topY, botY, v) };
}

function grayAt(rgba: Uint8Array, w: number, h: number, x: number, y: number) {
  const xx = Math.max(0, Math.min(w - 1, x | 0));
  const yy = Math.max(0, Math.min(h - 1, y | 0));
  const i = (yy * w + xx) * 4;
  return 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
}

function regionMeanGray(rgba: Uint8Array, w: number, h: number, cx: number, cy: number, r: number) {
  let sum = 0, cnt = 0;
  const x0 = Math.floor(cx - r), x1 = Math.floor(cx + r);
  const y0 = Math.floor(cy - r), y1 = Math.floor(cy + r);
  const rr = r * r;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= rr) {
        sum += grayAt(rgba, w, h, x, y);
        cnt++;
      }
    }
  }
  return cnt ? sum / cnt : 255;
}

function toOption(i: number): Option {
  return (["A", "B", "C", "D"][i] as Option) ?? "A";
}

/**
 * ✅ Köşe marker’ları daha sağlam bulma:
 * - görüntüyü downsample ederek (hız)
 * - corner ROI içinde “siyah yoğunluğu maksimum” olan pencereyi bul
 */
function findCornerByDensity(rgba: Uint8Array, w: number, h: number, corner: "tl" | "tr" | "bl" | "br") {
  // downsample oranı
  const ds = 3;
  const W = Math.floor(w / ds);
  const H = Math.floor(h / ds);

  // ROI %22 (sende %20 idi, biraz artırdım)
  const rx0 = corner.includes("r") ? Math.floor(W * 0.78) : 0;
  const rx1 = corner.includes("r") ? W - 1 : Math.floor(W * 0.22);
  const ry0 = corner.includes("b") ? Math.floor(H * 0.78) : 0;
  const ry1 = corner.includes("b") ? H - 1 : Math.floor(H * 0.22);

  // adaptif threshold: ROI’dan örnekleyip “koyu” sınırı seç
  // basit: birkaç noktanın ortalaması
  let sampleSum = 0, sampleCnt = 0;
  for (let yy = ry0; yy <= ry1; yy += 8) {
    for (let xx = rx0; xx <= rx1; xx += 8) {
      sampleSum += grayAt(rgba, w, h, xx * ds, yy * ds);
      sampleCnt++;
    }
  }
  const mean = sampleCnt ? sampleSum / sampleCnt : 200;
  const thr = Math.max(55, Math.min(120, mean * 0.55)); // “siyah” eşiği

  // pencere boyutu (marker karelerine göre)
  const win = Math.max(10, Math.floor(Math.min(W, H) * 0.06));
  const step = 3;

  let bestScore = -1;
  let bestX = -1, bestY = -1;

  for (let y = ry0; y + win <= ry1; y += step) {
    for (let x = rx0; x + win <= rx1; x += step) {
      // penceredeki siyah sayısı (coarse)
      let blacks = 0;
      for (let yy = 0; yy < win; yy += 2) {
        for (let xx = 0; xx < win; xx += 2) {
          const g = grayAt(rgba, w, h, (x + xx) * ds, (y + yy) * ds);
          if (g < thr) blacks++;
        }
      }
      if (blacks > bestScore) {
        bestScore = blacks;
        bestX = x + win / 2;
        bestY = y + win / 2;
      }
    }
  }

  if (bestScore < 15) return null;

  // upscale geri
  return { x: bestX * ds, y: bestY * ds };
}

/**
 * ✅ Satırları otomatik bul (backend’deki gibi):
 * - bubble kolon bandında threshold edilmiş siyah yoğunluğu projeksiyonu
 * - her soru için beklenen y çevresinde local max al
 */
function detectRowsAuto(rgba: Uint8Array, w: number, h: number, corners: Corners, qCount: number, colU: number[]) {
  // önce yaklaşık “bubble band” için sample noktalarla dikey projeksiyon çıkaralım
  // v boyunca tarayacağız; u’ları A/B/C/D kolonları.
  // ROI: formun içi => v 0.16..0.92
  const vStart = 0.16;
  const vEnd = 0.92;

  const Hs = 900; // projeksiyon çözünürlüğü (hız için)
  const proj = new Float32Array(Hs);

  // threshold: global örnekleme
  let mSum = 0, mCnt = 0;
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    mSum += grayAt(rgba, w, h, x, y);
    mCnt++;
  }
  const gMean = mCnt ? mSum / mCnt : 200;
  const thr = Math.max(70, Math.min(140, gMean * 0.62));

  for (let yi = 0; yi < Hs; yi++) {
    const v = vStart + (yi / (Hs - 1)) * (vEnd - vStart);

    // aynı satırda kolonların çevresinden birkaç örnek
    let blacks = 0;
    const sampleR = 10;

    for (const u of colU) {
      const pt = getPointOnPaper(corners, u, v);

      // küçük disk örneklemesi
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        const sx = pt.x + Math.cos(ang) * sampleR;
        const sy = pt.y + Math.sin(ang) * sampleR;
        if (grayAt(rgba, w, h, sx, sy) < thr) blacks++;
      }
    }

    proj[yi] = blacks;
  }

  // smooth
  const smooth = new Float32Array(Hs);
  const k = 21;
  for (let i = 0; i < Hs; i++) {
    let s = 0, c = 0;
    for (let j = -k; j <= k; j++) {
      const ii = i + j;
      if (ii >= 0 && ii < Hs) {
        s += proj[ii];
        c++;
      }
    }
    smooth[i] = c ? s / c : proj[i];
  }

  // her soru için local max (window = step*0.30)
  const rowsV: number[] = [];
  const step = (vEnd - vStart) / Math.max(1, (qCount - 1));
  const win = step * 0.30;

  for (let qi = 0; qi < qCount; qi++) {
    const v0 = vStart + qi * step;
    const aV = Math.max(vStart, v0 - win);
    const bV = Math.min(vEnd, v0 + win);

    const aI = Math.floor(((aV - vStart) / (vEnd - vStart)) * (Hs - 1));
    const bI = Math.floor(((bV - vStart) / (vEnd - vStart)) * (Hs - 1));

    let bestI = aI;
    let bestVal = -1;

    for (let i = aI; i <= bI; i++) {
      if (smooth[i] > bestVal) {
        bestVal = smooth[i];
        bestI = i;
      }
    }

    const vBest = vStart + (bestI / (Hs - 1)) * (vEnd - vStart);
    rowsV.push(vBest);
  }

  return rowsV;
}

function analyzeOMR(rgba: Uint8Array, w: number, h: number, qCount: number): AnalyzeResult {
  const colU = [0.32, 0.50, 0.68, 0.86];

  const tl = findCornerByDensity(rgba, w, h, "tl");
  const tr = findCornerByDensity(rgba, w, h, "tr");
  const bl = findCornerByDensity(rgba, w, h, "bl");
  const br = findCornerByDensity(rgba, w, h, "br");

  // ✅ BAŞARISIZ RETURN BURASI
  if (!tl || !tr || !bl || !br) {
    return { reason: "marker-not-found" };
  }

  const corners: Corners = { tl, tr, bl, br };

  const avgWidth = ((tr.x - tl.x) + (br.x - bl.x)) / 2;
  const radius = avgWidth * 0.022;

  // ✅ ilk 2 soruyu kaçırmaması için vStart yukarı
  const rowsV = detectRowsAuto(rgba, w, h, corners, qCount, colU);

  const answers: AnswersMap = {};
  const debugPoints: ScanPoint[] = [];

  for (let q = 0; q < qCount; q++) {
    const v = rowsV[q];

    const row = colU.map((u, idx) => {
      const pt = getPointOnPaper(corners, u, v);
      const g = regionMeanGray(rgba, w, h, pt.x, pt.y, radius); // düşük= daha siyah
      debugPoints.push({ x: pt.x, y: pt.y, val: g, q: q + 1, opt: toOption(idx) });
      return { g, idx };
    });

    row.sort((a, b) => a.g - b.g);
    const darkest = row[0];
    const second = row[1];
    const distinction = second.g - darkest.g;

  
    if (distinction > 10 && darkest.g < 185) {
      answers[q + 1] = toOption(darkest.idx);
    } else {
      answers[q + 1] = null;
    }
  }

  // ✅ BAŞARILI RETURN BURASI (debugPoints adıyla!)
  return { answers, corners, debugPoints };
}

export default function OMR() {
  (globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

  const { qCount: rawQCount } = useLocalSearchParams<{ qCount?: string }>();
  const qCount = useMemo(() => Math.max(1, Number(rawQCount ?? "15")), [rawQCount]);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersMap | null>(null);

  const [imgDisplay, setImgDisplay] = useState<{ width: number; height: number; uri: string; imgW: number; imgH: number } | null>(null);
  const [debugData, setDebugData] = useState<{ corners: Corners; points: ScanPoint[]; imgW: number; imgH: number } | null>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const decodeFromUri = async (uri: string) => {
    // ✅ biraz daha büyük tutalım (1000 bazen az kalıyor)
    const normalized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1400 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!normalized.base64) throw new Error("no-base64");
    const bytes = b64ToU8(normalized.base64);
    const d = jpeg.decode(bytes, { useTArray: true });
    return { data: d.data as Uint8Array, width: d.width, height: d.height, uri: normalized.uri };
  };

  const analyze = async (uri: string) => {
    setStatus("analyzing");
    setMessage(null);
    setAnswers(null);
    setDebugData(null);

    try {
      const decoded = await decodeFromUri(uri);

      // görüntü ekran boyutu (contain)
      const screenW = Dimensions.get("window").width - 32;
      const scale = screenW / decoded.width;
      const displayH = decoded.height * scale;

      setImgDisplay({ width: screenW, height: displayH, uri: decoded.uri, imgW: decoded.width, imgH: decoded.height });

      const out = analyzeOMR(decoded.data, decoded.width, decoded.height, qCount);
      
      if ("reason" in out) {
        setMessage("Köşe işaretleri bulunamadı. Formun tamamı ve 4 siyah köşe görünmeli.");
        setStatus("done");
        return;
      }

      setAnswers(out.answers);
      setDebugData({
        corners: out.corners,
        points: out.debugPoints,
        imgW: decoded.width,
        imgH: decoded.height,
      });
      setStatus("done");

      if (!("corners" in out)) {
        setMessage("Köşe işaretleri bulunamadı. Formun tamamı ve 4 siyah köşe görünmeli.");
        setStatus("done");
        return;
      }

      setAnswers(out.answers);
      setDebugData({ corners: out.corners, points: out.debugPoints, imgW: decoded.width, imgH: decoded.height });
      setStatus("done");
    } catch (e: any) {
      setMessage("Hata: " + (e?.message || "Bilinmeyen hata"));
      setStatus("done");
    }
  };

  const handleImageSelect = async (uri: string) => {
    // ✅ foto seçince direkt sonuç ekranına geçiyoruz
    setImageUri(uri);
    await analyze(uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setMessage("Galeri izni yok.");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // ✅ kırpma yok
      quality: 1,
    });

    if (!res.canceled && res.assets?.length) {
      await handleImageSelect(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef) return;
    // ✅ bazı cihazlarda skipProcessing blank yapabiliyor → kaldırdım
    const photo = await cameraRef.takePictureAsync({ quality: 0.85 });
    await handleImageSelect(photo.uri);
  };

  const renderDebugOverlay = () => {
    if (!debugData || !imgDisplay) return null;

    const { corners, points } = debugData;
    const imgW = imgDisplay.imgW;
    const imgH = imgDisplay.imgH;

    const toLeft = (x: number) => (x / imgW) * imgDisplay.width;
    const toTop = (y: number) => (y / imgH) * imgDisplay.height;

    return (
      <View style={{ position: "absolute", left: 0, top: 0, width: imgDisplay.width, height: imgDisplay.height, zIndex: 10 }}>
        {[corners.tl, corners.tr, corners.bl, corners.br].map((c, i) => (
          <View
            key={`c-${i}`}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              backgroundColor: "cyan",
              left: toLeft(c.x) - 6,
              top: toTop(c.y) - 6,
            }}
          />
        ))}

        {points.map((p, i) => {
          const isDark = p.val < 175;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: toLeft(p.x) - 3,
                top: toTop(p.y) - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isDark ? "#00ff00" : "rgba(255,0,255,0.35)",
              }}
            />
          );
        })}
      </View>
    );
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Kamera izni gerekli.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ marginTop: 10, color: "blue" }}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Kamera ekranı (foto seçilene kadar)
  if (!imageUri) {
    return (
      <CameraView ref={setCameraRef} style={{ flex: 1 }}>
        <View style={{ position: "absolute", top: 50, left: 20 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>OMR Tarama</Text>
          <Text style={{ color: "#fff", opacity: 0.8 }}>Formun tamamı + 4 köşe görünmeli.</Text>
        </View>

        <View style={{ position: "absolute", bottom: 40, flexDirection: "row", width: "100%", justifyContent: "center", gap: 20 }}>
          <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: "#2563eb", padding: 15, borderRadius: 10 }}>
            <Text style={{ color: "#fff" }}>Fotoğraf Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromGallery} style={{ backgroundColor: "#1f2937", padding: 15, borderRadius: 10 }}>
            <Text style={{ color: "#fff" }}>Galeriden Yükle</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  // ✅ Sonuç ekranı (analiz overlay burada)
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Analiz Sonucu</Text>

      {imgDisplay && (
        <View
          style={{
            position: "relative",
            width: imgDisplay.width,
            height: imgDisplay.height,
            backgroundColor: "#000",
            alignSelf: "center",
            marginBottom: 16,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Image source={{ uri: imgDisplay.uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          {renderDebugOverlay()}

          {status === "analyzing" && (
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.55)",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Analiz ediliyor...</Text>
            </View>
          )}
        </View>
      )}

      {message && <Text style={{ color: "red", textAlign: "center", marginTop: 6 }}>{message}</Text>}

      {answers && (
        <View style={{ padding: 12, backgroundColor: "#f3f4f6", borderRadius: 10 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Cevaplar:</Text>
          {Array.from({ length: qCount }, (_, i) => i + 1).map((q) => (
            <Text key={q} style={{ fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) }}>
              {q}. {answers[q] ?? "-"}
            </Text>
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={() => analyze(imageUri)}
          style={{ flex: 1, padding: 12, borderWidth: 1, borderRadius: 10, borderColor: "#2563eb" }}
        >
          <Text style={{ textAlign: "center", color: "#2563eb" }}>Tekrar Dene</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setImageUri(null);
            setAnswers(null);
            setDebugData(null);
            setImgDisplay(null);
            setMessage(null);
            setStatus("idle");
          }}
          style={{ flex: 1, padding: 12, backgroundColor: "#2563eb", borderRadius: 10 }}
        >
          <Text style={{ textAlign: "center", color: "#fff" }}>Yeni Fotoğraf</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
