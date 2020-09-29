import Point from './Point.js'

export function vector (a, b) {
  return new Point(b.x - a.x, b.y - a.y, b.z - a.z)
}

export function vecPr (a, b) {
  return new Point(a.y * b.z - a.z * b.y, -a.x * b.z + a.z * b.x, a.x * b.y - a.y * b.x)
}

export function scPr (a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function dist (a, b) {
  return a.sub(b).length()
}

export function intersect (l1, l2) {
  if (vecPr(vector(...l1), vector(...l2)).length() === 0) {
    return l1[0].add(vector(l1).mul(1e30))
  }

  const d = ((l1[0].x - l1[1].x) * (l2[0].y - l2[1].y) - (l1[0].y - l1[1].y) * (l2[0].x - l2[1].x))
  let x = (vecPr(...l1).z * (l2[0].x - l2[1].x) - vecPr(...l2).z * (l1[0].x - l1[1].x))
  let y = (vecPr(...l1).z * (l2[0].y - l2[1].y) - vecPr(...l2).z * (l1[0].y - l1[1].y))
  x /= d
  y /= d

  return new Point(x, y)
}

export function unrot (coordIn, org, diag = true, getRot = false) {
  const screenZ = 312.5
  const shift = org.mul(-1)
  const coord = coordIn.map(c => c.add(shift))
  let center = intersect(
    [coord[0], coord[2]],
    [coord[1], coord[3]]
  )
  center = new Point(center.x, center.y, screenZ)
  const rays = coord.map(c => new Point(c.x, c.y, screenZ))
  const f = []

  for (let i = 0; i < 2; i++) {
    const vp1 = vecPr(rays[0 + i], center).length()
    const vp2 = vecPr(rays[2 + i], center).length()
    let a = rays[0 + i]
    let c = rays[2 + i].mul(vp1 / vp2)
    const m = a.add(c).mul(0.5)
    const r = center.z / m.z
    a = a.mul(r)
    c = c.mul(r)
    f.push([a, c])
  }

  const [a, c] = f[0]
  const [b, d] = f[1]
  const ratio = Math.abs(dist(a, b) / dist(a, d))
  const diagDiff = ((dist(a, c) - dist(b, d))) / (dist(a, c) + dist(b, d))
  let n = vecPr(vector(a, b), vector(a, c))
  const n0 = vecPr(vector(rays[0], rays[1]), vector(rays[0], rays[2]))
  const flip = scPr(n, n0) > 0 ? 1 : -1

  if (!getRot) return diag ? diagDiff : ratio
  if (flip < 0) return null

  const fry = Math.atan(n.x / n.z)
  let s = ''
  s += '\\fry' + (-fry / Math.PI * 180).toFixed(2)

  const rotN = n.rotY(fry)
  let frx = -Math.atan(rotN.y / rotN.z)
  if (n0.z < 0) frx += Math.PI
  s += '\\frx' + (-frx / Math.PI * 180).toFixed(2)

  n = vector(a, b)
  const abUnrot = vector(a, b).rotY(fry).rotX(frx)
  let adUnrot = vector(a, d).rotY(fry).rotX(frx)
  const frz = Math.atan2(abUnrot.y, abUnrot.x)
  s += '\\frz' + (-frz / Math.PI * 180).toFixed(2)

  adUnrot = adUnrot.rotZ(frz)
  const fax = adUnrot.x / adUnrot.y
  if (Math.abs(fax) > 0.01) s += '\\fax' + fax.toFixed(2)

  return s
}

export function binarySearch (f, l, r, eps) {
  const fl = f(l)
  const fr = f(r)

  let isGreater
  if (fl <= 0 && fr >= 0) {
    isGreater = true
  } else if (fl >= 0 && fr <= 0) {
    isGreater = false
  } else {
    return null
  }

  l = Number(l)
  r = Number(r)

  while (r - l > eps) {
    const c = (l + r) / 2
    const comparisonResult = isGreater
      ? f(c) > 0
      : f(c) < 0

    if (comparisonResult) {
      r = c
    } else {
      l = c
    }
  }

  return (l + r) / 2
}

export function findEx (f, coord) {
  let wCenter = [0, 0]
  let wSize = 100000
  const iterations = Math.floor(Math.log(wSize * 100, 4))
  const s = 4
  let ex

  for (let k = 0; k < iterations; k++) {
    const res = []
    for (let i = -s; i < s; i++) {
      const x = wCenter[0] + wSize * i / 10
      for (let j = -s; j < s; j++) {
        const y = wCenter[1] + wSize * j / 10
        res.push([unrot(coord, new Point(x, y)), x, y])
      }
    }
    ex = f(res, e => e[0])
    wCenter = [ex[1], ex[2]]
    wSize /= 3
  }

  return new Point(ex[1], ex[2])
}

export function zeroOnRay (center, v, a, eps, coord) {
  const vrot = v.rotZ(a)
  const f = x => {
    const p = vrot.mul(x).add(center)
    return unrot(coord, p, true)
  }
  const l = binarySearch(f, 0, (center.length() + 1000000) / v.length(), eps)
  if (!l) return null

  const p = vrot.mul(l).add(center)
  const ratio = unrot(coord, p, false)
  const r = unrot(coord, p)
  if (!r) return null

  return [p, ratio]
}

export function max (arr, fn = e => e) {
  return arr.reduce((state, x) => {
    const value = fn(x)
    if (state.current > value) {
      state.min = x
      state.current = value
    }
    return state
  }, { min: null, current: Infinity }).min
}

export function min (arr, fn = e => e) {
  return arr.reduce((state, x) => {
    const value = fn(x)
    if (state.current < value) {
      state.min = x
      state.current = value
    }
    return state
  }, { min: null, current: -Infinity }).min
}

export function getFloats (s) {
  return (s.toString().match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/g) || []).map(Number)
}
