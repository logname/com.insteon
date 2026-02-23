'use strict';

const { Driver } = require('homey');

class InsteonSceneDriver extends Driver {

  async onInit() {
    this.log('InsteonSceneDriver has been initialized');
  }

  async onPair(session) {
    session.setHandler('list_devices', async () => {
      return [{
        name: 'New Insteon Scene (Configure Scene Number in Settings)',
        data: {
          id: `scene_${Date.now()}`
        },
        settings: {
          sceneNumber: '',
          fastCommands: false
        }
      }];
    });
  }

}

module.exports = InsteonSceneDriver;
