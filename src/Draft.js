import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import PriceFormatter from './utils/PriceFormatter'
import { Button } from 'react-bootstrap' 
import BigNumber from 'bignumber.js'
import Alert from 'react-s-alert'
import './Draft.css'

class Draft extends PureComponent {
  constructor(props) {
    super(props)
    this.max_length = 20
    this.update_callback = () => {
      this.compute_prices()
      this.props.on_update(this.state.preview, this.state.pixels, !this.prev_pixels.length, !this.next_pixels.length)
    }
    
    this.prev_pixels = []
    this.next_pixels = []
    this.state = {
      gas: new BigNumber(0),
      pixels: [],
      prices: [],
      preview: true,
      gas_query_id: 0,
      calculating_gas: false
    }
    PriceFormatter.subscribe(this)
  }

  componentWillUpdate(next_props, next_state) {
    this.estimate_gas(next_state)
  }

  estimate_gas = next_state => {
    let length = next_state.pixels.length
    if (length && length !== this.state.pixels.length) {
      clearTimeout(this.gas_query_timer)
      let gas_query_id = next_state.gas_query_id + 1
      let colors = []
      let indexes = next_state.pixels.map(p => {
        colors.push('0xFFFFFF')
        return p.contract_index()
      })
      /* to avoid sending too many estimateGas calls */
      this.setState({
        calculating_gas: true,
        gas: 0,
        will_fail: false,
        gas_query_id: gas_query_id
      })
      this.gas_query_timer = setTimeout(() => {
        this.props.contract_instance.BatchPaint.estimateGas(this.state.pixels.length, indexes, colors, this.state.prices, { from: this.props.account, value: 10000000000000000000 })
        .then(this.gas_query(gas_query_id))
        .catch(this.failed_gas_query(gas_query_id))
      }, 1000)
    }
  }

  gas_query = query_id => {
    return (gas => {
      if (query_id === this.state.gas_query_id)
        if (gas > 1000000)
          this.failed_gas_query(query_id)()
        else
          this.setState({ gas: Math.floor(gas * 1.1 + 10000), calculating_gas: false })
    })
  }

  failed_gas_query = query_id => {
    return (() => {
      if (query_id === this.state.gas_query_id)
        this.setState({ will_fail: true, calculating_gas: false })
    })
  }

  update_price = (pixel, new_price) => {
    this.setState(prev_state => {
      const temp = [...prev_state.pixels]
      let i = temp.findIndex(p => p.same_coords(pixel))
      temp[i].price = new_price
      return { pixels: temp }
    }, this.compute_prices)
  }

  compute_prices = () => {
    this.setState({ prices: this.state.pixels.map(p => p.price) })
  }

  title = () => {
    let length = this.state.pixels.length
    return `Draft (${length} pixel${length > 1 ? 's' : ''})`
  }

  badges = () => {
    let full_badge = this.state.pixels.length === this.max_length ? [{ css: 'full', label: 'FULL'}] : []
    return [...full_badge, { css: 'in-progress', label: 'IN PROGRESS'}]
  }

  paint = e => {
    e.preventDefault()
    if (this.props.account) {
      let length = this.state.pixels.length
      let tx_payload = length === 1 ? this.paint_one(this.state.pixels[0]) : this.paint_many(length)
      this.props.on_send(tx_payload, this.state.pixels, this.clear)
    }
    else
      Alert.error('No ethereum account detected, unlock Metamask or use Mist browser', {
        position: 'top',
        effect: null,
        offset: 54
      })
  }

  paint_many = length => {
    let colors = []
    let indexes = this.state.pixels.map(p => {
      colors.push(p.bytes3_color())
      return p.contract_index()
    })
    return this.props.contract_instance.BatchPaint.request(length, indexes, colors, this.state.prices, this.paint_options())
  }

  paint_one = pixel => {
    return this.props.contract_instance.Paint.request(pixel.contract_index(), pixel.bytes3_color(), this.paint_options())
  }

  paint_options = () => {
    return { from: this.props.account, value: this.amount_to_send(), gas: this.state.gas, gasPrice: this.props.gas_price }
  }

