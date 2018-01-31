import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import './HoverInfo.css'

class HoverInfo extends Component {
  render() {
    if (this.props.pixel) {
      let ownage = this.props.pixel.is_new() ? '' : ` painted by ${this.props.pixel.owner}`
      return (
        <div className="footer hover-info">
          <div className="container-fluid pixel-status">
            <PixelSquare color={this.props.pixel.color} />
            <span className="text-muted">({this.props.pixel.x}, {this.props.pixel.y}) {this.props.cooldown_formatter.format(this.props.pixel.locked_until)}{ownage}</span>
          </div>
        </div>
    )}
    else
      return null
  }
}

export default HoverInfo