/**
 * useWeather —— 实时天气（Open-Meteo，免密钥、CORS 友好）。
 * 定位优先；失败/拒绝则默认城市，可在岛上手动切换。
 * 结果缓存 10 分钟（localStorage），离线时回退旧缓存，绝不打断岛的可用。
 */
import { useCallback, useEffect, useState } from "react";

export type WxKind = "sun" | "cloud" | "fog" | "rain" | "snow" | "storm";

export interface WeatherInfo {
  temp: number;
  code: number;
  wind: number;
  kind: WxKind;
  label: string;
  city: string;
  at: number;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { id: "shanghai", name: "上海", lat: 31.23, lon: 121.47 },
  { id: "beijing", name: "北京", lat: 39.9, lon: 116.41 },
  { id: "guangzhou", name: "广州", lat: 23.13, lon: 113.26 },
  { id: "shenzhen", name: "深圳", lat: 22.54, lon: 114.06 },
  { id: "hangzhou", name: "杭州", lat: 30.29, lon: 120.16 },
  { id: "chengdu", name: "成都", lat: 30.57, lon: 104.07 },
];

const WX_KEY = "guangyu-weather-v1";
const CITY_KEY = "guangyu-city-v1";
const TTL = 10 * 60 * 1000;

/** WMO 天气码 → 岛上说法 */
export function mapCode(code: number): { kind: WxKind; label: string } {
  if (code === 0) return { kind: "sun", label: "晴" };
  if (code === 1) return { kind: "sun", label: "少云" };
  if (code === 2) return { kind: "cloud", label: "多云" };
  if (code === 3) return { kind: "cloud", label: "阴" };
  if (code === 45 || code === 48) return { kind: "fog", label: "雾" };
  if (code >= 51 && code <= 57) return { kind: "rain", label: "毛毛雨" };
  if (code >= 80 && code <= 82) return { kind: "rain", label: "阵雨" };
  if ((code >= 61 && code <= 67) || code === 96 || code === 99) return { kind: "rain", label: "雨" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: "snow", label: "雪" };
  if (code >= 95) return { kind: "storm", label: "雷雨" };
  return { kind: "cloud", label: "云" };
}

function readCache(): WeatherInfo | null {
  try {
    const raw = localStorage.getItem(WX_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherInfo;
  } catch {
    return null;
  }
}

function readCity(): City | null {
  try {
    const raw = localStorage.getItem(CITY_KEY);
    return raw ? (JSON.parse(raw) as City) : null;
  } catch {
    return null;
  }
}

function saveCity(c: City) {
  try {
    localStorage.setItem(CITY_KEY, JSON.stringify(c));
  } catch {
    /* 忽略 */
  }
}

async function fetchCity(city: City): Promise<WeatherInfo> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const j = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number } };
  const cur = j.current ?? {};
  const { kind, label } = mapCode(cur.weather_code ?? 2);
  let name = city.name;
  if (city.id === "auto") {
    try {
      const g = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${city.lat}&longitude=${city.lon}&count=1&language=zh`
      );
      const gj = (await g.json()) as { results?: { name?: string }[] };
      const r = gj.results?.[0];
      if (r?.name) name = r.name;
      else name = "附近";
    } catch {
      name = "附近";
    }
  }
  return {
    temp: Math.round(cur.temperature_2m ?? 0),
    code: cur.weather_code ?? 2,
    wind: Math.round(cur.wind_speed_10m ?? 0),
    kind,
    label,
    city: name,
    at: Date.now(),
  };
}

function locate(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, maximumAge: 30 * 60 * 1000 }
    );
  });
}

function toCity(pos: { lat: number; lon: number }): City {
  return {
    id: "auto",
    name: "附近",
    lat: Math.round(pos.lat * 100) / 100,
    lon: Math.round(pos.lon * 100) / 100,
  };
}

export function useWeather() {
  const [wx, setWx] = useState<WeatherInfo | null>(() => readCache());
  const [loading, setLoading] = useState(false);
  const [cityId, setCityId] = useState<string>(() => readCity()?.id ?? "");

  const load = useCallback(async (city: City) => {
    setLoading(true);
    try {
      const info = await fetchCity(city);
      setWx(info);
      try {
        localStorage.setItem(WX_KEY, JSON.stringify(info));
      } catch {
        /* 忽略 */
      }
    } catch {
      /* 断网/失败：保留旧缓存，什么都不展示也不打断 */
    } finally {
      setLoading(false);
    }
  }, []);

  /* 启动：缓存 → 已选城市 → 首次定位（失败则默认上海）；之后每 10 分钟刷新 */
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const cached = readCache();
      const fresh = cached !== null && Date.now() - cached.at < TTL;
      const saved = readCity();
      if (saved) {
        if (!cancelled) setCityId(saved.id);
        if (!fresh) await load(saved);
        return;
      }
      const pos = await locate();
      if (cancelled) return;
      const city: City = pos ? toCity(pos) : CITIES[0];
      saveCity(city);
      setCityId(city.id);
      await load(city);
    };
    void boot();
    const iv = window.setInterval(() => {
      const c = readCity();
      if (c) void load(c);
    }, TTL);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [load]);

  /** 切换城市（"auto" = 重新定位） */
  const pick = useCallback(
    (id: string) => {
      if (id === "auto") {
        void locate().then((pos) => {
          const city: City = pos ? toCity(pos) : CITIES[0];
          saveCity(city);
          setCityId(city.id);
          void load(city);
        });
        return;
      }
      const c = CITIES.find((x) => x.id === id);
      if (!c) return;
      saveCity(c);
      setCityId(c.id);
      void load(c);
    },
    [load]
  );

  const refresh = useCallback(() => {
    const c = readCity();
    if (c) void load(c);
  }, [load]);

  return { wx, loading, cityId, pick, refresh };
}
