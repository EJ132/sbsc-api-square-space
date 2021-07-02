/*
Copyright 2021 Square Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import express from 'express';
import JSONBig from 'json-bigint';

import { randomBytes } from 'crypto';
import { Cart } from '../models/cart';
import { ordersApi, invoicesApi, paymentsApi } from '../util/square-client';
import 'dotenv/config';

const easyPostKey = process.env.EASYPOST_TEST_API_KEY;
const Easypost = require('@easypost/api');
const easypost_api = new Easypost(easyPostKey);

var nodemailer = require('nodemailer');

const router = express.Router();

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ejg132@gmail.com',
    pass: 'Sweetnest'
  }
});

var mailOptions = {
  from: 'ejg132@gmail.com',
  to: 'ejg132@gmail.com',
  subject: 'SBSC Receipt'
};

/**
 * Matches: POST /checkout/add-delivery-details/
 *
 * Description:
 *  Take the delivery infomration that are submitted from the page,
 *  then call UpdateOrder api to update the fulfillment.
 *
 *  You learn more about the UpdateOrder endpoint here:
 *  https://developer.squareup.com/reference/square/orders-api/update-order
 *
 *  NOTE: This example is to show you how to update an order, however, you don't
 *  have to create an order and update it in each step; Instead, you can also
 *  collect all the order information that include purchased catalog items and
 *  fulfillment inforamiton, and create an order all together.
 *
 * Request Body:
 *  orderId: Id of the order to be updated
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 *  deliveryName: Name of the individual who will receive the delivery
 *  deliveryEmail: Email of the recipient
 *  deliveryNumber: Phone number of the recipient
 *  deliveryTime: Expected delivery time
 *  deliveryAddress: Street address of the recipient
 *  deliveryCity: City of the recipient
 *  deliveryState: State of the recipient
 *  deliveryPostal: Postal code of the recipient
 */
router.post("/add-delivery-details", async (req, res, next) => {
  const {
    orderId,
    locationId,
    deliveryName,
    deliveryEmail,
    deliveryNumber,
    deliveryAddress,
    deliveryCity,
    deliveryState,
    deliveryPostal,
    version
  } = req.body;
  try {

    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId: locations[0].id,
        fulfillments: [{
          type: "SHIPMENT", // SHIPMENT type is determined by the endpoint
          state: "PROPOSED",
          shipmentDetails: {
            recipient: {
              displayName: deliveryName,
              phoneNumber: deliveryNumber,
              email: deliveryEmail,
              address: {
                addressLine1: deliveryAddress,
                administrativeDistrictLevel1: deliveryState,
                locality: deliveryCity,
                postalCode: deliveryPostal,
              },
            },
            expectedShippedAt: deliveryTime,
          },
        },],
        version,
        idempotencyKey,
      },
    };
    const { result: { order } } = await ordersApi.updateOrder(`${orderId}`,orderRequestBody);
    const orderParsed = JSONBig.parse(JSONBig.stringify(order));
    res.json(
      {
          result: "Success! Delivery details added!",
          order: orderParsed
        })
  } catch (error) {
    next(error);
  }
});

/**
 * Matches: POST /checkout/create-invoice
 * 
 * Description:
 *   Create an invoice if the customer opts to pay later. This also allows
 *   for in-person payment capture via Square mobile app at the time of
 *   delivery, resulting in a lower fee. This method only creates the 
 *   invoice, it does not publish it yet. This allows for fully synchronous
 *   order confirmation with Square.
 * 
 *   You can learn more about the CreateInvoice endpoint here:
 *   https://developer.squareup.com/reference/square/invoices-api/create-invoice
 *
 * Request Body:
 *  orderId: Id of the order to create an invoice from
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 */
router.post("/create-invoice", async (req, res, next) => {
  const {
    orderId
  } = req.body;
  
  function nextWeekdayDate(date, day_in_week) {
    const ret = new Date(date || new Date());
    ret.setDate(ret.getDate() + (day_in_week -1 - ret.getDay() + 7) % 7 + 1);
  return ret;
  }
  
  try {
    // Since deliveries happen every Tuesday, set the dueDate
    // to Tuesday using nextWeekdayDate()
    const date = new Date();
    // Set due date to next Tuesday
    const dueDate = new nextWeekdayDate(date, 2);
    const dueDateString = dueDate.toISOString().split("T")[0];
    let { result: { order } } = await ordersApi.retrieveOrder(orderId);
    const orderRequestBody = {
      invoice: {
        locationId: order.locationId,
        orderId: orderId,
        paymentRequests: [
        {
          requestType: 'BALANCE',
          //dueDate: order.expectedShippedAt,
          dueDate: dueDateString,
          reminders: [
          {
            message: 'Your order is scheduled for tomorrow',
            relativeScheduledDays: -1
          }]
        }],
        deliveryMethod: 'SHARE_MANUALLY',
        idempotencyKey: randomBytes(45).toString("hex")
      }
    };
    const { result: { invoice } } = await invoicesApi.createInvoice(orderRequestBody);
    const invoiceParsed = JSONBig.parse(JSONBig.stringify(invoice));
    //const orderParsed = JSONBig.parse(JSONBig.stringify(order));
    const cart = new Cart(orderId);
    order = await cart.info();
    res.json(
      {
          result: "Success! Invoice created!",
          invoice: JSONBig.parse(JSONBig.stringify(invoice)),
          order: order
        })
  } catch (error) {
    next(error);
  }
});

