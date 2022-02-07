'use strict';

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * Authorizes a payment using a gift certificate. The payment is authorized by redeeming the gift certificate 
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var currentBasket = BasketMgr.getCurrentBasket();

    Transaction.begin();

    var status = GiftCertificateMgr.redeemGiftCertificate(paymentInstrument);

    Transaction.commit();

    if (status.isError()) {
        currentBasket.removePaymentInstrument(paymentInstrument);

        return { error: true };
    } else {
        //TODO: remuve gc from custum

        return { error: false };
    }
}

function Handle(req, giftCertID, currentBasket) {
    try {
        var giftCert = GiftCertificateMgr.getGiftCertificate(giftCertID);
        var isValid = giftCert.getStatus();
        var isEnabled = giftCert.isEnabled();
        var collections = require('*/cartridge/scripts/util/collections');

        if (isEnabled && (isValid === 1 || isValid === 2)) {
            var balance = giftCert.getBalance();

            paymentInstruments = currentBasket.getPaymentInstruments(
                PaymentInstrument.METHOD_GIFT_CERTIFICATE
            );

            Transaction.begin();
                collections.forEach(paymentInstruments, function (item) {
                    if (item.giftCertificateCode == giftCertID) {
                        currentBasket.removePaymentInstrument(item);
                    }
                });
            Transaction.commit();
            
            //check if order total is greater than the gc balance. if so, only apply the order total
            if (currentBasket.totalGrossPrice.value > balance.value) {
                Transaction.begin();
                    var paymentInstrument = currentBasket.createPaymentInstrument(
                        PaymentInstrument.METHOD_GIFT_CERTIFICATE, balance
                    );
                    paymentInstrument.setGiftCertificateCode(giftCertID);
                Transaction.commit();
            } else {
                Transaction.begin()
                    var paymentInstrument = currentBasket.createPaymentInstrument (
                        PaymentInstrument.METHOD_GIFT_CERTIFICATE, currentBasket.totalGrossPrice
                    );
                    paymentInstrument.setGiftCertificateCode(giftCertID);
                Transaction.commit();
            }

            return {
                error: false,
                giftCert: giftCert
            };
        } else if (isValid === 3) {
            // gc is redemed
            return {
                error: true
            }
        } else {
            // gc is not valid 
            return {
                error: true
            }
        }
        
    } catch (error) {
        return {
            error: true
        }
    }
    
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Authorize = Authorize;
exports.Handle = Handle;
