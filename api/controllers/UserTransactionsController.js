module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    withdrawTransaction: function (req, res) {
        if (req.body) {
            UserTransactions.withdrawTransaction(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },

    depositTransaction: function (req, res) {
        if (req.body) {
            UserTransactions.depositTransaction(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
};
module.exports = _.assign(module.exports, controller);