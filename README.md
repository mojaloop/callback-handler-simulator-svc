# Callback Handler Simulator

## Environment variables used by handler

| ENV variable name                  | Type    | Description                                                    | Handler | Default                            |
| --------                           | ------- | --------                                                       | ------- | -------                            |
| CBH_FSPIOP_ALS_ENDPOINT_URL        | string  | Endpoint URL for ALS callback                                  | fspiop  | http://account-lookup-service:4002 |
| CBH_FSPIOP_FSP_ID                  | string  | FSP_ID to be used in fspiop-source headers and in ALS callback | fspiop  | perffsp2                           |
| CBH_FSPIOP_CALLBACK_HTTP_KEEPALIVE | boolean | HTTP keepalive for callbacks                                   | fspiop  | true                               |
| CBH_SCENARIO_TIMEOUT_MS            | number  | Delay used to simulate timeout scenarios                       | *       | 5000                               |
| CBH_TRIGGER_TIMEOUT                | string  | `from.displayName`/payload trigger for timeout scenario        | *       | TRIG_TIMEOUT                       |
| CBH_TRIGGER_PAYEE_ABORT            | string  | Trigger for payee abort scenario                               | *       | TRIG_PAYEE_ABORT                   |
| CBH_TRIGGER_FXP_ABORT              | string  | Trigger for FXP abort scenario                                 | *       | TRIG_FXP_ABORT                     |
| CBH_TRIGGER_QUOTE_RULE             | string  | Trigger for quote-rule rejection scenario                      | *       | TRIG_QUOTE_RULE                    |
| CBH_TRIGGER_LIQUIDITY_NDC          | string  | Trigger for liquidity/NDC rejection scenario                   | *       | TRIG_LIQUIDITY_NDC                 |
| CBH_TRIGGER_INVALID_NUMBER         | string  | Trigger for invalid lookup scenario                            | *       | TRIG_INVALID_NUMBER                |
| CBH_FX_SOURCE_AMOUNT_TIMEOUT       | string  | FX source amount that triggers timeout                         | *       | 11                                 |
| CBH_FX_SOURCE_AMOUNT_FXP_ABORT     | string  | FX source amount that triggers FXP abort                       | *       | 12                                 |
| CBH_FX_SOURCE_AMOUNT_QUOTE_RULE    | string  | FX source amount that triggers quote-rule rejection            | *       | 13                                 |
| CBH_FX_SOURCE_AMOUNT_LIQUIDITY_NDC | string  | FX source amount that triggers liquidity/NDC rejection         | *       | 14                                 |
| CBH_FX_SOURCE_AMOUNT_PAYEE_ABORT   | string  | FX source amount that triggers payee abort                     | *       | 15                                 |
| CBH_FX_SOURCE_AMOUNT_INVALID_NUMBER| string  | FX source amount that triggers invalid-number scenario         | *       | 16                                 |
| CBH_FORKS                          | number  | Number of cluster forks to create                              | *       | 1                                  |

## Scenario triggers

The simulator now supports scenario triggers in request payloads (for example `from.displayName`, `note`, or extension values):

- `TRIG_TIMEOUT`
- `TRIG_PAYEE_ABORT`
- `TRIG_FXP_ABORT`
- `TRIG_QUOTE_RULE`
- `TRIG_LIQUIDITY_NDC`
- `TRIG_INVALID_NUMBER`

These can be overridden with the corresponding `CBH_TRIGGER_*` environment variables.

For FX transfers/quotes, scenarios can also be selected by `conversionTerms.sourceAmount.amount` using `CBH_FX_SOURCE_AMOUNT_*` values.