/**
 * Matches: POST /checkout/payment/
 *
 * Description:
 *  Take the payment infomration that are submitted from the /checkout/payment page,
 *  then call payment api to pay the order
 *
 *  You can learn more about the CreatePayment endpoint here:
 *  https://developer.squareup.com/reference/square/payments-api/create-payment
 *
 * Request Body:
 *  orderId: Id of the order to be updated
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 *  nonce: Card nonce (a secure single use token) created by the Square Payment Form
 */

router.post("/verify-address", async (req, res, next) => {

  try {
    console.log(req.body.addressDetails)

    // const toAddress = new api.Address({ ... });
    // const fromAddress = new api.Address({ ... });
    // const parcel = new api.Parcel({ ... });
    // const customsInfo = new api.CustomsInfo({ ... });

    const toAddress = new easypost_api.Address({
      verify: ['delivery'],
      street1: req.body.addressDetails[2].addressLine1,
      city: req.body.addressDetails[3].city,
      state: req.body.addressDetails[4].state,
      zip: req.body.addressDetails[5].zip,
      country: 'US',
      company: 'SBSC',
      phone: req.body.addressDetails[6].phoneNumber,
      carrier_facility: 'USPS',
      name: req.body.addressDetails[0].firstName + ' ' + req.body.addressDetails[1].lastName,
      email: req.body.addressDetails[7].emailAddress,
    });

    const fromAddress = new easypost_api.Address({
      street1: "26640 S Western Ave E-2",
      city: "Harbor City",
      state: "CA",
      zip: "90710",
      country: 'US',
      company: 'SBSC',
      phone: "2169787444",
      carrier_facility: 'USPS',
      name: "Ashley Contorno",
      email: "ashleycontorno@gmail.com",
    });

    const parcel = new easypost_api.Parcel({
      length: 20.2,
      width: 10.9,
      height: 5,
      weight: 10
    });
    
    toAddress.save().then((addr) => {
      console.log(addr);
      if(addr.verifications.delivery.success){
        res.json({
          result: "Address Verified!",
          data: true
        })
      } else {
        res.json({
          result: "Address not valid!",
          data: false
        })
      }
    });

    // const shipment = new easypost_api.Shipment({
    //   to_address: toAddress,
    //   from_address: fromAddress,
    //   parcel: parcel
    // });
    
    // shipment.save().then(console.log);

  } catch (error) {
    next(error);
    console.log(error)
  }
  
});

router.post("/payment", async (req, res, next) => {
  const {
    orderId,
    idempotencyKey,
    nonce
  } = req.body;
  let orderRequestBody;
  try {
    // get the latest order information in case the price is changed from a different session

    //ADD SHIPPING
    let data = await ordersApi.retrieveOrder(orderId);
    let orderDetails = JSON.parse(data.body)
    console.log(orderDetails.order)
    orderDetails.order.total_service_charge_money.amount = 4;
    orderDetails.order.net_amounts.service_charge_money.amount = 4;
    orderDetails.order.locationId = orderDetails.order.location_id;
    console.log(orderDetails)
    // data = {...data, }
    await ordersApi.updateOrder(orderId, orderDetails).then(result => {console.log('made it here'); console.log(result)})
    // console.log(data.body)
    // console.log(JSON.parse(data.body))
    // let amount = parseInt(order.totalMoney.amount)
    // console.log(order.totalMoney) 

    const { result: { order } } = await ordersApi.retrieveOrder(orderId);

    if (order.totalMoney.amount > 0) {
      // Payment can only be made when order amount is greater than 0
      // let amount = order.totalMoney.amount.split('')
      // console.log(order.totalMoney.amount.split('n'))
      // console.log('here')
      // console.log(amount)
      // console.log(typeof order.totalMoney)
      // console.log(parseInt(order.totalMoney))
      orderRequestBody = {
        sourceId: nonce, // Card nonce created by the payment form
        idempotencyKey,
        // amountMoney: (order.totalMoney + 4.50) + (order.totalMoney * 0.085).toFixed(2), // Provides total amount of money and currency to charge for the order.
        amountMoney: {
          amount: order.totalMoney.amount,
          currency: 'USD'
        },
        orderId: order.id, // Order that is associated with the payment
      };
    } else {
      // Settle an order with a total of 0.
      await ordersApi.payOrder(order.id, {
        idempotencyKey
      });
    }
    const { result: { payment } } = await paymentsApi.createPayment(orderRequestBody);
    const paymentParsed = JSONBig.parse(JSONBig.stringify(payment));
    console.log('Payment Details')
    console.log(paymentParsed)

    mailOptions.html = 
    `
    <h2 style="width: 100%; textAlign: center;">
      South Bay Strength Company
    </h2>
    <p>Thank you for ordering with SBSC.</p>
    <p>Receipt Number: ${paymentParsed.receiptNumber}</p>
    <p>Receipt ID: ${paymentParsed.id}</p>
    <br>
    <p>You can view your receipt at: ${paymentParsed.receiptUrl}</p>
    <br>
    <br>
    <p>If you have any questions regarding an order reach out to us here: info@southbaystrengthco.com</p>
    <h4>South Bay Strength Co.</h4>
    `


    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.json(
      {
          result: "Success! Order paid!",
          payment: paymentParsed
        })
  } catch (error) {
    next(error);
    console.log(error)
  }
});

export default router;
