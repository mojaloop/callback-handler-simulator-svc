# Callback Handler Simulator

## Environment variables used by handler

| ENV variable name                  | Type    | Description                                                    | Handler | Default                            |
| --------                           | ------- | --------                                                       | ------- | -------                            |
| CBH_FSPIOP_ALS_ENDPOINT_URL        | string  | Endpoint URL for ALS callback                                  | fspiop  | http://account-lookup-service:4002 |
| CBH_FSPIOP_FSP_ID                  | string  | FSP_ID to be used in fspiop-source headers and in ALS callback | fspiop  | perffsp2                           |
| CBH_FSPIOP_CALLBACK_HTTP_KEEPALIVE | boolean | HTTP keepalive for callbacks                                   | fspiop  | true                               |
| CBH_FORKS                          | number  | Number of cluster forks to create                              | *       | 1                                  |
