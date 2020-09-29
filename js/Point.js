export default class Point {
  constructor (x = 0, y = 0, z = 0) {
    if (Array.isArray(x)) {
      this.x = x[0]
      this.y = x[1]
      this.z = x.length > 2 ? x[2] : z
    } else {
      this.x = x
      this.y = y
      this.z = z
    }
  }

  length () {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
  }

  add (p) {
    return new Point(this.x + p.x, this.y + p.y, this.z + p.z)
  }

  sub (p) {
    return new Point(this.x - p.x, this.y - p.y, this.z - p.z)
  }

  rotY (a) {
    return new Point(
      this.x * Math.cos(a) - this.z * Math.sin(a),
      this.y,
      this.x * Math.sin(a) + this.z * Math.cos(a)
    )
  }

  rotX (a) {
    return new Point(
      this.x,
      this.y * Math.cos(a) + this.z * Math.sin(a),
      -this.y * Math.sin(a) + this.z * Math.cos(a)
    )
  }

  rotZ (a) {
    return new Point(
      this.x * Math.cos(a) + this.y * Math.sin(a),
      -this.x * Math.sin(a) + this.y * Math.cos(a),
      this.z
    )
  }

  mul (m) {
    return new Point(this.x * m, this.y * m, this.z * m)
  }
}
