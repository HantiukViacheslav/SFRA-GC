'use strict';

'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

var server = require('server');

 server.get('ApplayGiftCertificat', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var HookMgr = require('dw/system/HookMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var giftcertID = req.querystring.giftcertID;
    var processor = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_GIFT_CERTIFICATE).getPaymentProcessor();
    var result = null;
    if (!currentBasket || !giftcertID || !processor) {
        res.json({
            redirectUrl: URLUtils.url('Cart-Show').toString(),
            error: true
        });

        return next();
    }

    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        result =  HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            req,
            giftcertID,
            currentBasket
        );
    }

    if (!result.error) {
        result = COHelpers.calculatePaymentTransaction(
            currentBasket
        );
    }
 
    res.json(result);
   
    return next();
});

module.exports = server.exports();