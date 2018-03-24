module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    check: function (req, res) {
        var ccxt = require('ccxt');
        res.json(ccxt);
        var binance = new ccxt.binance();
        var hitbtc = new ccxt.hitbtc();


    }


};
module.exports = _.assign(module.exports, controller);