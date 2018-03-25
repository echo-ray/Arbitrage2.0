module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        req.setTimeout(600 * 1000);
        var binance = new ccxt.binance();
        var hitbtc = new ccxt.hitbtc2();
        var costInCommission = 0.2;
        async.waterfall([
            function (callback) {
                async.parallel({
                    binance: function (callback) {
                        binance.loadMarkets().then(function (data) {
                            callback();
                        }).catch(function (err) {
                            cosnole.log(err);
                            callback(err);
                        });
                    },
                    hitbtc: function (callback) {
                        hitbtc.loadMarkets().then(function (data) {
                            callback();
                        }).catch(function (err) {
                            cosnole.log(err);
                            callback(err);
                        });
                    }
                }, callback);
            },
            function (data, callback) {
                callback(null, _.intersection(binance.symbols, hitbtc.symbols));
            },
            function (unionSymbols, callback) {
                async.concatSeries(unionSymbols, function (symbol, callback) {
                    async.parallel({
                        symbol: function (callback) {
                            callback(null, symbol);
                        },
                        binanceData: function (callback) {
                            binance.fetchOHLCV(symbol, '1m').then(function (data) {
                                callback(null, Markets.convertOHLCV(data));
                            }).catch(function (err) {
                                cosnole.log(err);
                                callback(err);
                            });
                        },
                        hitbtcData: function (callback) {
                            hitbtc.fetchOHLCV(symbol, '1m').then(function (data) {
                                callback(null, Markets.convertOHLCV(data));
                            }).catch(function (err) {
                                cosnole.log(err);
                                callback(err);
                            });
                        }
                    }, callback);
                }, callback);

            },
            function (allSymbolsData, callback) {
                var newArr = _.map(allSymbolsData, function (data) {
                    return Markets.convert2MarketsData(data.symbol, data.binanceData, data.hitbtcData, costInCommission);
                });
                newArr = _.filter(newArr, function (n) {
                    return (n.weight1 && n.weight2);
                });
                newArr = _.filter(newArr, function (n) {
                    return (n.weight1.rate >= 0.2 && n.weight1.count > 0);
                });
                newArr = _.filter(newArr, function (n) {
                    return (n.weight2.rate >= 0.2 && n.weight2.count > 0);
                });
                newArr = _.sortBy(newArr, function (n) {
                    return -1 * _.max([n.weight1.profit, n.weight2.profit]);
                });
                callback(null, newArr);
            }
        ], res.callback);

    },
    getBinanceSymbols: function (req, res) {
        var exchange = new ccxt.binance();
        exchange.loadMarkets().then(function (data) {
            res.json(exchange.symbols);
        });
    },
    getHitbtcSymbols: function (req, res) {
        var exchange = new ccxt.hitbtc2();
        exchange.loadMarkets().then(function (data) {
            res.json(exchange.symbols);
        });
    },


};
module.exports = _.assign(module.exports, controller);




