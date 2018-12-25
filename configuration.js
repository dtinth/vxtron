const cosmiconfig = require('cosmiconfig')
const result = cosmiconfig('vx').searchSync(process.env.HOME)
if (!result) console.warn('No ~/.vxrc.yml configuration found')
const config = (result && result.config) || {}
module.exports = config
