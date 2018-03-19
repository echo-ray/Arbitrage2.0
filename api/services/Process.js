var schema = new Schema({
    ExchangeMin: {
        type: Number,
        required: true
    },
    ExchangeMax: {
        type: Number,
        required: true
    },
    Quantity: {
        type: Number,
        required: true
    },
    PriceBuy: {
        type: Number,
        required: true
    },
    PriceSell: {
        type: Number,
        required: true
    },
    Status: {
        type: String,
        enum: ['Transaction1Added', 'Transaction2Added', 'BothTransactionAdded',
            'Transaction1Completed', 'Transaction2Completed', 'TransactionCompleted', 'TransactionFailed'
        ]
    }


});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Process', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);