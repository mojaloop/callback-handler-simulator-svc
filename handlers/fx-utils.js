/**
 * FX Conversion Utilities
 * Handles foreign exchange rate calculations and currency conversions
 */

// FX rates data - in a real application, this would come from an external API
const FX_RATES = {
  "base": "USD",
  "date": "2023-03-03",
  "rates": {
    "AED": 3.670595,
    "AFN": 88.881425,
    "ALL": 108.376523,
    "AMD": 390.471399,
    "ANG": 1.804308,
    "AOA": 505.839998,
    "ARS": 197.689779,
    "AUD": 1.48222,
    "AWG": 1.799566,
    "AZN": 1.699337,
    "BAM": 1.842544,
    "BBD": 1.998973,
    "BDT": 107.07517,
    "BGN": 1.843505,
    "BHD": 0.376919,
    "BIF": 2079.526363,
    "BMD": 0.999953,
    "BND": 1.34899,
    "BOB": 6.915241,
    "BRL": 5.198354,
    "BSD": 0.999335,
    "BTC": 0.000044,
    "BTN": 82.647688,
    "BWP": 13.237335,
    "BYN": 2.526074,
    "BZD": 2.01736,
    "CAD": 1.357836,
    "CDF": 2086.44176,
    "CHF": 0.940605,
    "CLF": 0.02963,
    "CLP": 812.200511,
    "CNH": 6.904663,
    "CNY": 6.898567,
    "COP": 4833.056834,
    "CRC": 558.748547,
    "CUC": 0.99935,
    "CUP": 25.728404,
    "CVE": 103.850722,
    "CZK": 22.089353,
    "DJF": 178.175863,
    "DKK": 7.009313,
    "DOP": 55.539156,
    "DZD": 136.526375,
    "EGP": 30.743014,
    "ERN": 14.987908,
    "ETB": 53.840023,
    "EUR": 0.942228,
    "FJD": 2.210902,
    "FKP": 0.83471,
    "GBP": 0.834759,
    "GEL": 2.598071,
    "GGP": 0.834647,
    "GHS": 12.759418,
    "GIP": 0.834672,
    "GMD": 60.98912,
    "GNF": 8615.060299,
    "GTQ": 7.816555,
    "GYD": 211.148725,
    "HKD": 7.843114,
    "HNL": 24.676398,
    "HRK": 7.096534,
    "HTG": 151.107107,
    "HUF": 354.546511,
    "IDR": 15305.816425,
    "ILS": 3.659591,
    "IMP": 0.83482,
    "INR": 82.271752,
    "IQD": 1460.523392,
    "IRR": 42214.667089,
    "ISK": 142.311052,
    "JEP": 0.83532,
    "JMD": 154.109032,
    "JOD": 0.709871,
    "JPY": 136.579884,
    "KES": 127.794041,
    "KGS": 87.345932,
    "KHR": 4067.915978,
    "KMF": 464.562389,
    "KPW": 899.247674,
    "KRW": 1302.190934,
    "KWD": 0.307326,
    "KYD": 0.83405,
    "KZT": 436.101643,
    "LAK": 16873.790213,
    "LBP": 15020.521133,
    "LKR": 345.92388,
    "LRD": 159.117366,
    "LSL": 18.20456,
    "LYD": 4.835853,
    "MAD": 10.388795,
    "MDL": 18.888917,
    "MGA": 4296.352625,
    "MKD": 58.02969,
    "MMK": 2101.470623,
    "MNT": 3404.116439,
    "MOP": 8.091167,
    "MRU": 36.386096,
    "MUR": 46.641155,
    "MVR": 15.347871,
    "MWK": 1027.828846,
    "MXN": 18.098725,
    "MYR": 4.474645,
    "MZN": 63.797698,
    "NAD": 18.214751,
    "NGN": 460.317636,
    "NIO": 36.600644,
    "NOK": 10.424506,
    "NPR": 132.235448,
    "NZD": 1.604879,
    "OMR": 0.385743,
    "PAB": 0.999902,
    "PEN": 3.770718,
    "PGK": 3.527422,
    "PHP": 54.844041,
    "PKR": 278.695386,
    "PLN": 4.423791,
    "PYG": 7220.315472,
    "QAR": 3.651532,
    "RON": 4.637626,
    "RSD": 110.496314,
    "RUB": 75.238572,
    "RWF": 1091.764956,
    "SAR": 3.750399,
    "SBD": 8.239938,
    "SCR": 13.476738,
    "SDG": 590.506115,
    "SEK": 10.481266,
    "SGD": 1.346505,
    "SHP": 0.834776,
    "SLL": 17650.226858,
    "SOS": 568.863447,
    "SRD": 33.904806,
    "SSP": 130.15096,
    "STD": 22804.902808,
    "STN": 23.075404,
    "SVC": 8.756667,
    "SYP": 2510.429835,
    "SZL": 18.20316,
    "THB": 34.771491,
    "TJS": 10.006042,
    "TMT": 3.507758,
    "TND": 3.129616,
    "TOP": 2.355679,
    "TRY": 18.879408,
    "TTD": 6.789468,
    "TWD": 30.624624,
    "TZS": 2330.0501,
    "UAH": 36.958426,
    "UGX": 3718.628848,
    "USD": 1,
    "UYU": 38.884596,
    "UZS": 11371.806807,
    "VES": 24.306068,
    "VND": 23702.143038,
    "VUV": 117.94585,
    "WST": 2.695482,
    "XAF": 617.756757,
    "XAG": 0.047556,
    "XAU": 0.0011,
    "XCD": 2.700451,
    "XDR": 0.751352,
    "XOF": 617.756728,
    "XPD": 0.001709,
    "XPF": 112.382643,
    "XPT": 0.001221,
    "YER": 250.041827,
    "ZAR": 18.172541,
    "ZMW": 19.989716,
    "ZWL": 321.731101
  }
}

