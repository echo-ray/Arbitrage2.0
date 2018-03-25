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
                    // _.each(binance.symbols, function (n) {
                    //     console.log(n);
                    // });
                    binance.fetchOHLCV(symbol, '1m').then(function (data) {
                        callback(null, convertOHLCV(data));
                    });
                });
            },
            hitbtc: function (callback) {
                hitbtc.loadMarkets().then(function (data) {
                    // _.each(hitbtc.symbols, function (n) {
                    //     console.log(n);
                    // });
                    hitbtc.fetchOHLCV(symbol, '1m').then(function (data) {
                        callback(null, convertOHLCV(data));
                    });
                });
            }
        }, function (err, data) {
            res.callback(err, Markets.convert2MarketsData(data.binance, data.hitbtc));
        });


        function convertOHLCV(data) {
            return _.map(data, function (n) {
                return {
                    timestamp: n[0],
                    rate: n[1]
                };
            });
        }


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