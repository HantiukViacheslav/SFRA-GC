'use strict';

var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');

var baseModule = module.superModule;

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Boolian} single
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket, single) {
    var result = { error: false, total: '', gcBalance: '' , gcCode: ''};
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

    try {
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.paymentInstruments;
            if (!paymentInstruments.length) {
                return;
            }
            var orderTotal = currentBasket.totalGrossPrice;

            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.getPaymentMethod())) {
                    var orderValue = orderTotal.value;
                    var giftCert = GiftCertificateMgr.getGiftCertificateByCode(paymentInstrument.giftCertificateCode);
                    var balance = giftCert.getBalance();

                    result.gcBalance = balance.value;
                    result.gcCode = paymentInstrument.giftCertificateCode;

                    if (orderValue > balance.value) {
                        paymentInstrument.paymentTransaction.setAmount(balance);
                        orderValue -= balance.value;
                    } else {
                        paymentInstrument.paymentTransaction.setAmount(orderTotal);
                        orderValue = 0;
                    }

                    orderTotal = new Money(orderValue, currentBasket.getCurrencyCode());
                } else {
                    paymentInstrument.paymentTransaction.setAmount(orderTotal);
                }
                if (single) {
                    break;
                }
            }
            result.total = orderTotal.value;
        });
    } catch (e) {
        Logger.error('[checkoutHelpers.js] Error during transaction calculation on line {0} with message {1}', e.lineNumber, e.message);
        result.error = true;
    }

    return result;
}

baseModule.calculatePaymentTransaction = calculatePaymentTransaction;

module.exports = baseModule;
