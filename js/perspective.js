import Point from './Point.js'
import {
  dist, unrot, binarySearch, findEx, zeroOnRay, max, min, getFloats
} from './util.js'

export default function getPerspective (args) {
  const coord = getFloats(args.coord).reduce((points, e, i) => {
    const index = Math.floor(i / 2)
    if (!points[index]) points[index] = []
    points[index].push(e)
    return points
  }, []).map(e => new Point(...e))

  const targetOrigin = args.targetOrigin
  const scale = args.scale || 1

  const results = []
  if (coord.length < 4) return results

  let targetOrgs = false
  if (targetOrigin) {
    targetOrgs = []
    for (const o of targetOrigin.split(';')) {
      targetOrgs.push(new Point(...getFloats(o)))
    }
  }

  if (scale !== 1) {
    for (let i = 0; i < coord.length; i++) {
      coord[i] = coord[i].mul(scale)
    }
    if (targetOrgs) {
      for (let i = 0; i < targetOrgs.length; i++) {
        targetOrgs[i] = targetOrgs[i].mul(scale)
      }
    }
  }

  let targetRatio
  if (args.targetRatio) {
    targetRatio = getFloats(args.targetRatio)[0]
  } else {
    targetRatio = dist(coord[0], coord[1]) / dist(coord[0], coord[3])
  }


  if (targetOrgs) {
    // Transform for target org:
    for (const targetOrg of targetOrgs) {
      const tfTags = unrot(coord, targetOrg, null, true)
      if (tfTags) {
        results.push({
          ratio: null,
          tag: `\\org(${targetOrg.x}, ${targetOrg.y})` + tfTags
        })
      }
    }
  }

  const mnPoint = findEx(min, coord)
  const mxPoint = findEx(max, coord)
  const c = mnPoint.add(mxPoint).mul(0.5)
  let v = mnPoint.sub(mxPoint).rotZ(Math.PI / 2).mul(100000)
  const infP = c.add(v)

  let center
  let other

  if (unrot(coord, infP) > 0) {
    center = mnPoint
    other = mxPoint
  } else {
    center = mxPoint
    other = mnPoint
  }
  v = other.sub(center)

  const rots = []
  const steps = 100
  for (let i = 0; i < steps; i++) {
    const a = 2 * Math.PI * i / steps
    const zero = zeroOnRay(center, v, a, 1E-02, coord)
    if (!zero) continue
    const [p, ratio] = zero
    rots.push([ratio, p, a])
  }

  if (rots.length === 0) return results

  // Transforms near center of tetragon:
  const tCenter = coord[0].add(coord[1]).add(coord[2]).add(coord[3]).mul(0.25)
  const [ratio, p] = max(rots, x => dist(tCenter, x[1]))
  const tfTags = unrot(coord, p, null, true)
  if (tfTags) {
    results.push({
      ratio,
      tag: '\\org(' + [p.x, p.y] + ')' + tfTags
    })
  }

  const segs = []
  for (let i = 1; i < rots.length; i++) {
    if ((rots[i - 1][0] - targetRatio) * (rots[i][0] - targetRatio) <= 0) {
      segs.push([rots[i - 1][2], rots[i][2]])
    }
  }

  let gotTf = false
  if (segs.length > 0) {
    // Transforms with target ratio:
    for (const seg of segs) {
      const f = a => {
        const res = zeroOnRay(center, v, a, 1E-05, coord)
        if (!res) return 1E7
        const ratio = res[1]
        return ratio - targetRatio
      }
      let a = binarySearch(f, seg[0], seg[1], 1e-04)
      if (!a) a = seg[0]
      const zero = zeroOnRay(center, v, a, 1E-05, coord)
      if (!zero) continue
      const [p, ratio] = zero
      const tfTags = unrot(coord, p, null, true)
      if (!tfTags) continue
      results.push({
        ratio,
        tag: '\\org(' + [p.x, p.y] + ')' + tfTags
      })
      gotTf = true
    }
  }

  if (!gotTf && rots.length > 0) {
    // Transforms close to target ratio:
    const [ratio, p] = max(rots, x => Math.abs(targetRatio - x[0]))
    const tfTags = unrot(coord, p, null, true)

    if (tfTags) {
      results.push({
        ratio,
        tag: '\\org(' + [p.x, p.y] + ')' + tfTags
      })
    }
  }

  return results
}
