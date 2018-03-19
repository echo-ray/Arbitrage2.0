var schema = new Schema({
    Market: {
        type: Schema.Types.ObjectId,
        ref: 'Markets',
        index: true
    },
    Date: {
        type: Date,
        required: true
    },
    balances: {
        type: Number,
        enum: ['CryptoCoin', 'AmountBalance']
    }
});

schema.plugin(deepPopulate, {
    'Market': {
        select: ''
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('MarketBalance', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, 'Market', 'Market'));
var model = {};
module.exports = _.assign(module.exports, exports, model);