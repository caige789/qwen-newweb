/**
 * AudioEngine —— 纯 Web Audio API 前端合成，不加载任何音频文件。
 * 拨弦（Karplus-Strong）/ 卷积混响 / 风铃 / 风声 / 低频哼鸣 / 和弦循环（C–G–Am–F）
 * 六层自然声 / 八音盒 / 羊叫 / 瓶塞 / 水花 / 星光 / 海鸥 / 水晶 / 急雨 / NPC 音节。
 */

export type NoiseLayerId = "rain" | "tide" | "wind" | "fire" | "brook" | "cricket";

const NOISE_MAX: Record<NoiseLayerId, number> = {
  rain: 0.5,
  tide: 0.65,
  wind: 0.5,
  fire: 0.6,
  brook: 0.42,
  cricket: 0.5,
};

interface NoiseHandle {
  outer: GainNode;
  level: number;
  sources: AudioScheduledSourceNode[];
  timers: number[];
}

const CHORDS: number[][] = [
  [130.81, 164.81, 196.0, 261.63],
  [98.0, 123.47, 146.83, 196.0],
  [110.0, 130.81, 164.81, 220.0],
  [87.31, 110.0, 130.81, 174.61],
];
const BAR_SECONDS = 4.8;
const CHIME_FREQS = [1318.51, 1567.98, 1760.0, 2093.0, 2349.32, 2637.02];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private windBus: GainNode | null = null;
  private noiseBus: GainNode | null = null;
  private wetBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;
  private windSrc: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private noiseLayers = new Map<NoiseLayerId, NoiseHandle>();
  private chordTimer: number | null = null;
  private nextBar = 0;
  private chordIdx = 0;
  private stringCache = new Map<number, AudioBuffer>();

  enabled = true;
  volume = 0.8;
  musicOn = false;
  windOn = false;

  unlock() {
    this.ensure();
  }

  get hasContext() {
    return this.ctx !== null;
  }

  get now() {
    return this.ctx?.currentTime ?? 0;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;

    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.musicBus = ctx.createGain();
    this.windBus = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // 卷积混响（纯代码生成脉冲响应：2.6s 指数衰减噪声）
    const irLen = Math.floor(ctx.sampleRate * 2.6);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = ir;
    this.wetBus = ctx.createGain();
    this.wetBus.gain.value = 0.34;
    this.wetBus.connect(convolver);
    convolver.connect(this.master);

    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.master.connect(this.analyser);
    this.musicBus.connect(this.master);
    this.windBus.connect(this.master);

    // 白噪声
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;

    // 粉噪声（林风素材）
    const pink = ctx.createBuffer(1, len, ctx.sampleRate);
    const pd = pink.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const wn = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + wn * 0.0555179;
      b1 = 0.99332 * b1 + wn * 0.0750759;
      b2 = 0.969 * b2 + wn * 0.153852;
      b3 = 0.8665 * b3 + wn * 0.3104856;
      b4 = 0.55 * b4 + wn * 0.5329522;
      b5 = -0.7616 * b5 - wn * 0.016898;
      pd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wn * 0.5362) * 0.11;
      b6 = wn * 0.115926;
    }
    this.pinkBuffer = pink;

    // 棕噪声（潮汐 / 篝火素材）
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const bd = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const wn = Math.random() * 2 - 1;
      last = (last + 0.02 * wn) / 1.02;
      bd[i] = last * 3.2;
    }
    this.brownBuffer = brown;

    this.noiseBus = ctx.createGain();
    this.noiseBus.gain.value = 1;
    this.noiseBus.connect(this.master);

    if (this.windOn) this.buildWindNodes();
    if (this.musicOn) this.startChordTimer();
    return ctx;
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  setEnabled(b: boolean) {
    this.enabled = b;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(b ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  getFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteFrequencyData(target);
    return true;
  }

  /* ---------------- 拨弦（Karplus-Strong，更自然的"石头琴"音色） ---------------- */

  private pluckBuffer(freq: number): AudioBuffer {
    const ctx = this.ctx as AudioContext;
    const key = Math.round(freq);
    const cached = this.stringCache.get(key);
    if (cached) return cached;

    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const dur = 2.4;
    const len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const delay = new Float32Array(N);
    for (let i = 0; i < N; i++) delay[i] = Math.random() * 2 - 1;

    let ptr = 0;
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const cur = delay[ptr];
      const avg = 0.5 * (cur + delay[(ptr + 1) % N]);
      delay[ptr] = avg * 0.9945;
      const lp = prev * 0.4 + cur * 0.6;
      prev = cur;
      d[i] = lp;
      ptr = (ptr + 1) % N;
    }
    if (this.stringCache.size > 24) this.stringCache.clear();
    this.stringCache.set(key, buf);
    return buf;
  }

  pluck(freq: number, vel = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.pluckBuffer(freq);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3400, t);
    filter.frequency.exponentialRampToValueAtTime(1100, t + 1.6);
    filter.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.34 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    if (this.wetBus) g.connect(this.wetBus);
    src.start(t);
    src.stop(t + 2.3);

    // 微光泛音
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2.001;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.045 * vel, t + 0.012);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    shimmer.connect(sg);
    sg.connect(this.master);
    shimmer.start(t);
    shimmer.stop(t + 1.3);
  }

  /* ---------------- 登岛：一声由远及近的和弦涌动 ---------------- */
  playEnterSwell() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    [130.81, 164.81, 196.0, 261.63].forEach((f, i) => {
      window.setTimeout(() => this.pluck(f, 0.8), i * 130);
    });
    window.setTimeout(() => this.playChime(3), 620);
    this.playWindBurst(2.2, 0.09);
  }

  /* ---------------- 风铃 ---------------- */
  playChime(count = 4) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    const picked = [...CHIME_FREQS].sort(() => Math.random() - 0.5).slice(0, count);
    picked.forEach((f, i) => {
      const t = t0 + i * 0.085 + Math.random() * 0.03;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      osc.connect(g);
      g.connect(this.master as GainNode);
      if (this.wetBus) g.connect(this.wetBus);
      osc.start(t);
      osc.stop(t + 2);
    });
  }

  /* ---------------- 风声（一阵） ---------------- */
  playWindBurst(dur = 1.8, peak = 0.16) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.linearRampToValueAtTime(1300, t + dur * 0.6);
    filter.frequency.linearRampToValueAtTime(500, t + dur);
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  /* ---------------- 长按低频哼鸣（174Hz 治愈音） ---------------- */
  hum() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    [174.61, 261.63].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const peak = i === 0 ? 0.06 : 0.028;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
      osc.connect(g);
      g.connect(this.master as GainNode);
      if (this.wetBus) g.connect(this.wetBus);
      osc.start(t);
      osc.stop(t + 1.8);
    });
  }

  /* ---------------- 签筒木响 ---------------- */
  woodKnock() {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(82, t + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.16);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900 + Math.random() * 500;
    bp.Q.value = 2.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(this.master);
    src.start(t, Math.random(), 0.08);
    src.stop(t + 0.09);
  }

  /* ---------------- 背景音乐：C–G–Am–F ---------------- */
  startMusic() {
    if (this.musicOn) return;
    this.musicOn = true;
    const ctx = this.ensure();
    if (!ctx) return;
    this.nextBar = ctx.currentTime + 0.15;
    this.chordIdx = 0;
    this.startChordTimer();
  }

  private startChordTimer() {
    if (this.chordTimer !== null) return;
    this.chordTimer = window.setInterval(() => this.scheduleChords(), 320);
  }

  private scheduleChords() {
    const ctx = this.ctx;
    if (!ctx || !this.musicOn || !this.musicBus) return;
    while (this.nextBar < ctx.currentTime + 1.6) {
      this.playChord(this.nextBar, CHORDS[this.chordIdx % CHORDS.length]);
      this.chordIdx++;
      this.nextBar += BAR_SECONDS;
    }
  }

  private playChord(t: number, freqs: number[]) {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.042, t + 1.7);
      g.gain.setValueAtTime(0.042, t + BAR_SECONDS - 1.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + BAR_SECONDS + 1.6);
      osc.connect(g);
      g.connect(this.musicBus as GainNode);
      osc.start(t);
      osc.stop(t + BAR_SECONDS + 1.8);
    });
    const sparkle = ctx.createOscillator();
    sparkle.type = "sine";
    sparkle.frequency.value = freqs[Math.floor(Math.random() * freqs.length)] * 4;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t + 0.8);
    sg.gain.linearRampToValueAtTime(0.012, t + 2.2);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + BAR_SECONDS + 1);
    sparkle.connect(sg);
    sg.connect(this.musicBus);
    sparkle.start(t + 0.8);
    sparkle.stop(t + BAR_SECONDS + 1.2);
  }

  stopMusic() {
    this.musicOn = false;
    if (this.chordTimer !== null) {
      window.clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
  }

  /* ---------------- 环境风声（持续） ---------------- */
  startWind() {
    if (this.windOn) return;
    this.windOn = true;
    const ctx = this.ensure();
    if (!ctx) return;
    this.buildWindNodes();
  }

  private buildWindNodes() {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer || !this.windBus || this.windSrc) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 340;
    filter.Q.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    src.connect(filter);
    filter.connect(this.windBus);
    const t = ctx.currentTime;
    this.windBus.gain.setValueAtTime(0.0001, t);
    this.windBus.gain.exponentialRampToValueAtTime(0.055, t + 2.5);
    src.start(t);
    lfo.start(t);
    this.windSrc = src;
    this.windLfo = lfo;
  }

  stopWind() {
    this.windOn = false;
    const ctx = this.ctx;
    if (ctx && this.windBus) {
      this.windBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    }
    const src = this.windSrc;
    const lfo = this.windLfo;
    this.windSrc = null;
    this.windLfo = null;
    if (ctx) {
      window.setTimeout(() => {
        try {
          src?.stop();
          lfo?.stop();
        } catch {
          /* already stopped */
        }
      }, 1600);
    }
  }

  /* ---------------- 自然声混音（声息页） ---------------- */

  setNoise(id: NoiseLayerId, level: number) {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBus) return;
    const v = Math.min(1, Math.max(0, level));
    let h = this.noiseLayers.get(id);
    if (!h) {
      if (v <= 0) return;
      h = this.buildNoiseLayer(id);
      this.noiseLayers.set(id, h);
    }
    h.level = v;
    h.outer.gain.setTargetAtTime(Math.pow(v, 1.5) * NOISE_MAX[id], ctx.currentTime, 0.35);
  }

  getNoiseLevel(id: NoiseLayerId) {
    return this.noiseLayers.get(id)?.level ?? 0;
  }

  anyNoiseOn() {
    for (const [, h] of this.noiseLayers) if (h.level > 0) return true;
    return false;
  }

  stopAllNoise(fade = 0.5) {
    const ctx = this.ctx;
    const layers = [...this.noiseLayers.entries()];
    if (ctx) {
      layers.forEach(([, h]) => {
        h.level = 0;
        h.outer.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
      });
    }
    window.setTimeout(() => {
      layers.forEach(([id, h]) => this.teardownNoise(id, h));
    }, fade * 1000 + 900);
  }

  private teardownNoise(id: NoiseLayerId, h: NoiseHandle) {
    if (this.noiseLayers.get(id) === h) this.noiseLayers.delete(id);
    h.timers.forEach((t) => window.clearInterval(t));
    h.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* 已停 */
      }
    });
    try {
      h.outer.disconnect();
    } catch {
      /* 已断 */
    }
  }

  private buildNoiseLayer(id: NoiseLayerId): NoiseHandle {
    const ctx = this.ctx as AudioContext;
    const h: NoiseHandle = { outer: ctx.createGain(), level: 0, sources: [], timers: [] };
    h.outer.gain.value = 0;
    h.outer.connect(this.noiseBus as GainNode);

    const loop = (buf: AudioBuffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.start();
      h.sources.push(src);
      return src;
    };
    const lfo = (freq: number, depth: number, target: AudioParam) => {
      const o = ctx.createOscillator();
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g);
      g.connect(target);
      o.start();
      h.sources.push(o);
    };
    const white = this.noiseBuffer as AudioBuffer;
    const pink = this.pinkBuffer as AudioBuffer;
    const brown = this.brownBuffer as AudioBuffer;

    if (id === "rain") {
      const src = loop(white);
      const bp1 = ctx.createBiquadFilter();
      bp1.type = "bandpass";
      bp1.frequency.value = 5200;
      bp1.Q.value = 0.4;
      const g1 = ctx.createGain();
      g1.gain.value = 0.62;
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = 1700;
      bp2.Q.value = 0.6;
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      src.connect(bp1);
      bp1.connect(g1);
      g1.connect(h.outer);
      src.connect(bp2);
      bp2.connect(g2);
      g2.connect(h.outer);
      lfo(0.16, 0.14, g1.gain);
    } else if (id === "tide") {
      const src = loop(brown);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 460;
      lp.Q.value = 0.5;
      const inner = ctx.createGain();
      inner.gain.value = 0.5;
      src.connect(lp);
      lp.connect(inner);
      inner.connect(h.outer);
      lfo(0.083, 0.3, inner.gain);
      lfo(0.021, 0.16, inner.gain);
    } else if (id === "wind") {
      const src = loop(pink);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 520;
      bp.Q.value = 0.8;
      const inner = ctx.createGain();
      inner.gain.value = 0.85;
      src.connect(bp);
      bp.connect(inner);
      inner.connect(h.outer);
      lfo(0.05, 280, bp.frequency);
      lfo(0.11, 0.18, inner.gain);
    } else if (id === "fire") {
      const src = loop(brown);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 720;
      lp.Q.value = 0.4;
      const inner = ctx.createGain();
      inner.gain.value = 0.32;
      src.connect(lp);
      lp.connect(inner);
      inner.connect(h.outer);
      let next = ctx.currentTime + 0.12;
      const timer = window.setInterval(() => {
        const t = ctx.currentTime;
        while (next < t + 0.35) {
          this.crackle(next, h);
          next += 0.07 + Math.random() * 0.5;
        }
      }, 140);
      h.timers.push(timer);
    } else if (id === "brook") {
      const src = loop(white);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1450;
      bp.Q.value = 0.7;
      const inner = ctx.createGain();
      inner.gain.value = 0.5;
      src.connect(bp);
      bp.connect(inner);
      inner.connect(h.outer);
      lfo(0.55, 320, bp.frequency);
      lfo(0.13, 0.1, inner.gain);
    } else {
      let next = ctx.currentTime + 0.2;
      const timer = window.setInterval(() => {
        const t = ctx.currentTime;
        while (next < t + 0.45) {
          for (let p = 0; p < 3; p++) this.chirp(next + p * 0.052, h);
          next += 0.6 + Math.random() * 1.1;
        }
      }, 180);
      h.timers.push(timer);
    }
    return h;
  }

  private crackle(when: number, h: NoiseHandle) {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer as AudioBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 1600;
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    const peak = 0.05 + Math.random() * 0.28;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03 + Math.random() * 0.07);
    src.connect(bp);
    bp.connect(g);
    g.connect(h.outer);
    src.start(when, Math.random() * 1.4, 0.12);
    src.stop(when + 0.14);
  }

  private chirp(when: number, h: NoiseHandle) {
    const ctx = this.ctx as AudioContext;
    const parts: [number, number][] = [
      [4200 + Math.random() * 260, 0.045],
      [4680 + Math.random() * 220, 0.022],
    ];
    parts.forEach(([f, amp]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(amp, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
      o.connect(g);
      g.connect(h.outer);
      o.start(when);
      o.stop(when + 0.06);
    });
  }

  /* ---------------- 八音盒 ---------------- */
  musicBox(freq: number, when?: number, vel = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = when ?? ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    lp.Q.value = 0.4;
    lp.connect(this.master);
    const wet = this.wetBus;
    const partials: [number, number, number][] = [
      [1, 0.16, 1.7],
      [3.98, 0.05, 0.7],
      [9.2, 0.014, 0.35],
    ];
    partials.forEach(([mul, amp, dec]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * vel, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(g);
      g.connect(lp);
      if (wet) g.connect(wet);
      o.start(t);
      o.stop(t + dec + 0.15);
    });
  }

  /* ---------------- 数羊：软绵绵的"咻" ---------------- */
  sheepBoing(pitch = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    const f0 = 250 * pitch;
    o.frequency.setValueAtTime(f0 * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.08);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.18, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.72, t + 0.34);
    const vib = ctx.createOscillator();
    vib.frequency.value = 28;
    const vibG = ctx.createGain();
    vibG.gain.value = 9;
    vib.connect(vibG);
    vibG.connect(o.frequency);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1300;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    o.start(t);
    vib.start(t);
    o.stop(t + 0.45);
    vib.stop(t + 0.45);
  }

  /* ---------------- 漂流瓶：瓶塞"啵" ---------------- */
  corkPop() {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(430, t);
    o.frequency.exponentialRampToValueAtTime(95, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.14);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500;
    bp.Q.value = 1.4;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.1, t + 0.006);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(this.master);
    src.start(t, Math.random(), 0.1);
    src.stop(t + 0.11);
  }

  /* ---------------- 水花 ---------------- */
  splash() {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(t, Math.random() * 1.2, 0.4);
    src.stop(t + 0.42);
    // 几颗水珠
    for (let i = 0; i < 3; i++) {
      const dt = 0.08 + i * 0.07;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 800 + Math.random() * 600;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t + dt);
      og.gain.exponentialRampToValueAtTime(0.03, t + dt + 0.006);
      og.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.06);
      o.connect(og);
      og.connect(this.master);
      o.start(t + dt);
      o.stop(t + dt + 0.08);
    }
  }

  /* ---------------- 星光闪烁 ---------------- */
  twinkle() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    [2093, 2637, 3136].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      const g = ctx.createGain();
      const t0 = t + i * 0.055;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05 - i * 0.012, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      o.connect(g);
      g.connect(this.master as GainNode);
      if (this.wetBus) g.connect(this.wetBus);
      o.start(t0);
      o.stop(t0 + 0.75);
    });
  }

  /* ---------------- 水晶洞清鸣 ---------------- */
  crystalChime() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.006);
      const g = ctx.createGain();
      const amp = 0.08 / (i + 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 + i * 0.3);
      o.connect(g);
      g.connect(this.master as GainNode);
      if (this.wetBus) g.connect(this.wetBus);
      o.start(t);
      o.stop(t + 2.4);
    });
  }

  /* ---------------- 一阵急雨 ---------------- */
  rainGust(dur = 1.4) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3600;
    bp.Q.value = 0.35;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.22);
    g.gain.setValueAtTime(0.22, t + Math.max(0.3, dur - 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  /* ---------------- 海鸥两声 ---------------- */
  gullCry() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    [0, 0.42].forEach((off) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      const t0 = t + off;
      o.frequency.setValueAtTime(1250, t0);
      o.frequency.exponentialRampToValueAtTime(820, t0 + 0.16);
      o.frequency.exponentialRampToValueAtTime(1150, t0 + 0.26);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g);
      g.connect(this.master as GainNode);
      if (this.wetBus) g.connect(this.wetBus);
      o.start(t0);
      o.stop(t0 + 0.34);
    });
  }

  /* ---------------- NPC 说话的一个音节 ---------------- */
  npcBlip(base: number, jitter: number, wave: OscillatorType = "sine") {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const f = base + (Math.random() - 0.5) * jitter;
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.86, t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }
}

export const audio = new AudioEngine();

/** 五声音阶（宫商角徵羽），音律页使用 */
export const PENTATONIC = [
  { name: "宫", freq: 261.63, color: "#f4c48f" },
  { name: "商", freq: 293.66, color: "#e8b98a" },
  { name: "角", freq: 329.63, color: "#e5a3ac" },
  { name: "徵", freq: 392.0, color: "#d9a3b8" },
  { name: "羽", freq: 440.0, color: "#aecaa4" },
  { name: "少宫", freq: 523.25, color: "#a3c1d6" },
  { name: "少商", freq: 587.33, color: "#9db8cc" },
  { name: "少角", freq: 659.25, color: "#c9b8d9" },
];
