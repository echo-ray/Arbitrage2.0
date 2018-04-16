var schema = new Schema({
    exchange: {
        type: String
    },
    type: {
        type: String,
        enum: ['Buy', 'Sell']
    },
    typeOfTrade: {
        type: String,
        enum: ['Market', 'Oredrebook']
    },
    process: {
        type: String
    },
    price: {
        type: Number
    },
    status: {
        type: String,
        enum: ['TransactionMade', 'TransactionPending', 'TransactionCompleted', 'TransactionFailed', 'TransactionPartiallyFilled']
    },
    orderId: {
        type: String
    },
    orderJSON: {
        type: JSON
    },
    trades: {
        type: JSON
    }
});

schema.plugin(deepPopulate, {
    'transactionId': {
        select: ''
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Order', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, 'transactionId', 'transactionId'));
var model = {};
module.exports = _.assign(module.exports, exports, model);