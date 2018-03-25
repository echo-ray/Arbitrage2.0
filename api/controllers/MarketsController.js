module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        var symbol = req.body.symbol;

        var binance = new ccxt.binance();
        var hitbtc = new ccxt.hitbtc2();
        var costInCommission = 0.2;
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
        }, function (err, data) {
            var binanceData, hitbtcData;
            binance.fetchOHLCV(symbol, '1m').then(function (data) {
                binanceData = Markets.convertOHLCV(data);
            });
            hitbtc.fetchOHLCV(symbol, '1m').then(function (data) {
                hitbtcData = Markets.convertOHLCV(data);
            });
            res.callback(err, Markets.convert2MarketsData(binanceData, hitbtcData));
        });




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