  amount_to_send = () => this.state.prices.reduce((total, p) => total.add(p), new BigNumber(0))

  full = existing_pixel_index => {
    if (!this.state.pixels.length)
      return false
    return existing_pixel_index === -1 && this.state.pixels.length >= this.max_length
  }

  update_with_callback = new_state => this.setState(new_state, this.update_callback)

  add = pixel_to_paint => {
    let existing_pixel_index = this.state.pixels.findIndex(p => p.same_coords(pixel_to_paint))
    if (this.full(existing_pixel_index))
      return
    if (existing_pixel_index === -1)
      existing_pixel_index = this.state.pixels.length
    else if (this.state.pixels[existing_pixel_index].color === pixel_to_paint.color)
      return
    this.save_pixels_state()
    this.update_with_callback(prev_state => {
      const temp = [...prev_state.pixels]
      temp[existing_pixel_index] = pixel_to_paint
      return { pixels: temp }
    })
  }

  remove = pixel_at_pointer => {
    /* only save if a pixel will actually be removed */
    if (this.state.pixels.find(p => p.same_coords(pixel_at_pointer)))
      this.save_pixels_state()
    this.update_with_callback(prev_state => {
      return { pixels: prev_state.pixels.filter(p => !p.same_coords(pixel_at_pointer)) }
    })
  }

  save_pixels_state = () => {
    this.prev_pixels.push(this.state.pixels)
    this.next_pixels = []
  }

  rollback = () => this.roll_stacks(this.prev_pixels, this.next_pixels)

  rollforward = () => this.roll_stacks(this.next_pixels, this.prev_pixels)

  roll_stacks = (from, to) => {
    let new_state = from.pop()
    if (new_state) {
      to.push(this.state.pixels)
      this.update_with_callback({ pixels: new_state })
    }
  }

  clear = e => {
    if (e) {
      /* clear by button, not by tx submit, so save state */
      this.save_pixels_state()
      e.preventDefault()
    }
    else {
      this.prev_pixels = []
      this.next_pixels = []
    }
    this.update_with_callback({ pixels: [] })
  }

  toggle_preview = () => {
    let new_state = !this.state.preview
    this.setState({ preview: new_state }, this.props.on_preview_update.bind(null, new_state, this.state.pixels))
  }

  gas_value = () => new BigNumber(this.props.gas_price).mul(this.state.gas)

  gas_info = () => {
    if (this.state.will_fail)
      return 'Tx will fail with current values'
    else
      return `Max tx fee: ${this.state.calculating_gas ? 'calculating...' : PriceFormatter.format_to_unit(this.gas_value(), 'gwei')}`
  }

  total = () => `Total: ${this.state.calculating_gas ? 'calculating...' : PriceFormatter.format(this.gas_value().add(this.amount_to_send()))}`

  draft_footer = () => (
    <div className="draft-footer">
      <div className="draft-gas">
        {this.gas_info()}
      </div>
      <div className="draft-total">
        {this.total()}
      </div>
      <div className="draft-buttons">
        <Button bsStyle="primary" onClick={this.clear}>Clear</Button>
        <Button bsStyle="primary" onClick={this.paint} disabled={this.state.calculating_gas || this.state.will_fail}>Paint</Button>
      </div>
    </div>
  )

  render() {
    return (
      <PixelBatch
        title={this.title()}
        badges={this.badges()}
        panel_key={'draft'}
        estimating_gas={this.state.calculating_gas}
        gas={this.state.gas}
        gas_price={this.props.gas_price}
        batch={this.state.pixels}
        preview={this.state.preview}
        on_preview_change={this.toggle_preview}
        on_toggle={this.props.on_toggle}
        expanded={this.props.expanded}
        on_price_change={this.update_price}
        default_price_increase={this.props.default_price_increase}
        account={this.props.account}
      >
        {this.state.pixels.length ? this.draft_footer() : <div>Fills empty in here... draw something!</div>}
      </PixelBatch>
    )
  }
}

export default Draft