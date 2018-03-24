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
    }
};
module.exports = _.assign(module.exports, exports, model);