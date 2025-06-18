const {
  processFxQuoteConversion,
  calculateConversionRate,
  calculateMissingAmounts,
  calculateCharges,
  FX_RATES
} = require('../../../src/shared/fx-utils')

describe('FX Utils', () => {
  describe('calculateConversionRate', () => {
    it('should return 1 for same currency', () => {
      expect(calculateConversionRate('USD', 'USD')).toBe(1)
      expect(calculateConversionRate('EUR', 'EUR')).toBe(1)
    })

    it('should return correct rate for USD to other currency', () => {
      expect(calculateConversionRate('USD', 'EUR')).toBe(FX_RATES.rates.EUR)
      expect(calculateConversionRate('USD', 'GBP')).toBe(FX_RATES.rates.GBP)
    })

    it('should return correct rate for other currency to USD', () => {
      expect(calculateConversionRate('EUR', 'USD')).toBe(1 / FX_RATES.rates.EUR)
      expect(calculateConversionRate('GBP', 'USD')).toBe(1 / FX_RATES.rates.GBP)
    })

    it('should calculate cross-currency conversion correctly', () => {
      const eurToGbp = calculateConversionRate('EUR', 'GBP')
      const expected = FX_RATES.rates.GBP / FX_RATES.rates.EUR
      expect(eurToGbp).toBe(expected)
    })

    it('should return 1 for unknown currencies', () => {
      expect(calculateConversionRate('UNKNOWN', 'USD')).toBe(1)
      expect(calculateConversionRate('USD', 'UNKNOWN')).toBe(1)
    })
  })

  describe('calculateMissingAmounts', () => {
    it('should calculate source amount when target is provided', () => {
      const { newSourceAmount, newTargetAmount } = calculateMissingAmounts(0, 100, 0.5)
      expect(newSourceAmount).toBe(200)
      expect(newTargetAmount).toBe(100)
    })

    it('should calculate target amount when source is provided', () => {
      const { newSourceAmount, newTargetAmount } = calculateMissingAmounts(100, 0, 0.5)
      expect(newSourceAmount).toBe(100)
      expect(newTargetAmount).toBe(50)
    })

    it('should return original amounts when both are provided', () => {
      const { newSourceAmount, newTargetAmount } = calculateMissingAmounts(100, 50, 0.5)
      expect(newSourceAmount).toBe(100)
      expect(newTargetAmount).toBe(50)
    })

    it('should handle zero amounts correctly', () => {
      const { newSourceAmount, newTargetAmount } = calculateMissingAmounts(0, 0, 0.5)
      expect(newSourceAmount).toBe(0)
      expect(newTargetAmount).toBe(0)
    })
  })

  describe('calculateCharges', () => {
    it('should calculate 5% charges correctly', () => {
      const { chargesSourceAmount, chargesTargetAmount } = calculateCharges(100, 50)
      expect(chargesSourceAmount).toBe(5)
      expect(chargesTargetAmount).toBe(2.5)
    })

    it('should calculate custom percentage charges', () => {
      const { chargesSourceAmount, chargesTargetAmount } = calculateCharges(100, 50, 10)
      expect(chargesSourceAmount).toBe(10)
      expect(chargesTargetAmount).toBe(5)
    })

    it('should handle zero amounts', () => {
      const { chargesSourceAmount, chargesTargetAmount } = calculateCharges(0, 0)
      expect(chargesSourceAmount).toBe(0)
      expect(chargesTargetAmount).toBe(0)
    })
  })

  describe('processFxQuoteConversion', () => {
    it('should process complete FX quote request', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '100',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'EUR'
          }
        }
      }

      const result = processFxQuoteConversion(fxQuoteBody)
      
      expect(result.conversionTerms.sourceAmount.currency).toBe('USD')
      expect(result.conversionTerms.targetAmount.currency).toBe('EUR')
      expect(result.conversionTerms.sourceAmount.amount).toBe('100')
      expect(result.conversionTerms.targetAmount.amount).toBe('94')
      expect(result.conversionTerms.charges).toHaveLength(1)
      expect(result.conversionTerms.charges[0].chargeType).toBe('currency conversion')
    })

    it('should preserve additional properties in conversionTerms', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '100',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'EUR'
          },
          amountType: 'SEND',
          conversionType: 'FIXED',
          customField: 'customValue',
          metadata: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      }

      const result = processFxQuoteConversion(fxQuoteBody)
      
      // Verify calculated amounts
      expect(result.conversionTerms.sourceAmount.amount).toBe('100')
      expect(result.conversionTerms.targetAmount.amount).toBe('94')
      
      // Verify additional properties are preserved
      expect(result.conversionTerms.amountType).toBe('SEND')
      expect(result.conversionTerms.conversionType).toBe('FIXED')
      expect(result.conversionTerms.customField).toBe('customValue')
      expect(result.conversionTerms.metadata).toEqual({
        key1: 'value1',
        key2: 'value2'
      })
      
      // Verify charges are added
      expect(result.conversionTerms.charges).toHaveLength(1)
      expect(result.conversionTerms.charges[0].chargeType).toBe('currency conversion')
    })

    it('should preserve additional properties in sourceAmount and targetAmount', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '100',
            currency: 'USD',
            description: 'Source amount description',
            metadata: { sourceKey: 'sourceValue' }
          },
          targetAmount: {
            amount: '0',
            currency: 'EUR',
            description: 'Target amount description',
            metadata: { targetKey: 'targetValue' }
          }
        }
      }

      const result = processFxQuoteConversion(fxQuoteBody)
      
      // Verify amounts are calculated
      expect(result.conversionTerms.sourceAmount.amount).toBe('100')
      expect(result.conversionTerms.targetAmount.amount).toBe('94')
      
      // Verify additional properties in sourceAmount are preserved
      expect(result.conversionTerms.sourceAmount.description).toBe('Source amount description')
      expect(result.conversionTerms.sourceAmount.metadata).toEqual({ sourceKey: 'sourceValue' })
      
      // Verify additional properties in targetAmount are preserved
      expect(result.conversionTerms.targetAmount.description).toBe('Target amount description')
      expect(result.conversionTerms.targetAmount.metadata).toEqual({ targetKey: 'targetValue' })
    })

    it('should calculate missing source amount', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '0',
            currency: 'USD'
          },
          targetAmount: {
            amount: '94',
            currency: 'EUR'
          }
        }
      }

      const result = processFxQuoteConversion(fxQuoteBody)
      
      expect(result.conversionTerms.sourceAmount.amount).toBe('100')
      expect(result.conversionTerms.targetAmount.amount).toBe('94')
    })

    it('should throw error for missing currencies', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '100'
          },
          targetAmount: {
            amount: '0',
            currency: 'EUR'
          }
        }
      }

      expect(() => processFxQuoteConversion(fxQuoteBody)).toThrow('Source and target currencies are required')
    })

    it('should handle string amounts correctly', () => {
      const fxQuoteBody = {
        conversionTerms: {
          sourceAmount: {
            amount: '100.50',
            currency: 'USD'
          },
          targetAmount: {
            amount: '0',
            currency: 'EUR'
          }
        }
      }

      const result = processFxQuoteConversion(fxQuoteBody)
      
      expect(result.conversionTerms.sourceAmount.amount).toBe('100.5')
      expect(result.conversionTerms.targetAmount.amount).toBe('95')
    })
  })
}) 