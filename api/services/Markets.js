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
                        callback(null, data.asks[0]);
                    });
                },
                Hitbtc: function (callback) {
                    Markets.getAllOrdersForHitbtc(data, function (err, data) {
                        callback(null, data.asks[0]);
                    });
                }
            },
            function (err, result) {
                if (err || _.isEmpty(result)) {
                    callback(err);
                } else {
                    var binance = result.Binance[0];
                    var Hitbtc = result.Hitbtc[0];
                    var min = [];
                    var max = [];
                    var qty = {};

                    if (binance > Hitbtc) {
                        max = result.Binance;
                        min = result.Hitbtc;
                    } else if (binance < Hitbtc) {
                        min = result.Binance;
                        max = result.Hitbtc;
                    }
                    var ratio = max[0] / min[0];
                    var actualRatio = Math.round(ratio * 100000) / 100000;

                    console.log("actualRatio", actualRatio);
                    console.log("min", min);
                    console.log("max", max);

                    console.log("currentProcess", currentProcess);

                    if (actualRatio > minProfitRate) {
                        qty = min[1] / 3
                        if (qty > minimumVolume) {
                            var orderData = {};
                            orderData.type = 'Buy';
                            orderData.typeOfTrade = 'Oredrebook';
                            orderData.price = 300;
                            Markets.orderPlace(orderData, function (err, data) {})
                        }
                    }

                    // marketData.maxLow = max / minProfitRate;
                    // callback(null, marketData);
                    // //qty/3
                    // if (ratio <= minProfitRate) {
                    //     if (qty > minimumVolume) {
                    //         console.log("---------")
                    //         var orderData = {};
                    //         orderData.type = 'Buy';
                    //         orderData.typeOfTrade = 'Oredrebook';
                    //         orderData.price = 300;
                    //         Markets.orderPlace(orderData, function (err, data) {}) // min exchabge store qty of max exchange 
                    //     } else {
                    //         Order.find({}).limit(1).exec(function (err, data1) {
                    //             if (err || _.isEmpty(data1)) {
                    //                 // callback(err, null)
                    //             } else {
                    //                 Markets.cancelOrder(data1.orderId, function () {

                    //                 });
                    //             }
                    //         })
                    //     }
                    // }
                }
            });
    },

    compareHitbtcAndBinanceSell: function (data, callback) {
        async.parallel({
                Binance: function (callback) {
                    Markets.getAllOrdersForBinance(data, function (err, data) {
                        callback(null, data.bids[0][0]);
                    });
                },
                Hitbtc: function (callback) {
                    Markets.getAllOrdersForHitbtc(data, function (err, data) {
                        callback(null, data.bids[0][0]);
                    });
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
                    // console.log("binanaceRateSell", result.Binance);
                    // console.log("HitbtcRateSell", result.Hitbtc);
                    // console.log("---min", min);
                    // console.log("---max", max);
                    // console.log("---ratioSell", Math.round(ratio * 100000) / 100000);
                    var marketData = {};
                    marketData.binanaceRateSell = result.Binance;
                    marketData.HitbtcRateSell = result.Hitbtc;
                    marketData.max = max;
                    marketData.min = min;
                    marketData.ratio = Math.round(ratio * 100000) / 100000;
                    marketData.minHigh = min * minProfitRate;
                    callback(null, marketData);
                }
            });
    },

    fetchOrders: function (data, callback) {
        exchange = ccxt.bittrex({
            "apiKey": "471b47a06c384e81b24072e9a8739064",
            "secret": "694025686e9445589787e8ca212b4cff",
            "enableRateLimit": True,
        });
        // orders = exchange.fetch_orders()
        // print(orders)

        // order = exchange.fetch_order(orders[0]['id'])
        // print(order)
        // let order = await exchange.fetchOrder (id, symbol = undefined, params = {})
        exchange.loadMarkets().then(function (data) {
            exchange.fetch_orders().then(function (data) {
                console.log("data")
            });
        });
    },

    placeOrder: function (data, callback) {
        // exchange = ccxt.binance({
        //     'apiKey': 'YOUR_API_KEY',
        //     'secret': 'YOUR_SECRET',
        //     'enableRateLimit': True,
        // });

        // var symbol = symbol;
        // var type = 'limit'; //# or 'market'
        // var side = 'buy'; //# or 'sell'
        // var amount = 1.0;
        // var price = 0.060154; //# or None

        // exchange.create_order(symbol, type, side, amount, price, params)
        //     .then(function (data) {
        //         console.log("data");
        //     });
        console.log("data", data + newRate);
    },

    cancelOrder: function (data, callback) {
        exchange = ccxt.binance({
            'apiKey': 'YOUR_API_KEY',
            'secret': 'YOUR_SECRET',
            'enableRateLimit': True,
        });

        exchange.cancelOrder(id, symbol, params)
            .then(function (data) {
                console.log("data");
            });
    },

    orderPlace: function (data, callback) {
        if (currentProcess != false) {
            console.log("asdsdas");
            Process.findOne({
                _id: currentProcess
            }).limit(1).sort({
                createdAt: -1
            }).exec(function (err, data1) {
                if (err) {
                    callback(err, null)
                } else if (_.isEmpty(data1)) {
                    console.log("data1data1-", data1)
                    // Markets.placeOrder(data.min, function (err, data2) {
                    var dataToSend = {};
                    dataToSend.orderId = 'dsaad';
                    dataToSend.orderJSON = 'asdaadsad';
                    dataToSend.type = data.type;
                    dataToSend.typeOfTrade = data.typeOfTrade;
                    dataToSend.status = 'TransactionPending';
                    dataToSend.price = data.price;
                    async.parallel([
                            function (callback) {
                                Order.saveData(dataToSend, callback);
                            },
                            function (callback) {
                                Process.saveData(dataToSend, callback);
                            }
                        ],
                        function (err, data) {
                            if (err) {
                                console.log("error occured");
                                // callback(null, err);
                            } else {
                                callback(null, data);
                            }
                        });
                    // });
                } else {
                    if (data1[0].price < data.price) {
                        async.parallel([
                            function (callback) {
                                // Markets.cancelOrder(data1.orderId, function (err, data2) {
                                data1[0].status = 'TransactionPartiallyFilled';
                                Order.saveData(data1[0], callback);
                                // })
                            },
                            function (callback) {
                                // Markets.placeOrder(data.min, function (err, data2) {
                                var dataToSend = {};
                                dataToSend.orderId = 'data2.id';
                                dataToSend.orderJSON = 'data2.info';
                                dataToSend.type = data.type;
                                dataToSend.typeOfTrade = data.typeOfTrade;
                                dataToSend.status = 'TransactionPending';
                                dataToSend.price = data.price;
                                async.parallel([
                                        function (callback) {
                                            Order.saveData(dataToSend, callback);
                                        },
                                        function (callback) {
                                            Process.saveData(dataToSend, callback);
                                        }
                                    ],
                                    function (err, data) {
                                        if (err) {
                                            console.log("error occured");
                                            // callback(null, err);
                                        } else {
                                            callback(null, data);
                                        }
                                    });
                                // });
                            }
                        ], function (err, data) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, data);
                            }
                        });
                    }
                }
            })
        } else {
            console.log("data1data1-", data1)
            // Markets.placeOrder(data.min, function (err, data2) {
            var dataToSend = {};
            dataToSend.orderId = 'dsaad';
            dataToSend.orderJSON = 'asdaadsad';
            dataToSend.type = data.type;
            dataToSend.typeOfTrade = data.typeOfTrade;
            dataToSend.status = 'TransactionPending';
            dataToSend.price = data.price;
            async.parallel([
                    function (callback) {
                        Order.saveData(dataToSend, callback);
                    },
                    function (callback) {
                        Process.saveData(dataToSend, callback);
                    }
                ],
                function (err, data) {
                    if (err) {
                        console.log("error occured");
                        // callback(null, err);
                    } else {
                        callback(null, data);
                    }
                });
            // });
        }
    },

    getOrderData: function (data, callback) {
        Order.find({
            "accessLevel": {
                $in: ["TransactionPending", "TransactionPartiallyFilled"]
            }
        }).limit(1).exec(function (err, data1) {
            if (err || _.isEmpty(data1)) {
                // callback(err, null)
            } else {
                Markets.fetchOrders(data1.orderId, function (err, data) {
                    var ordrData = {};
                    //trades
                    Order.saveData(dataToSend, callback);
                });
            }
        })
    }
};
module.exports = _.assign(module.exports, exports, model);