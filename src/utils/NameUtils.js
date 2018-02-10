import Alert from 'react-s-alert'
import axios from 'axios'
import * as firebase from 'firebase/app'
import 'firebase/database'

class NameUtils {
  static init() {
    return new Promise(resolve => {
      firebase.initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        databaseURL: `https://${process.env.REACT_APP_FIREBASE_APP_NAME}.firebaseio.com`
      })
      this.index = {}
      let ref = firebase.database().ref('usernames')
      ref.once('value').then(snapshot => {
        Object.entries(snapshot.val()).forEach(data => this.add_to_db(data[0], data[1].name))
        let update_ref = ref.orderByChild('last_modified').limitToLast(1)
        update_ref.on('child_added', this.handle_new_name.bind(this))
        update_ref.on('child_changed', this.handle_new_name.bind(this))
        resolve()
      })
    })
  }

  static submit_name(name, account, provider) {
    if (!(account && name && provider)) return
    let timestamp = new Date().getTime().toString()
    let sign_msg_params = [
      {
        type: 'string',
        name: 'Signing address',
        value: account
      },
      {   
        type: 'string',
        name: 'New name',
        value: name
      },
      {
        type: 'string',
        name: 'Timestamp',
        value: timestamp
      }
    ]   

    provider.sendAsync({
      method: 'eth_signTypedData',
      params: [sign_msg_params, account],
      from: account,
    }, (_, result) => {
      if (result.error)
        return Alert.warning('Message signing failed')
      Alert.info('Submitting new name...')
      axios.post(`https://us-central1-${process.env.REACT_APP_FIREBASE_APP_NAME}.cloudfunctions.net/set_name`, {
        name: name,
        address: account,
        timestamp: timestamp,
        signature: result.result
      })
      .then(_ => Alert.success('Name has been saved'))
      .catch(_ => Alert.error('Name update failed'))
    })
  }

  static handle_new_name(snapshot) {
    this.add_to_db(snapshot.key, snapshot.val().name)
  }

  static name(address) {
    return this.index[address] || address
  }

  static add_to_db(address, name) {
    this.index[address] = name
  }
}

export default NameUtils