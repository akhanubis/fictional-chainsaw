import ColorUtils from './utils/ColorUtils'
import ContractToWorld from './utils/ContractToWorld'
import WorldToContract from './utils/WorldToContract'

class Pixel {
  constructor(x, y, color, owner, price, old_color, index) {
    this.x = x
    this.y = y
    this.color = color
    this.owner = owner
    this.price = price
    this.old_color = old_color
    this.index = index
  }

  static from_event(owner, event) {
    let i = event.i
    let coords = ContractToWorld.index_to_coords(i)
    let p = new this(
      coords.x,
      coords.y,
      ColorUtils.bytes3ToHex(event.color),
      owner,
      event.price,
      null,
      i
    )
    p.painted = event.painted
    return p
  }

  change_color(new_color) {
    this.old_color = this.color
    this.color = new_color
    return this
  }

  image_data() {
    var pixel_array = new Uint8ClampedArray(ColorUtils.hexToIntArray(this.color))
    return new ImageData(pixel_array, 1, 1)
  }

  rgba_color() {
    return ColorUtils.hexToRgb(this.color)
  }

  contract_index() {
    return new WorldToContract(this.x, this.y).get_index()
  }

  bytes3_color() {
    return ColorUtils.hexToBytes3(this.color)
  }

  is_inside_canvas(max_index) {
    return this.index <= max_index
  }

  is_new() {
    return this.owner === '0x0000000000000000000000000000000000000000'
  }

  same_coords(p) {
    return p.x === this.x && p.y === this.y
  }

  to_key() {
    return `${this.tx}_${this.x}_${this.y}`
  }
}

export default Pixel