/**
 * Calculate conversion rate between two currencies
 * @param {string} sourceCurrency - Source currency code
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Conversion rate
 */
function calculateConversionRate(sourceCurrency, targetCurrency) {
  if (sourceCurrency === targetCurrency) {
    return 1
  }

  if (sourceCurrency === FX_RATES.base) {
    return FX_RATES.rates[targetCurrency] || 1
  }

  if (targetCurrency === FX_RATES.base) {
    return 1 / (FX_RATES.rates[sourceCurrency] || 1)
  }

  // Cross-currency conversion
  const sourceRate = FX_RATES.rates[sourceCurrency] || 1
  const targetRate = FX_RATES.rates[targetCurrency] || 1
  return targetRate / sourceRate
}

/**
 * Calculate missing amount based on conversion rate
 * @param {number} sourceAmount - Source amount (0 if unknown)
 * @param {number} targetAmount - Target amount (0 if unknown)
 * @param {number} conversionRate - Conversion rate between currencies
 * @returns {Object} Object containing calculated source and target amounts
 */
function calculateMissingAmounts(sourceAmount, targetAmount, conversionRate) {
  let newSourceAmount = sourceAmount
  let newTargetAmount = targetAmount

  if (!sourceAmount && targetAmount) {
    newSourceAmount = Math.round(targetAmount / conversionRate)
  }

  if (!targetAmount && sourceAmount) {
    newTargetAmount = Math.round(sourceAmount * conversionRate)
  }

  return { newSourceAmount, newTargetAmount }
}

/**
 * Calculate charges based on percentage
 * @param {number} sourceAmount - Source amount
 * @param {number} targetAmount - Target amount
 * @param {number} chargePercent - Charge percentage (default: 5)
 * @returns {Object} Object containing source and target charges
 */
function calculateCharges(sourceAmount, targetAmount, chargePercent = 5) {
  const chargesSourceAmount = Math.round(sourceAmount * chargePercent) / 100
  const chargesTargetAmount = Math.round(targetAmount * chargePercent) / 100

  return { chargesSourceAmount, chargesTargetAmount }
}

/**
 * Process FX quote conversion terms
 * @param {Object} fxQuoteBody - FX quote request body
 * @returns {Object} Processed conversion terms with calculated amounts and charges
 */
function processFxQuoteConversion(fxQuoteBody) {
  const sourceCurrency = fxQuoteBody.conversionTerms.sourceAmount?.currency
  const targetCurrency = fxQuoteBody.conversionTerms.targetAmount?.currency
  
  if (!sourceCurrency || !targetCurrency) {
    throw new Error('Source and target currencies are required')
  }

  const conversionRate = calculateConversionRate(sourceCurrency, targetCurrency)
  
  const sourceAmount = +fxQuoteBody.conversionTerms.sourceAmount.amount || 0
  const targetAmount = +fxQuoteBody.conversionTerms.targetAmount.amount || 0

  const { newSourceAmount, newTargetAmount } = calculateMissingAmounts(
    sourceAmount, 
    targetAmount, 
    conversionRate
  )

  const { chargesSourceAmount, chargesTargetAmount } = calculateCharges(
    newSourceAmount, 
    newTargetAmount
  )

  // Preserve all existing properties in conversionTerms
  const updatedConversionTerms = {
    ...fxQuoteBody.conversionTerms,
    sourceAmount: {
      ...fxQuoteBody.conversionTerms.sourceAmount,
      amount: newSourceAmount.toString()
    },
    targetAmount: {
      ...fxQuoteBody.conversionTerms.targetAmount,
      amount: newTargetAmount.toString()
    },
    charges: [
      {
        chargeType: "currency conversion",
        sourceAmount: {
          amount: chargesSourceAmount.toString(),
          currency: sourceCurrency
        },
        targetAmount: {
          amount: chargesTargetAmount.toString(),
          currency: targetCurrency
        }
      }
    ]
  }

  return {
    conversionTerms: updatedConversionTerms
  }
}

module.exports = {
  processFxQuoteConversion,
  calculateConversionRate,
  calculateMissingAmounts,
  calculateCharges,
  FX_RATES
} 