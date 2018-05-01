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

    /**
     *  fetch orderbook for binance .
     * 
     *  @param  {String} symbol -   specific market symbol.
     *  @returns  {callback} callback -   Return buy and sell orderbook.
     */
    getAllOrdersForBinance: function (data, callback) {
        var exchange = new ccxt.binance();
        exchange.loadMarkets().then(function (data) {
            exchange.fetchOrderBook(symbol).then(function (data) {
                callback(null, data)
            })
        });
    },

    /**
     *  fetch orderbook for hitbtc.
     * 
     *  @param  {String} symbol -   specific market symbol.
     *  @returns  {callback} callback -   Return buy and sell orderbook.
     */
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

    /**
     *  compare buy(ask) of two markets and finding min and max rate from each market .
     * 
     *  @param  {callback} callback -   Return min,max,ratio,min,maxLow rates .
     */
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

                    var marketData = {};
                    marketData.binanaceRateSell = result.Binance;
                    marketData.HitbtcRateSell = result.Hitbtc;
                    marketData.max = max;
                    marketData.min = min;
                    marketData.ratio = actualRatio;
                    marketData.maxLow = max[0] / minProfitRate;
                    qty = max[1] / 3;
                    marketData.canMakeOrder = (actualRatio > global.minProfitRate && qty > global.minimumVolume);
                    callback(null, marketData);
                }
            });
    },

    /**
     *  compare sell(bid) of two markets and finding min and max rate from each market .
     * 
     *  @param  {callback} callback -   Return min,max,ratio,min,maxLow rates .
     */
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

                    var marketData = {};
                    marketData.binanaceRateSell = result.Binance;
                    marketData.HitbtcRateSell = result.Hitbtc;
                    marketData.max = max;
                    marketData.min = min;
                    marketData.ratio = actualRatio;
                    marketData.minHigh = min[0] * minProfitRate;
                    qty = max[1] / 3;
                    callback(null, marketData);

                    if (actualRatio > minProfitRate) {
                        qty = min[1] / 3;
                        if (qty > minimumVolume) {
                            var orderData = {};
                            orderData.type = 'Buy';
                            orderData.typeOfTrade = 'Oredrebook';
                            orderData.price = 300;
                            Markets.orderPlace(orderData, function (err, data) {})
                        }
                    }
                }
            });
    },

    /**
     *  fetch a perticular order.
     * 
     *  @param  {String} id -   need order id .
     *  @returns  {callback} callback -   Return order details related to the perticular order.
     */
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

    /**
     *  place a order .
     * 
     *  @param  {String} symbol -market symbol   
     *  @param  {String} type - 'limit'; //# or 'market'
     *  @param  {String} side -'buy'; //# or 'sell'
     *  @param  {Number} amount - amount
     *  @param  {Number} price -price           
     *  @returns  {callback} callback -   Return order id and json.
     */
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

        exchange.create_order(symbol, type, side, amount, price, params)
            .then(function (data) {
                console.log("data");
            });
        console.log("data", data + newRate);
    },

    /**
     *  cancel a order.
     * 
     *  @param  {String} id -   specific market symbol.
     *  @returns  {callback} callback -   Return cancel order details.
     */
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

    /**
     *  checking conditions and placing a order .
     * 
     *  @return  {callback} callback -   placed order detials
     */
    orderPlace: function (data, callback) {
        async.waterfall([
            // Compare Rates and Check the Posibility
            function (callback) {
                Markets.compareHitbtcAndBinanceBuy(data, callback);
            },
            // place an order 
            function (compData, callback) {
                if (compData.canMakeOrder == true) {
                    // Markets.placeOrder(data.min, function (err, data2) {
                    var dataToSend = {};
                    dataToSend.orderId = 'dsaad';
                    dataToSend.orderJSON = 'asdaadsad';
                    orderData.type = 'Buy';
                    orderData.typeOfTrade = 'Oredrebook';
                    dataToSend.status = 'TransactionPending';
                    orderData.price = 300;
                    async.parallel([
                            //save placed order 
                            function (callback) {
                                Order.saveData(dataToSend, callback);
                            },
                            //save process of placed order and set global.currentProcess variable
                            function (callback) {
                                Process.saveData(dataToSend, function (err, data) {
                                    global.currentProcess = data._id;
                                    callback(null, data);
                                });
                            }
                        ],
                        callback);
                    // });
                }
            }
        ], callback);
    },

    /**
     *  check a order  .
     * 
     *  @return  {callback} callback -   Return current status of order.
     */
    checkOrderData: function (data, callback) {
        async.waterfall([
            //find process
            function (callback) {
                Process.findOne({
                    _id: global.currentProcess
                }).deepPopulate("order").exec(function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, null);
                    } else {
                        callback(err, data);
                    }
                });
            },
            //fetch orderDetails match 2 conditions 1. filled 2.qty and ratio diff
            function (processData, callback) {
                // Markets.fetchOrders(data1.order, function (err, data2) {
                if (data2.filled) {
                    async.parallel([
                        function (callback) {
                            // Markets.cancelOrder(data1.orderId, function (err, data2) {
                            global.currentProcess = false;
                            data1[0].status = 'TransactionPartiallyFilled';
                            Order.saveData(data1.order._id, callback);
                            // })
                        },
                        function (callback) {
                            // Markets.placeOrder(data.min, function (err, data2) {  //place sell order
                            var dataToSend = {};
                            dataToSend.orderId = 'data2.id';
                            dataToSend.orderJSON = 'data2.info';
                            dataToSend.type = 'type';
                            dataToSend.typeOfTrade = 'typeOfTrade';
                            dataToSend.status = 'TransactionPending';
                            dataToSend.price = 'price';
                            async.waterfall([
                                function (callback) {
                                    Order.saveData(dataToSend, callback);
                                },
                                function (data, callback) {
                                    Process.saveData(dataToSend, function (err, data) {
                                        currentProcess = data._id;
                                        callback(null, data);
                                    });
                                }
                            ], callback);
                            // });
                        }
                    ], callback);
                } else {
                    async.waterfall([
                        // Compare Rates and Check the Posibility
                        function (callback) {
                            Markets.compareHitbtcAndBinanceBuy(data, callback);
                        },
                        // place an order 
                        function (compData, callback) {
                            if (compData.canMakeOrder == false) {
                                // Markets.cancelOrder(data1.orderId, function (err, data2) {
                                global.currentProcess = false;
                                data1[0].status = 'TransactionPartiallyFilled';
                                Order.saveData(data1.order._id, callback);
                                // })
                            }
                        }
                    ], callback);
                }
                // });
            }
        ])
    }

};

// cron.schedule('*/5 * * * *', function () {
//     if (global.currentProcess != false) {
//         Markets.checkOrderData(global.currentProcess, callback);
//     } else {
//         Markets.orderPlace(data, callback);
//     }
// });

module.exports = _.assign(module.exports, exports, model);