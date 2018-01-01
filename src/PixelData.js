import ColorUtils from './utils/ColorUtils'

class PixelData {
  constructor(x, y, color_bytes, signature_bytes, owner) {
    this.x = x
    this.y = y
    this.colors = ColorUtils.bytes32ToHexArray(color_bytes)
    this.signature = 'anu estuvo aqui' //TODO: unpack de signature
    this.owner = owner
  }
}

export default PixelData