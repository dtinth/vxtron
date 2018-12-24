const providers = {
  chrome: require('./chrome'),
  'google-cloud': require('./google-cloud')
}

module.exports = function getProvider(providerName, providerOptions) {
  if (!providerName) {
    throw new Error(`speechProvider must be configured in configuration file.`)
  }
  if (!providers[providerName]) {
    throw new Error(`Unknown speechProvider "${providerName}"`)
  }
  return providers[providerName](providerOptions)
}
