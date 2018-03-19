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
    Date: {
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
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
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
var model = {};
module.exports = _.assign(module.exports, exports, model);