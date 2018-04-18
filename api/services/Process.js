var schema = new Schema({
    exchangeMin: {
        type: Number,
        required: true
    },
    exchangeMax: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priceBuy: {
        type: Number,
        required: true
    },
    priceSell: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Transaction1Added', 'Transaction2Added', 'BothTransactionAdded',
            'Transaction1Completed', 'Transaction2Completed', 'TransactionCompleted', 'TransactionFailed'
        ]
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }


});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Process', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);