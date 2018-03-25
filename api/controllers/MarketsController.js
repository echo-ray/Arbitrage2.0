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
            res.callback(err, convert2MarketsData(data.binance, data.hitbtc));
        });


        function convertOHLCV(data) {
            return _.map(data, function (n) {
                return {
                    timestamp: n[0],
                    rate: n[1]
                };
            });
        }

        function convert2MarketsData(market1, market2) {
            var newArr = _.map(market1, function (n) {
                var object = _.find(market2, function (m) {
                    return n.timestamp == m.timestamp;
                });
                if (object) {
                    var difference1 = 0;
                    var difference2 = 0;
                    if (n.rate > object.rate) {
                        difference2 = (n.rate - object.rate) / object.rate * 100;
                    } else if (n.rate < object.rate) {
                        difference1 = (object.rate - n.rate) / n.rate * 100;
                    }
                    return {
                        timestamp: n.timestamp,
                        rate1: n.rate,
                        rate2: object.rate,
                        difference1: difference1,
                        difference2: difference2
                    };
                } else {
                    return undefined;
                }
            });


            newArr = _.compact(newArr);
            // return newArr;


            return {
                weight1: Markets.getMaxProfit(newArr, "difference1", costInCommission),
                weight2: Markets.getMaxProfit(newArr, "difference2", costInCommission),
            };

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