const env = require('env-var')

const SCENARIOS = {
  timeout: 'timeout',
  payeeAbort: 'payeeAbort',
  fxpAbort: 'fxpAbort',
  quoteRule: 'quoteRule',
  liquidityNdc: 'liquidityNdc',
  invalidNumber: 'invalidNumber'
}

const TRIGGERS = {
  timeout: env.get('CBH_TRIGGER_TIMEOUT').default('TRIG_TIMEOUT').asString(),
  payeeAbort: env.get('CBH_TRIGGER_PAYEE_ABORT').default('TRIG_PAYEE_ABORT').asString(),
  fxpAbort: env.get('CBH_TRIGGER_FXP_ABORT').default('TRIG_FXP_ABORT').asString(),
  quoteRule: env.get('CBH_TRIGGER_QUOTE_RULE').default('TRIG_QUOTE_RULE').asString(),
  liquidityNdc: env.get('CBH_TRIGGER_LIQUIDITY_NDC').default('TRIG_LIQUIDITY_NDC').asString(),
  invalidNumber: env.get('CBH_TRIGGER_INVALID_NUMBER').default('TRIG_INVALID_NUMBER').asString()
}

const FX_SOURCE_AMOUNT_SCENARIOS = {
  timeout: env.get('CBH_FX_SOURCE_AMOUNT_TIMEOUT').default('11').asString(),
  fxpAbort: env.get('CBH_FX_SOURCE_AMOUNT_FXP_ABORT').default('12').asString(),
  quoteRule: env.get('CBH_FX_SOURCE_AMOUNT_QUOTE_RULE').default('13').asString(),
  liquidityNdc: env.get('CBH_FX_SOURCE_AMOUNT_LIQUIDITY_NDC').default('14').asString(),
  payeeAbort: env.get('CBH_FX_SOURCE_AMOUNT_PAYEE_ABORT').default('15').asString(),
  invalidNumber: env.get('CBH_FX_SOURCE_AMOUNT_INVALID_NUMBER').default('16').asString()
}

const EXTENSION_SCENARIO_MAP = {
  timeout: SCENARIOS.timeout,
  payeeabort: SCENARIOS.payeeAbort,
  fxpabort: SCENARIOS.fxpAbort,
  quoterule: SCENARIOS.quoteRule,
  liquidityndc: SCENARIOS.liquidityNdc,
  invalidnumber: SCENARIOS.invalidNumber,
  none: null
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getScenarioFromText(text) {
  const input = String(text || '')
  if (!input) return null

  if (input.includes(TRIGGERS.timeout)) return SCENARIOS.timeout
  if (input.includes(TRIGGERS.payeeAbort)) return SCENARIOS.payeeAbort
  if (input.includes(TRIGGERS.fxpAbort)) return SCENARIOS.fxpAbort
  if (input.includes(TRIGGERS.quoteRule)) return SCENARIOS.quoteRule
  if (input.includes(TRIGGERS.liquidityNdc)) return SCENARIOS.liquidityNdc
  if (input.includes(TRIGGERS.invalidNumber)) return SCENARIOS.invalidNumber

  return null
}

function extractScenarioFromExtensions(value) {
  if (!value) return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractScenarioFromExtensions(item)
      if (result !== null) return result
    }
    return null
  }

  if (typeof value !== 'object') {
    return null
  }

  if (typeof value.key === 'string' && typeof value.value === 'string') {
    const key = normalizeText(value.key)
    if (key === 'unhappycase' || key === 'scenario') {
      const mapped = EXTENSION_SCENARIO_MAP[normalizeText(value.value)]
      if (mapped !== undefined) return mapped
      return getScenarioFromText(value.value)
    }
  }

  for (const nestedValue of Object.values(value)) {
    const result = extractScenarioFromExtensions(nestedValue)
    if (result !== null) return result
  }

  return null
}

function collectStrings(value, output = []) {
  if (value === null || value === undefined) return output
  if (typeof value === 'string') {
    output.push(value)
    return output
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output))
    return output
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((nested) => collectStrings(nested, output))
  }
  return output
}

function detectScenario(payload = {}) {
  const sourceAmountScenario = getScenarioFromFxSourceAmount(payload)
  if (sourceAmountScenario) return sourceAmountScenario

  const displayName = payload?.from?.displayName || payload?.payer?.displayName || payload?.displayName
  const fromDisplayNameScenario = getScenarioFromText(displayName)
  if (fromDisplayNameScenario) return fromDisplayNameScenario

  const extensionScenario = extractScenarioFromExtensions(payload)
  if (extensionScenario !== null) return extensionScenario

  const allStrings = collectStrings(payload)
  for (const value of allStrings) {
    const scenario = getScenarioFromText(value)
    if (scenario) return scenario
  }

  return null
}

function getScenarioFromFxSourceAmount(payload = {}) {
  const sourceAmount = String(
    payload?.conversionTerms?.sourceAmount?.amount ??
    payload?.sourceAmount?.amount ??
    payload?.conversionTerms?.sourceAmount ??
    payload?.sourceAmount ?? ''
  ).trim()

  if (!sourceAmount) return null
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.timeout) return SCENARIOS.timeout
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.fxpAbort) return SCENARIOS.fxpAbort
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.quoteRule) return SCENARIOS.quoteRule
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.liquidityNdc) return SCENARIOS.liquidityNdc
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.payeeAbort) return SCENARIOS.payeeAbort
  if (sourceAmount === FX_SOURCE_AMOUNT_SCENARIOS.invalidNumber) return SCENARIOS.invalidNumber

  return null
}

function isInvalidLookupId(id) {
  return normalizeText(id).includes('invalid')
}

module.exports = {
  SCENARIOS,
  TRIGGERS,
  FX_SOURCE_AMOUNT_SCENARIOS,
  detectScenario,
  isInvalidLookupId
}
