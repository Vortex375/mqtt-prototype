import * as mqtt from 'mqtt';
import * as util from 'util';

const REMOTE_TOPIC = 'zigbee2mqtt/Tradfri Remote 1';
const LIGHT_TOPIC = 'zigbee2mqtt/TV Light';
const LIGHT_SET_TOPIC = 'zigbee2mqtt/TV Light/set';

const COLORS = [
  { color_temp_percent: 100 },
  { color_temp_percent: 50 },
  { color_temp_percent: 0 },
  { color: { r: 255, g: 147, b:  41 } }, /* candle */
  { color: { r: 255, g: 179, b: 102 } }, /* candle 2 */
  { color: { r: 255, g: 244, b: 229 } }, /* warm white */
  { color: { r: 255, g: 255, b: 251 } }, /* high noon sun */
  { color: { r: 255, g: 117, b: 107 } }, /* aprikose */
  { color: { r: 255, g: 216, b:  77 } }, /* lemon */
  { color: { r:  97, g: 255, b: 121 } }, /* gloom */
  { color: { r: 108, g: 148, b: 122 } }, /* green/gray */
  { color: { r: 191, g: 102, b: 255 } }, /* flieder */
  { color: { r:  64, g: 156, b: 255 } } /* blue sky */

];

const client = mqtt.connect('mqtt://helios4.local');

let lightState: any = {};
let colorIndex = 0;

client.on('connect', () => {
  client.subscribe(REMOTE_TOPIC);
  client.subscribe(LIGHT_TOPIC);
});

client.on('message', (topic, payload) => {
  const payloadJSON = JSON.parse(payload.toString('utf8'));
  console.log(topic, util.inspect(payloadJSON));
  if (topic === REMOTE_TOPIC) {
    handleRemote(payloadJSON);
  } else if (topic === LIGHT_TOPIC) {
    lightState = payloadJSON;
  }
});

function handleRemote(message: any) {
  switch (message.action) {
    case 'toggle': {
      let state = lightState.state ?? 'OFF';
      if (state === 'ON') {
        state = 'OFF';
      } else {
        state = 'ON';
      }
      setLight({ state });
      break;
    }
    case 'brightness_up_click': {
      let brightness = lightState.brightness ?? 255;
      brightness = Math.min(255, brightness + 25);
      setLight({ brightness });
      break;
    }
    case 'brightness_down_click': {
      let brightness = lightState.brightness ?? 255;
      brightness = Math.max(5, brightness - 25);
      setLight({ brightness });
      break;
    }
    case 'brightness_up_hold': {
      let brightness = lightState.brightness ?? 255;
      if (brightness < 80) {
        brightness = 80;
      } else {
        brightness = 255;
      }
      setLight({ brightness });
      break;
    }
    case 'brightness_down_hold': {
      let brightness = lightState.brightness ?? 255;
      if (brightness > 80) {
        brightness = 80;
      } else {
        brightness = 5;
      }
      setLight({ brightness });
      break;
    }
    case 'arrow_left_click': {
      colorIndex = (colorIndex - 1 + COLORS.length) % COLORS.length;
      setLight(COLORS[colorIndex]);
      break;
    }
    case 'arrow_right_click': {
      colorIndex = (colorIndex + 1) % COLORS.length;
      setLight(COLORS[colorIndex]);
      break;
    }
  }
}

function setLight(command: any) {
  client.publish(LIGHT_SET_TOPIC, JSON.stringify(command));
}
