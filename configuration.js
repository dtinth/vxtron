const cosmiconfig = require('cosmiconfig')
const result = cosmiconfig('vx').searchSync(process.env.HOME)
if (!result) throw new Error('No ~/.vxrc.yml configuration found')
const config = result.config
module.exports = config