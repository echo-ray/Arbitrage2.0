module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        req.setTimeout(60000 * 1000);
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
                            console.log(err);
                            callback(err);
                        });
                    },
                    hitbtc: function (callback) {
                        hitbtc.loadMarkets().then(function (data) {
                            callback();
                        }).catch(function (err) {
                            console.log(err);
                            callback(err);
                        });
                    }
                }, callback);
            },
            function (data, callback) {
                callback(null, _.intersection(binance.symbols, hitbtc.symbols));
            },
            function (unionSymbols, callback) {
                console.log(unionSymbols.length);
                unionSymbols = _.slice(unionSymbols, 0, 200);
                async.concatSeries(unionSymbols, function (symbol, callback) {
                    async.parallel({
                        symbol: function (callback) {
                            callback(null, symbol);
                        },
                        binanceData: function (callback) {
                            binance.fetchOHLCV(symbol, '1m').then(function (data) {
                                callback(null, Markets.convertOHLCV(data));
                            }).catch(function (err) {
                                console.log(err);
                                callback(err);
                            });
                        },
                        hitbtcData: function (callback) {
                            hitbtc.fetchOHLCV(symbol, '1m').then(function (data) {
                                callback(null, Markets.convertOHLCV(data));
                            }).catch(function (err) {
                                console.log(err);
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
            },
            Markets.getVolumeAndFilter
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




var data = [{
        "symbol": "STORM/BTC",
        "weight1": {
            "rate": 1.3,
            "profit": 5.5,
            "count": 5
        },
        "weight2": {
            "rate": 1.7,
            "profit": 85.5,
            "count": 57
        },
        "volume": 511569.20171968
    },
    {
        "symbol": "XVG/BTC",
        "weight1": {
            "rate": 0.6,
            "profit": 14.799999999999999,
            "count": 37
        },
        "weight2": {
            "rate": 0.4,
            "profit": 0.8,
            "count": 4
        },
        "volume": 503643.716043
    },
    {
        "symbol": "BTG/BTC",
        "weight1": {
            "rate": 0.5,
            "profit": 7.5,
            "count": 25
        },
        "weight2": {
            "rate": 0.5,
            "profit": 0.6,
            "count": 2
        },
        "volume": 335965.1051796315
    },
    {
        "symbol": "TRX/BTC",
        "weight1": {
            "rate": 0.4,
            "profit": 2.2,
            "count": 11
        },
        "weight2": {
            "rate": 0.4,
            "profit": 7.4,
            "count": 37
        },
        "volume": 2367264.2088004
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
            "profit": 6.6000000000000005,
            "count": 33
        },
        "volume": 378708.1388421757
    },
    {
        "symbol": "BNT/BTC",
        "weight1": {
            "rate": 0.3,
            "profit": 1.1999999999999997,
            "count": 12
        },
        "weight2": {
            "rate": 0.6,
            "profit": 5.199999999999999,
            "count": 13
        },
        "volume": 285143.8095963625
    },
    {
        "symbol": "ZEC/BTC",
        "weight1": {
            "rate": 0.4,
            "profit": 2.8000000000000003,
            "count": 14
        },
        "weight2": {
            "rate": 0.3,
            "profit": 0.09999999999999998,
            "count": 1
        },
        "volume": 5271435.580831453
    },
    {
        "symbol": "XEM/BTC",
        "weight1": {
            "rate": 0.4,
            "profit": 2.6,
            "count": 13
        },
        "weight2": {
            "rate": 0.4,
            "profit": 0.6000000000000001,
            "count": 3
        },
        "volume": 697004.8839452388
    },
    {
        "symbol": "BCH/ETH",
        "weight1": {
            "rate": 0.3,
            "profit": 2.4999999999999996,
            "count": 25
        },
        "weight2": {
            "rate": 0.2,
            "profit": 0,
            "count": 1
        },
        "volume": 1121371.6110846398
    },
    {
        "symbol": "EOS/ETH",
        "weight1": {
            "rate": 0.3,
            "profit": 2.4999999999999996,
            "count": 25
        },
        "weight2": {
            "rate": 0.3,
            "profit": 0.29999999999999993,
            "count": 3
        },
        "volume": 112741.2031013881
    },
    {
        "symbol": "TRX/ETH",
        "weight1": {
            "rate": 0.4,
            "profit": 1.2000000000000002,
            "count": 6
        },
        "weight2": {
            "rate": 0.4,
            "profit": 1.8,
            "count": 9
        },
        "volume": 759348.958097
    },
    {
        "symbol": "XMR/ETH",
        "weight1": {
            "rate": 0.4,
            "profit": 0.6000000000000001,
            "count": 3
        },
        "weight2": {
            "rate": 0.3,
            "profit": 1.7999999999999996,
            "count": 18
        },
        "volume": 828589.4707518995
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
            "profit": 0.9999999999999998,
            "count": 10
        },
        "volume": 16234638.027879916
    },
    {
        "symbol": "BCH/BTC",
        "weight1": {
            "rate": 0.3,
            "profit": 0.7999999999999998,
            "count": 8
        },
        "weight2": {
            "rate": 0.3,
            "profit": 0.09999999999999998,
            "count": 1
        },
        "volume": 1515250.2437334082
    },
    {
        "symbol": "ETC/BTC",
        "weight1": {
            "rate": 0.4,
            "profit": 0.2,
            "count": 1
        },
        "weight2": {
            "rate": 0.3,
            "profit": 0.3999999999999999,
            "count": 4
        },
        "volume": 207437.04456226702
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
            "profit": 0.29999999999999993,
            "count": 3
        },
        "volume": 407093.2141551053
    },
    {
        "symbol": "ETH/BTC",
        "weight1": {
            "rate": 0.3,
            "profit": 0.09999999999999998,
            "count": 1
        },
        "weight2": {
            "rate": 0.3,
            "profit": 0.19999999999999996,
            "count": 2
        },
        "volume": 14767311.883513937
    },
    {
        "symbol": "LTC/BTC",
        "weight1": {
            "rate": 0.3,
            "profit": 0.09999999999999998,
            "count": 1
        },
        "weight2": {
            "rate": 0.2,
            "profit": 0,
            "count": 1
        },
        "volume": 441073.11121991003
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
            "count": 5
        },
        "volume": 977990.7386296152
    }
];