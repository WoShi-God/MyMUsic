import { writeFileSync } from 'fs'
import { register_anonimous } from './main'
import { cookieToJson } from './util/index'
import config from './util/config.json'
import { resolve } from 'path'
async function generateConfig() {
  try {
    const res = await register_anonimous()
    const cookie = res.body.cookie
    if (cookie) {
      const cookieObj = cookieToJson(cookie)
      let newConfig = { ...config }
      newConfig.anonymous_token = cookieObj.MUSIC_A
      writeFileSync(
        resolve(__dirname, 'util/config.json'),
        JSON.stringify(newConfig, null, 2),
        'utf-8',
      )
    }
  } catch (error) {
    console.log(error)
  }
}
export default generateConfig
