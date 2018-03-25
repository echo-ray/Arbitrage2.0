module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        var symbol = req.body.symbol;

        var binance = new ccxt.binance();
        var hitbtc = new ccxt.hitbtc2();
        var costInCommission = 0.2;

        async.waterfall([
            function (callback) {
                async.parallel({
                    binance: function (callback) {
                        binance.loadMarkets().then(function (data) {
                            callback();
                        });
                    },
                    hitbtc: function (callback) {
                        hitbtc.loadMarkets().then(function (data) {
                            callback();
                        });
                    }
                }, callback);
            },
            function (data, callback) {
                async.parallel({
                    binanceData: function (callback) {
                        binance.fetchOHLCV(symbol, '1m').then(function (data) {
                            callback(null, Markets.convertOHLCV(data));
                        });
                    },
                    hitbtcData: function (callback) {
                        hitbtc.fetchOHLCV(symbol, '1m').then(function (data) {
                            callback(null, Markets.convertOHLCV(data));
                        });
                    }
                }, callback);
            },
            function (data, callback) {
                callback(null, Markets.convert2MarketsData(data.binanceData, data.hitbtcData, costInCommission));
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
        console.log();
    },


};
module.exports = _.assign(module.exports, controller);