import React, { PureComponent } from 'react'
import PixelBatchItem from './PixelBatchItem'
import { Panel, Grid, Col } from 'react-bootstrap'
import './PixelBatch.css'
import EnvironmentManager from './utils/EnvironmentManager'

class PixelBatch extends PureComponent {
  constructor(props) {
    super(props)
    if (props.explorer_link) {
      let network = EnvironmentManager.get_network()
      this.explorer_link = <a target="_blank" href={`https://${network === 'ropsten' ? 'ropsten.' : ''}etherscan.io/tx/${props.panel_key}`}>link</a>
    }
    this.render_preview_icon(props)
  }

  componentWillUpdate(next_props) {
    this.render_preview_icon(next_props)
  }

  batch_list = () => {
    return this.props.batch.map(p => React.createElement(PixelBatchItem, { pixel: p, on_price_change: this.props.on_price_change, default_price_increase: this.props.default_price_increase, key: `${p.x}_${p.y}` }))
  }

  handle_toggle = (expand) => {
    this.props.on_toggle(this.props.panel_key, expand)
  }

  toggle_preview = e => {
    e.preventDefault()
    this.props.on_preview_change(this.props.panel_key)
  }

  can_preview = () => this.props.on_preview_change

  render_preview_icon = props => {
    if (this.can_preview())
      this.preview_icon = <Col md={3}><a href="#" onClick={this.toggle_preview}>{props.preview ? 'hide' : 'show'}</a></Col>
    else
      this.preview_icon = null
  }

  render() {
    let batch_length = this.props.batch.length
    if (batch_length) {
      return (
        <Panel id={this.props.panel_key} expanded={this.props.expanded} onToggle={this.handle_toggle}>
          <Panel.Heading>
            <Panel.Title>
              <Grid fluid>
                {this.preview_icon}
                <Col md={this.can_preview() ? 6 : 9}>
                  {this.props.title}
                </Col>
                <Col md={3}>
                  {this.explorer_link}
                  <Panel.Toggle>
                    <span className="glyphicon glyphicon-chevron-down"></span>
                  </Panel.Toggle>
                </Col>
              </Grid>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <div className='batch-container'>
              <div className='batch-inner-container'>
                {this.batch_list()}
              </div>
              {this.props.children}
            </div>
          </Panel.Body>
        </Panel>
      )
    }
    else
      return null
  }
}

export default PixelBatch