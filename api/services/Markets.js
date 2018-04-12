var schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    currentBalance: {
        type: Number,
        required: true
    },
    script: {
        //remaining
    },
    commission: {
        type: Number,
        default: 0.1
    },
    status: {
        type: String,
        enum: ['Enable', 'Disable']
    }
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Markets', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    getMaxProfit: function (newArr, name, costInCommission) {
        var weight = _.countBy(newArr, function (n) {
            return _.round(n[name], 1);
        });
        var newWeight = _.map(weight, function (weightCount, we) {
            return {
                count: weightCount,
                difference: parseFloat(we)
            };
        });
        newWeight = _.map(newWeight, function (n) {
            var count = _.sumBy(_.filter(newWeight, function (m) {
                return m.difference > n.difference;
            }), "count");
            return {
                count: count + n.count,
                difference: n.difference
            };
        });
        var weightProfit = _.map(newWeight, function (n) {
            var profit = (n.difference - costInCommission) * n.count;
            return {
                rate: n.difference,
                profit: profit,
                count: n.count
            };
        });
        var retVal = _.maxBy(weightProfit, "profit");
        return retVal;
    },

    convert2MarketsData: function (symbol, market1, market2, costInCommission) {
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
            symbol: symbol,
            weight1: Markets.getMaxProfit(newArr, "difference1", costInCommission),
            weight2: Markets.getMaxProfit(newArr, "difference2", costInCommission),
        };

    },

    convertOHLCV: function (data) {
        return _.map(data, function (n) {
            return {
                timestamp: n[0],
                rate: n[1],
                volume: n[5]
            };
        });
    },

    getVolumeAndFilter: function (data, callback) {
        var btcPrice, ethPrice;
        async.waterfall([
            function (callback) {
                var options = {
                    method: 'GET',
                    url: "https://api.hitbtc.com/api/2/public/ticker/BTCUSD"
                };
                request(options, function (err, response, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        btcPrice = JSON.parse(body).last;
                    }
                    callback(err);
                });
            },
            function (callback) {
                var options = {
                    method: 'GET',
                    url: "https://api.hitbtc.com/api/2/public/ticker/ETHUSD"
                };
                request(options, function (err, response, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        ethPrice = JSON.parse(body).last;
                    }
                    callback(err);
                });
            },
            function (callback) {
                async.concatSeries(data, function (n, callback) {
                    var newSymbol = _.replace(n.symbol, "/", "");
                    var options = {
                        method: 'GET',
                        url: 'https://api.hitbtc.com/api/2/public/ticker/' + newSymbol
                    };
                    request(options, function (err, response, body) {
                        if (err) {
                            console.log(err);
                        } else {
                            n.volume = JSON.parse(body).volumeQuote;
                        }
                        callback(err, n);
                    });
                }, callback);
            },
            function (data, callback) {
                console.log(btcPrice, ethPrice);
                _.each(data, function (n) {
                    if (/BTC/.test(n.symbol)) {
                        n.volume = n.volume * btcPrice;
                    } else if (/ETH/.test(n.symbol)) {
                        n.volume = n.volume * ethPrice;
                    }
                });
                data = _.filter(data, function (n) {
                    return n.volume >= Config.minimumVolumeInUSD;
                });
                callback(null, data);
            }
        ], callback);
    },

    //get orderbooks

    getAllOrdersForBinance: function (data, callback) {
        var exchange = new ccxt.binance();
        exchange.loadMarkets().then(function (data) {
            exchange.fetchOrderBook(symbol).then(function (data) {
                callback(null, data)
            })
        });
    },

    getAllOrdersForHitbtc: function (data, callback) {
        var exchange = new ccxt.hitbtc2();
        exchange.loadMarkets().then(function (data) {
            exchange.fetchOrderBook(symbol, 5, {
                // this parameter is exchange-specific, all extra params have unique names per exchange
                'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
            }).then(function (data) {
                callback(null, data)
            })
        });
    },

    compareHitbtcAndBinanceBuy: function (data, callback) {
        async.parallel({
                Binance: function (callback) {
                    Markets.getAllOrdersForBinance(data, function (err, data) {
                        callback(null, data.asks[0][0]);
                    })
                },
                Hitbtc: function (callback) {
                    Markets.getAllOrdersForHitbtc(data, function (err, data) {
                        callback(null, data.asks[0][0]);
                    })
                }
            },
            function (err, result) {
                if (err || _.isEmpty(result)) {
                    callback(err);
                } else {
                    var arr = Object.keys(result).map(function (key) {
                        return result[key];
                    });
                    var min = Math.min.apply(null, arr);
                    var max = Math.max.apply(null, arr);
                    var ratio = max / min;
                    console.log("binanaceRate---min", min);
                    console.log("HitbtcRate---max", max);
                    console.log("HitbtcRate---ratio", ratio);
                    callback(null, "Success")
                }
            });
    },

    compareHitbtcAndBinanceSell: function (data, callback) {
        async.parallel({
                Binance: function (callback) {
                    Markets.getAllOrdersForBinance(data, function (err, data) {
                        callback(null, data.bids[0][0]);
                    })
                },
                Hitbtc: function (callback) {
                    Markets.getAllOrdersForHitbtc(data, function (err, data) {
                        callback(null, data.bids[0][0]);
                    })
                }
            },
            function (err, result) {
                if (err || _.isEmpty(result)) {
                    callback(err);
                } else {
                    console.log("result---Sell", result);
                    callback(null, "Success");
                }
            });
    }

};
module.exports = _.assign(module.exports, exports, model);