var data = [
    [{
            "symbol": "DNT/BTC",
            "weight1": {
                "rate": 7.2,
                "profit": 84,
                "count": 12
            },
            "weight2": {
                "rate": 9.4,
                "profit": 92.00000000000001,
                "count": 10
            }
        },
        {
            "symbol": "XLM/BTC",
            "weight1": {
                "rate": 8.4,
                "profit": 90.20000000000002,
                "count": 11
            },
            "weight2": {
                "rate": 0.8,
                "profit": 0.6000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "STORM/BTC",
            "weight1": {
                "rate": 1.2,
                "profit": 17,
                "count": 17
            },
            "weight2": {
                "rate": 2.2,
                "profit": 72,
                "count": 36
            }
        },
        {
            "symbol": "KMD/BTC",
            "weight1": {
                "rate": 12.7,
                "profit": 37.5,
                "count": 3
            },
            "weight2": {
                "rate": 16.9,
                "profit": 50.099999999999994,
                "count": 3
            }
        },
        {
            "symbol": "BCPT/BTC",
            "weight1": {
                "rate": 9,
                "profit": 44,
                "count": 5
            },
            "weight2": {
                "rate": 1.6,
                "profit": 1.4000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "ENG/ETH",
            "weight1": {
                "rate": 7.9,
                "profit": 38.5,
                "count": 5
            },
            "weight2": {
                "rate": 10.5,
                "profit": 41.2,
                "count": 4
            }
        },
        {
            "symbol": "BCPT/ETH",
            "weight1": {
                "rate": 17.4,
                "profit": 34.4,
                "count": 2
            },
            "weight2": {
                "rate": 9.1,
                "profit": 8.9,
                "count": 1
            }
        },
        {
            "symbol": "TNT/BTC",
            "weight1": {
                "rate": 1.2,
                "profit": 2,
                "count": 2
            },
            "weight2": {
                "rate": 10.9,
                "profit": 32.1,
                "count": 3
            }
        },
        {
            "symbol": "EDO/ETH",
            "weight1": {
                "rate": 0.4,
                "profit": 0.6000000000000001,
                "count": 3
            },
            "weight2": {
                "rate": 1,
                "profit": 25.6,
                "count": 32
            }
        },
        {
            "symbol": "OMG/BTC",
            "weight1": {
                "rate": 7.6,
                "profit": 7.3999999999999995,
                "count": 1
            },
            "weight2": {
                "rate": 7.4,
                "profit": 21.6,
                "count": 3
            }
        },
        {
            "symbol": "ADX/ETH",
            "weight1": {
                "rate": 0.7,
                "profit": 20.999999999999996,
                "count": 42
            },
            "weight2": {
                "rate": 0.4,
                "profit": 0.4,
                "count": 2
            }
        },
        {
            "symbol": "BNT/BTC",
            "weight1": {
                "rate": 0.9,
                "profit": 7,
                "count": 10
            },
            "weight2": {
                "rate": 1,
                "profit": 15.200000000000001,
                "count": 19
            }
        },
        {
            "symbol": "OAX/BTC",
            "weight1": {
                "rate": 3.3,
                "profit": 6.199999999999999,
                "count": 2
            },
            "weight2": {
                "rate": 13.4,
                "profit": 13.200000000000001,
                "count": 1
            }
        },
        {
            "symbol": "EDO/BTC",
            "weight1": {
                "rate": 5.1,
                "profit": 4.8999999999999995,
                "count": 1
            },
            "weight2": {
                "rate": 2.4,
                "profit": 13.2,
                "count": 6
            }
        },
        {
            "symbol": "CND/ETH",
            "weight1": {
                "rate": 2,
                "profit": 12.6,
                "count": 7
            },
            "weight2": {
                "rate": 0.8,
                "profit": 0.6000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "LRC/BTC",
            "weight1": {
                "rate": 0.2,
                "profit": 0,
                "count": 1
            },
            "weight2": {
                "rate": 1.6,
                "profit": 11.200000000000001,
                "count": 8
            }
        },
        {
            "symbol": "POE/BTC",
            "weight1": {
                "rate": 1,
                "profit": 2.4000000000000004,
                "count": 3
            },
            "weight2": {
                "rate": 1.2,
                "profit": 11,
                "count": 11
            }
        },
        {
            "symbol": "POE/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 0.6,
                "count": 2
            },
            "weight2": {
                "rate": 1.2,
                "profit": 11,
                "count": 11
            }
        },
        {
            "symbol": "CND/BTC",
            "weight1": {
                "rate": 11,
                "profit": 10.8,
                "count": 1
            },
            "weight2": {
                "rate": 1.8,
                "profit": 1.6,
                "count": 1
            }
        },
        {
            "symbol": "QTUM/BTC",
            "weight1": {
                "rate": 1,
                "profit": 4,
                "count": 5
            },
            "weight2": {
                "rate": 3.4,
                "profit": 9.6,
                "count": 3
            }
        },
        {
            "symbol": "OAX/ETH",
            "weight1": {
                "rate": 4.7,
                "profit": 4.5,
                "count": 1
            },
            "weight2": {
                "rate": 9.5,
                "profit": 9.3,
                "count": 1
            }
        },
        {
            "symbol": "LEND/ETH",
            "weight1": {
                "rate": 1,
                "profit": 2.4000000000000004,
                "count": 3
            },
            "weight2": {
                "rate": 4.8,
                "profit": 9.2,
                "count": 2
            }
        },
        {
            "symbol": "ENJ/BTC",
            "weight1": {
                "rate": 1.6,
                "profit": 1.4000000000000001,
                "count": 1
            },
            "weight2": {
                "rate": 1.5,
                "profit": 9.1,
                "count": 7
            }
        },
        {
            "symbol": "AMB/BTC",
            "weight1": {
                "rate": 3.2,
                "profit": 9,
                "count": 3
            },
            "weight2": {
                "rate": 7.5,
                "profit": 7.3,
                "count": 1
            }
        },
        {
            "symbol": "STRAT/BTC",
            "weight1": {
                "rate": 0.4,
                "profit": 4.2,
                "count": 21
            },
            "weight2": {
                "rate": 0.5,
                "profit": 9,
                "count": 30
            }
        },
        {
            "symbol": "ENJ/ETH",
            "weight1": {
                "rate": 1.6,
                "profit": 1.4000000000000001,
                "count": 1
            },
            "weight2": {
                "rate": 8.6,
                "profit": 8.4,
                "count": 1
            }
        },
        {
            "symbol": "TNT/ETH",
            "weight1": {
                "rate": 0.9,
                "profit": 8.399999999999999,
                "count": 12
            },
            "weight2": {
                "rate": 0.9,
                "profit": 2.8,
                "count": 4
            }
        },
        {
            "symbol": "MTH/BTC",
            "weight1": {
                "rate": 1.1,
                "profit": 0.9000000000000001,
                "count": 1
            },
            "weight2": {
                "rate": 8.3,
                "profit": 8.100000000000001,
                "count": 1
            }
        },
        {
            "symbol": "BTG/ETH",
            "weight1": {
                "rate": 0.4,
                "profit": 7.4,
                "count": 37
            },
            "weight2": {
                "rate": 0.4,
                "profit": 0.4,
                "count": 2
            }
        },
        {
            "symbol": "BTG/BTC",
            "weight1": {
                "rate": 0.5,
                "profit": 6.8999999999999995,
                "count": 23
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.4999999999999999,
                "count": 5
            }
        },
        {
            "symbol": "PPT/ETH",
            "weight1": {
                "rate": 2.3,
                "profit": 6.299999999999999,
                "count": 3
            },
            "weight2": {
                "rate": 0.5,
                "profit": 0.6,
                "count": 2
            }
        },
        {
            "symbol": "PPT/BTC",
            "weight1": {
                "rate": 1.4,
                "profit": 6,
                "count": 5
            },
            "weight2": {
                "rate": 0.8,
                "profit": 0.6000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "SUB/BTC",
            "weight1": {
                "rate": 1.7,
                "profit": 6,
                "count": 4
            },
            "weight2": {
                "rate": 1.3,
                "profit": 1.1,
                "count": 1
            }
        },
        {
            "symbol": "TRX/BTC",
            "weight1": {
                "rate": 0.4,
                "profit": 1.6,
                "count": 8
            },
            "weight2": {
                "rate": 0.4,
                "profit": 6,
                "count": 30
            }
        },
        {
            "symbol": "XVG/BTC",
            "weight1": {
                "rate": 0.4,
                "profit": 5.2,
                "count": 26
            },
            "weight2": {
                "rate": 0.4,
                "profit": 4,
                "count": 20
            }
        },
        {
            "symbol": "ZEC/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 5.1,
                "count": 17
            },
            "weight2": {
                "rate": 0.4,
                "profit": 1.8,
                "count": 9
            }
        },
        {
            "symbol": "XEM/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 4.5,
                "count": 15
            },
            "weight2": {
                "rate": 0.6,
                "profit": 0.7999999999999999,
                "count": 2
            }
        },
        {
            "symbol": "XRP/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 4.5,
                "count": 15
            },
            "weight2": {
                "rate": 0.8,
                "profit": 1.8000000000000003,
                "count": 3
            }
        },
        {
            "symbol": "ZRX/ETH",
            "weight1": {
                "rate": 1.3,
                "profit": 4.4,
                "count": 4
            },
            "weight2": {
                "rate": 0.7,
                "profit": 3.9999999999999996,
                "count": 8
            }
        },
        {
            "symbol": "SUB/ETH",
            "weight1": {
                "rate": 2.4,
                "profit": 4.3999999999999995,
                "count": 2
            },
            "weight2": {
                "rate": 1.9,
                "profit": 1.7,
                "count": 1
            }
        },
        {
            "symbol": "NEBL/BTC",
            "weight1": {
                "rate": 1,
                "profit": 4,
                "count": 5
            },
            "weight2": {
                "rate": 1.3,
                "profit": 3.3000000000000003,
                "count": 3
            }
        },
        {
            "symbol": "ZRX/BTC",
            "weight1": {
                "rate": 0.7,
                "profit": 3.9999999999999996,
                "count": 8
            },
            "weight2": {
                "rate": 0.5,
                "profit": 3,
                "count": 10
            }
        },
        {
            "symbol": "DGD/BTC",
            "weight1": {
                "rate": 0.6,
                "profit": 3.5999999999999996,
                "count": 9
            },
            "weight2": {
                "rate": 1.7,
                "profit": 1.5,
                "count": 1
            }
        },
        {
            "symbol": "LSK/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.4999999999999999,
                "count": 5
            },
            "weight2": {
                "rate": 0.4,
                "profit": 3.4000000000000004,
                "count": 17
            }
        },
        {
            "symbol": "BCH/ETH",
            "weight1": {
                "rate": 0.3,
                "profit": 3.3999999999999995,
                "count": 34
            },
            "weight2": {
                "rate": 0.2,
                "profit": 0,
                "count": 1
            }
        },
        {
            "symbol": "CTR/ETH",
            "weight1": {
                "rate": 1.6,
                "profit": 2.8000000000000003,
                "count": 2
            },
            "weight2": {
                "rate": 1,
                "profit": 3.2,
                "count": 4
            }
        },
        {
            "symbol": "ICN/BTC",
            "weight1": {
                "rate": 3.3,
                "profit": 3.0999999999999996,
                "count": 1
            },
            "weight2": {
                "rate": 0.8,
                "profit": 0.6000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "XVG/ETH",
            "weight1": {
                "rate": 1.2,
                "profit": 2,
                "count": 2
            },
            "weight2": {
                "rate": 0.8,
                "profit": 3.0000000000000004,
                "count": 5
            }
        },
        {
            "symbol": "STRAT/ETH",
            "weight1": {
                "rate": 1.2,
                "profit": 1,
                "count": 1
            },
            "weight2": {
                "rate": 1.2,
                "profit": 3,
                "count": 3
            }
        },
        {
            "symbol": "LEND/BTC",
            "weight1": {
                "rate": 3.1,
                "profit": 2.9,
                "count": 1
            },
            "weight2": {
                "rate": 1.3,
                "profit": 1.1,
                "count": 1
            }
        },
        {
            "symbol": "XEM/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 1.0999999999999996,
                "count": 11
            },
            "weight2": {
                "rate": 0.4,
                "profit": 2.8000000000000003,
                "count": 14
            }
        },
        {
            "symbol": "LRC/ETH",
            "weight1": {
                "rate": 2.1,
                "profit": 1.9000000000000001,
                "count": 1
            },
            "weight2": {
                "rate": 1.5,
                "profit": 2.6,
                "count": 2
            }
        },
        {
            "symbol": "CTR/BTC",
            "weight1": {
                "rate": 0.9,
                "profit": 1.4,
                "count": 2
            },
            "weight2": {
                "rate": 1,
                "profit": 2.4000000000000004,
                "count": 3
            }
        },
        {
            "symbol": "FUN/BTC",
            "weight1": {
                "rate": 0.6,
                "profit": 2.4,
                "count": 6
            },
            "weight2": {
                "rate": 0.6,
                "profit": 0.7999999999999999,
                "count": 2
            }
        },
        {
            "symbol": "SNT/BTC",
            "weight1": {
                "rate": 0.8,
                "profit": 1.8000000000000003,
                "count": 3
            },
            "weight2": {
                "rate": 0.5,
                "profit": 2.4,
                "count": 8
            }
        },
        {
            "symbol": "RLC/BTC",
            "weight1": {
                "rate": 2.4,
                "profit": 2.1999999999999997,
                "count": 1
            },
            "weight2": {
                "rate": 0.5,
                "profit": 0.3,
                "count": 1
            }
        },
        {
            "symbol": "DASH/ETH",
            "weight1": {
                "rate": 0.3,
                "profit": 2.1999999999999993,
                "count": 22
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.6999999999999998,
                "count": 7
            }
        },
        {
            "symbol": "VEN/BTC",
            "weight1": {
                "rate": 0.6,
                "profit": 0.39999999999999997,
                "count": 1
            },
            "weight2": {
                "rate": 0.5,
                "profit": 2.1,
                "count": 7
            }
        },
        {
            "symbol": "OMG/ETH",
            "weight1": {
                "rate": 0.9,
                "profit": 2.0999999999999996,
                "count": 3
            },
            "weight2": {
                "rate": 0.4,
                "profit": 0.4,
                "count": 2
            }
        },
        {
            "symbol": "TRX/ETH",
            "weight1": {
                "rate": 0.4,
                "profit": 2,
                "count": 10
            },
            "weight2": {
                "rate": 0.3,
                "profit": 2.0999999999999996,
                "count": 21
            }
        },
        {
            "symbol": "MTH/ETH",
            "weight1": {
                "rate": 0.4,
                "profit": 0.2,
                "count": 1
            },
            "weight2": {
                "rate": 2.2,
                "profit": 2,
                "count": 1
            }
        },
        {
            "symbol": "ZEC/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 1.9999999999999996,
                "count": 20
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.29999999999999993,
                "count": 3
            }
        },
        {
            "symbol": "FUN/ETH",
            "weight1": {
                "rate": 0.8,
                "profit": 1.2000000000000002,
                "count": 2
            },
            "weight2": {
                "rate": 1.9,
                "profit": 1.7,
                "count": 1
            }
        },
        {
            "symbol": "BQX/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 0.6,
                "count": 2
            },
            "weight2": {
                "rate": 1,
                "profit": 1.6,
                "count": 2
            }
        },
        {
            "symbol": "QTUM/ETH",
            "weight1": {
                "rate": 1,
                "profit": 1.6,
                "count": 2
            },
            "weight2": {
                "rate": 1.1,
                "profit": 0.9000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "SNT/ETH",
            "weight1": {
                "rate": 1,
                "profit": 1.6,
                "count": 2
            },
            "weight2": {
                "rate": 0.4,
                "profit": 1.2000000000000002,
                "count": 6
            }
        },
        {
            "symbol": "LTC/ETH",
            "weight1": {
                "rate": 0.5,
                "profit": 1.2,
                "count": 4
            },
            "weight2": {
                "rate": 0.3,
                "profit": 1.5999999999999996,
                "count": 16
            }
        },
        {
            "symbol": "ETC/ETH",
            "weight1": {
                "rate": 0.3,
                "profit": 1.3999999999999997,
                "count": 14
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.3999999999999999,
                "count": 4
            }
        },
        {
            "symbol": "WINGS/BTC",
            "weight1": {
                "rate": 1.5,
                "profit": 1.3,
                "count": 1
            },
            "weight2": {
                "rate": 0.6,
                "profit": 0.7999999999999999,
                "count": 2
            }
        },
        {
            "symbol": "EOS/ETH",
            "weight1": {
                "rate": 0.4,
                "profit": 1.2000000000000002,
                "count": 6
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.7999999999999998,
                "count": 8
            }
        },
        {
            "symbol": "GVT/ETH",
            "weight1": {
                "rate": 1.1,
                "profit": 0.9000000000000001,
                "count": 1
            },
            "weight2": {
                "rate": 1.4,
                "profit": 1.2,
                "count": 1
            }
        },
        {
            "symbol": "SNGLS/BTC",
            "weight1": {
                "rate": 0.4,
                "profit": 0.6000000000000001,
                "count": 3
            },
            "weight2": {
                "rate": 0.5,
                "profit": 1.2,
                "count": 4
            }
        },
        {
            "symbol": "WAVES/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 1.0999999999999996,
                "count": 11
            },
            "weight2": {
                "rate": 0.9,
                "profit": 0.7,
                "count": 1
            }
        },
        {
            "symbol": "BNT/ETH",
            "weight1": {
                "rate": 0.7,
                "profit": 0.9999999999999999,
                "count": 2
            },
            "weight2": {
                "rate": 0.5,
                "profit": 0.3,
                "count": 1
            }
        },
        {
            "symbol": "XMR/ETH",
            "weight1": {
                "rate": 0.3,
                "profit": 0.8999999999999998,
                "count": 9
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.19999999999999996,
                "count": 2
            }
        },
        {
            "symbol": "NEO/BTC",
            "weight1": {
                "rate": 0.4,
                "profit": 0.8,
                "count": 4
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.7999999999999998,
                "count": 8
            }
        },
        {
            "symbol": "EOS/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.19999999999999996,
                "count": 2
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.7999999999999998,
                "count": 8
            }
        },
        {
            "symbol": "BCH/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.6999999999999998,
                "count": 7
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.4999999999999999,
                "count": 5
            }
        },
        {
            "symbol": "DASH/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.09999999999999998,
                "count": 1
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.6999999999999998,
                "count": 7
            }
        },
        {
            "symbol": "LSK/ETH",
            "weight1": {
                "rate": 0.6,
                "profit": 0.39999999999999997,
                "count": 1
            },
            "weight2": {
                "rate": 0.8,
                "profit": 0.6000000000000001,
                "count": 1
            }
        },
        {
            "symbol": "XMR/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.09999999999999998,
                "count": 1
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.5999999999999999,
                "count": 6
            }
        },
        {
            "symbol": "WTC/BTC",
            "weight1": {
                "rate": 0.6,
                "profit": 0.39999999999999997,
                "count": 1
            },
            "weight2": {
                "rate": 0.7,
                "profit": 0.49999999999999994,
                "count": 1
            }
        },
        {
            "symbol": "ETC/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.4999999999999999,
                "count": 5
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.09999999999999998,
                "count": 1
            }
        },
        {
            "symbol": "NEO/ETH",
            "weight1": {
                "rate": 0.2,
                "profit": 0,
                "count": 2
            },
            "weight2": {
                "rate": 0.4,
                "profit": 0.4,
                "count": 2
            }
        },
        {
            "symbol": "LTC/BTC",
            "weight1": {
                "rate": 0.2,
                "profit": 0,
                "count": 2
            },
            "weight2": {
                "rate": 0.3,
                "profit": 0.09999999999999998,
                "count": 1
            }
        },
        {
            "symbol": "XRP/BTC",
            "weight1": {
                "rate": 0.3,
                "profit": 0.09999999999999998,
                "count": 1
            },
            "weight2": {
                "rate": 0.2,
                "profit": 0,
                "count": 3
            }
        }
    ]
];