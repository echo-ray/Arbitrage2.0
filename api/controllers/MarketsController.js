module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        var ccxt = require('ccxt');
        var rates = _.times(20, function (n) {
            return n * 0.1 + 0.2;

        });
        var binance = new ccxt.binance();
        var hitbtc = new ccxt.hitbtc2();
        async.parallel({
            binance: function (callback) {
                binance.loadMarkets().then(function (data) {
                    binance.fetchOHLCV("XRP/BTC", '1m').then(function (data) {
                        callback(null, convertOHLCV(data));
                    });
                });

            },
            hitbtc: function (callback) {
                hitbtc.loadMarkets().then(function (data) {
                    hitbtc.fetchOHLCV("XRP/BTC", '1m').then(function (data) {
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
                        difference1 = (n.rate - object.rate) / object.rate * 100;
                    } else if (n.rate < object.rate) {
                        difference2 = (object.rate - n.rate) / n.rate * 100;
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

            var weight1 = _.countBy(newArr, function (n) {
                return _.round(n.difference1, 1);
            });
            var weight2 = _.countBy(newArr, function (n) {
                return _.round(n.difference2, 1);
            });
            return {
                weight1: weight1,
                weight2: weight2
            };

        }
    }


};
module.exports = _.assign(module.exports, controller);