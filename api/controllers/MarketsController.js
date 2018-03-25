module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
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
                console.log(unionSymbols.length);
                async.concatSeries(_.slice(unionSymbols, 0, 30), function (symbol, callback) {
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
                var returnData = _.map(allSymbolsData, function (data) {
                    return Markets.convert2MarketsData(data.symbol, data.binanceData, data.hitbtcData, costInCommission);
                });
                callback(null, returnData);
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