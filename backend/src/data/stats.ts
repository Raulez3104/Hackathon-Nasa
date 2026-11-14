/** Estadística básica y contrastes sin dependencias externas. */

export function mean(values: Array<number | null | undefined>): number | null {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (clean.length === 0) return null;
  return clean.reduce((total, value) => total + value, 0) / clean.length;
}

export function minMax(values: Array<number | null | undefined>): [number | null, number | null] {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (clean.length === 0) return [null, null];
  return [Math.min(...clean), Math.max(...clean)];
}

export function round(value: number | null, digits = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function betacf(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 3e-12;
  const fpmin = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const logBeta = lgamma(a + b) - lgamma(a) - lgamma(b);
  const front = Math.exp(logBeta + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betacf(a, b, x)) / a;
  return 1 - (front * betacf(b, a, 1 - x)) / b;
}

function lgamma(value: number): number {
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let x = value;
  let y = value;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const coefficient of coefficients) {
    y += 1;
    ser += coefficient / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

export function tPValue(tStatistic: number | null, degreesFreedom: number): number | null {
  if (tStatistic === null || degreesFreedom <= 0) return null;
  const x = degreesFreedom / (degreesFreedom + tStatistic * tStatistic);
  return betai(degreesFreedom / 2, 0.5, x);
}

export function ols(xs: number[], ys: number[]): {
  slope: number | null;
  intercept: number | null;
  r: number | null;
  pValue: number | null;
  n: number;
} {
  const pairs = xs.map((x, index) => [x, ys[index]] as const).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = pairs.length;
  if (n < 2) return { slope: null, intercept: null, r: null, pValue: null, n };
  const meanX = pairs.reduce((total, [x]) => total + x, 0) / n;
  const meanY = pairs.reduce((total, [, y]) => total + y, 0) / n;
  const covariance = pairs.reduce((total, [x, y]) => total + (x - meanX) * (y - meanY), 0);
  const varianceX = pairs.reduce((total, [x]) => total + (x - meanX) ** 2, 0);
  const varianceY = pairs.reduce((total, [, y]) => total + (y - meanY) ** 2, 0);
  if (varianceX === 0) return { slope: null, intercept: null, r: null, pValue: null, n };
  const slope = covariance / varianceX;
  const intercept = meanY - slope * meanX;
  const r = varianceY > 0 ? covariance / Math.sqrt(varianceX * varianceY) : null;
  let pValue: number | null = null;
  if (r !== null) {
    if (Math.abs(r) >= 1) pValue = 0;
    else {
      const t = r * Math.sqrt((n - 2) / (1 - r * r));
      pValue = tPValue(t, n - 2);
    }
  }
  return { slope, intercept, r, pValue, n };
}

function ranks(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array<number>(values.length).fill(0);
  let position = 0;
  while (position < indexed.length) {
    let end = position;
    while (end + 1 < indexed.length && indexed[end + 1].value === indexed[position].value) end += 1;
    const averageRank = (position + end) / 2 + 1;
    for (let offset = position; offset <= end; offset += 1) result[indexed[offset].index] = averageRank;
    position = end + 1;
  }
  return result;
}

export function pearson(xs: number[], ys: number[]): { coefficient: number | null; pValue: number | null; n: number } {
  const pairs = xs.map((x, index) => [x, ys[index]] as const).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = pairs.length;
  if (n < 2) return { coefficient: null, pValue: null, n };
  const meanX = pairs.reduce((total, [x]) => total + x, 0) / n;
  const meanY = pairs.reduce((total, [, y]) => total + y, 0) / n;
  const covariance = pairs.reduce((total, [x, y]) => total + (x - meanX) * (y - meanY), 0);
  const varianceX = pairs.reduce((total, [x]) => total + (x - meanX) ** 2, 0);
  const varianceY = pairs.reduce((total, [, y]) => total + (y - meanY) ** 2, 0);
  if (varianceX === 0 || varianceY === 0) return { coefficient: null, pValue: null, n };
  const coefficient = Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY)));
  let pValue: number | null = null;
  if (Math.abs(coefficient) >= 1) pValue = 0;
  else {
    const t = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    pValue = tPValue(t, n - 2);
  }
  return { coefficient, pValue, n };
}

export function spearman(xs: number[], ys: number[]): { coefficient: number | null; pValue: number | null; n: number } {
  const pairs = xs.map((x, index) => [x, ys[index]] as const).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 2) return { coefficient: null, pValue: null, n: pairs.length };
  return pearson(
    ranks(pairs.map(([x]) => x)),
    ranks(pairs.map(([, y]) => y)),
  );
}
