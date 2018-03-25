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
                // unionSymbols = _.slice(unionSymbols, 0, 10);
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