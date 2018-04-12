const uuidv1 = require('uuid/v1');
var schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionDate: {
        type: Date,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['Deposit', 'Withdrawal'],
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
    },
    paymentStatus: {
        type: String,
    },
    Growth: [{
        Date: {
            type: Date
        },
        Quantity: {
            type: Number
        },
        Rate: {
            type: Number
        }
    }]
});

schema.plugin(deepPopulate, {
    'user': {
        select: ''
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('UserTransactions', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, 'user', 'user'));
var model = {

    withdrawTransaction: function (data, callback) {
        data.transactionId = uuidv1();
        data.transactionDate = new Date();
        data.transactionType = 'Withdrawal';
        data.user = data.userId;
        User.findOne({
            _id: data.userId
        }).exec(function (err, data1) {
            if (err || _.isEmpty(data1)) {
                callback(err);
            } else {
                console.log("data1", data1)
                if (data1.currentBalance >= data.amount) {
                    data1.currentBalance = data1.currentBalance - data.amount;
                    async.waterfall([
                            function (callback) {
                                User.saveData(data1, callback)
                            },
                            function (userData, callback) {
                                UserTransactions.saveData(data, callback)
                            }
                        ],
                        function (err, results) {
                            if (err || _.isEmpty(results)) {
                                callback(err);
                            } else {
                                callback(null, results);
                            }
                        }
                    );
                } else {
                    callback(null, "noBalance")
                }
            }
        });
    },

    depositTransaction: function (data, callback) {
        data.transactionId = uuidv1();
        data.transactionDate = new Date();
        data.transactionType = 'Deposit';
        data.user = data.userId;
        User.findOne({
            _id: data.userId
        }).exec(function (err, data1) {
            if (err || _.isEmpty(data1)) {
                callback(err);
            } else {
                data1.currentBalance = parseInt(data1.currentBalance) + parseInt(data.amount);
                async.waterfall([
                        function (callback) {
                            User.saveData(data1, callback)
                        },
                        function (userData, callback) {
                            UserTransactions.saveData(data, callback)
                        }
                    ],
                    function (err, results) {
                        if (err || _.isEmpty(results)) {
                            callback(err);
                        } else {
                            callback(null, results);
                        }
                    }
                );
            }
        });
    }

};
module.exports = _.assign(module.exports, exports, model);