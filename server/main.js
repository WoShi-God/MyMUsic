import { readdirSync } from 'fs'
import { join } from 'path'
import { cookieToJson } from './util'
import request from './util/request'

/** @type {Record<string, any>} */
let obj = {}
readdirSync(join(__dirname, 'module'))
  .reverse()
  .forEach((file) => {
    if (!file.endsWith('.js')) return
    let fileModule = require(join(__dirname, 'module', file))
    let fn = file.split('.').shift() || ''
    obj[fn] = function (data = {}) {
      if (typeof data.cookie === 'string') {
        data.cookie = cookieToJson(data.cookie)
      }
      return fileModule(
        {
          ...data,
          cookie: data.cookie ? data.cookie : {},
        },
        request,
      )
    }
  })

/**
 * @type {Record<string, any> & import("./server")}
 */
export default {
  ...require('./server'),
  ...obj,
}
