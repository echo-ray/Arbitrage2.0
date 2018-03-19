var schema = new Schema({
    Exchange: {
        type: String
    },
    Type: {
        type: String,
        enum: ['Buy', 'Sell']
    },
    TypeOfTrade: {
        type: String,
        enum: ['Market', 'Oredrebook']
    },
    Process: {
        type: String
    },
    Price: {
        type: Number
    },
    Status: {
        type: String,
        enum: ['TransactionMade', 'TransactionPending', 'TransactionCompleted', 'TransactionFailed']
    },
    orderId: {
        type: String
    },
    OrderJSON: {
        type: JSON
    },
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'UserTransaction',
        index: true
    },
    TransactionJSON: {
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
module.exports = mongoose.model('Transaction', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, 'transactionId', 'transactionId'));
var model = {};
module.exports = _.assign(module.exports, exports, model);