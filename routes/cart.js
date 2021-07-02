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

import { ordersApi, locationsApi } from '../util/square-client';
import { randomBytes } from 'crypto';
import { Cart } from '../models/cart';
import { isNull } from 'util';

const router = express.Router();

/**
 * Matches: POST /cart/order-info
 *
 * Description:
 *  Responds with information about an order, and only needs an orderId as argument.
 *  This handles potential refresh issues on the front end, and can be used
 *  for order confirmation on the checkout page. It's also useful for abstracting
 *  data to the front-end, and only requires making use of the built-in 
 *  retriveOrder() function from client.ordersApi, which is parsed via Cart(orderId).info(). 
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the order has been successfully created, the order's information is
 *  returned with res.json({}). This allows for shopping cart data that is 
 *  pre-sync'd with Square's API, and updates in real-time.
 * 
 * Request Body:
 *  orderId: The order's ID, the only component that is required
 */
router.post("/order-info", async (req, res, next) => {
    const {orderId} = req.body;
    try {
      const { result: { order } } = await ordersApi.retrieveOrder(orderId);
      const orderParsed = JSONBig.parse(JSONBig.stringify(order));
      //const cart = new Cart(orderId, null);
      //const order = await cart.info();
      res.json({
        orderInfo: orderParsed
      });
    } catch (error) {
      next(error);
    }
  });

/**
 * Matches: POST /cart/update-order-add-item
 *
 * Description:
 *  Updates the order by adding a new item. 
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the order has been successfully updated, the order's information is
 *  returned with res.json({}). This allows for shopping cart data that is 
 *  pre-sync'd with Square's API, and updates in real-time.
 * 
 * Request Body:
 *  itemVarId: Id of the CatalogItem which will be purchased
 *  itemQuantity: Quantility of the item
 *  locationId: The Id of the location
 */
router.post("/update-order-add-item", async (req, res, next) => {
  const {
    orderId,
    itemVarId,
    itemQuantity,
    locationId,
    version
  } = req.body;
  try {

    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId: locations[0].id,
        lineItems: [{
          quantity: itemQuantity,
          catalogObjectId: itemVarId // ID for CatalogItem object
        }],
        version
      }
    };
    const changeCart = new Cart(orderId, orderRequestBody);
    const order = await changeCart.update();
    res.json(
      {
          result: "Success!",
          order: order
        })
  } catch (error) {
    next(error);
  }
});


/**
 * Matches: POST /cart/update-order-item-quantity
 *
 * Description:
 *  Updates the quantity/quantities of an item(s) that is/are already in the cart.
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the item quantity has been successfully modified, the updated order's 
 *  information is returned with res.json({updatedOrder}). Items are not fully 
 *  removed by setting itemQuantity to 0. While it bears no impact on the order's
 *  total, the item still retains a uid in the cart, in case the customer wants
 *  to re-add another quantity later. This allows for syncronous replication of  
 *  data between Square's API, and the front-end React application.
 * Request Body:
 *  locationId 
 *  orderId
 *  itemId: used for calculating taxes
 *  itemUid: the item's uid
 *  itemQuantity: new total quantity of item
 *  version: the version of the order
 */
router.post("/update-order-item-quantity", async (req, res, next) => {
    const {
      locationId,
      orderId,
      itemUid,
      itemQuantity
    } = req.body;
    try {

      // Retrieves locations in order to display the store name
      const { result: { locations } } = await locationsApi.listLocations();

      let { result: order } = await ordersApi.retrieveOrder(orderId);
      const orderRequestBody = {
        order: {
          locationId: locations[0].id,
          lineItems: [{
            uid: itemUid,  // ID for orderItem object
            quantity: itemQuantity,
          }],
          version: order.version
        },
        idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      };
      const changeCart = new Cart(orderId, orderRequestBody);
      order = await changeCart.update();
      res.json(  
        {
            result: "Success! Order updated!",
            updatedOrder: order
          })
    } catch (error) {
      next(error);
    }
  });

router.post("/update-order-remove-item", async (req, res, next) => {
  console.log(req.body)
  const {
      locationId,
      orderId,
      itemUid,
      version
  } = req.body;
  try {

    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    let {result : order } =  await ordersApi.retrieveOrder(orderId);
    console.log(order)
    const orderRequestBody = {
      order: {
        locationId: locations[0].id,
        version: order.order.version, 
      },
      fieldsToClear: [
        `line_items[${itemUid}]`
      ],
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
    };
    const removeItem = new Cart(orderId, orderRequestBody);
    order = await removeItem.update();
    res.json(  
      {
          result: "Success! Item removed!",
          updatedOrder: order
        })
    } catch (error) {
      console.log(error)
      next(error);
    }
  });

router.post("/update-order-empty-cart", async (req, res, next) => {
  const {
      locationId,
      orderId
  } = req.body;
  try {

    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();

    let {result : order } =  await ordersApi.retrieveOrder(orderId);
    const orderRequestBody = {
      order: {
        locationId: locations[0].id,
        version: order.version
      },
      fieldsToClear: [
        'line_items'
      ],
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
    };
    const emptyCart = new Cart(orderId, orderRequestBody);
    order = await emptyCart.update();
    res.json(  
      {
          result: "Success! Cart is empty!",
          updatedOrder: order
        })
    } catch (error) {
      next(error);
    }
});

router.post("/update-order-shipping-information", async (req, res, next) => {
  const {
      orderId,
      shippingDetails
  } = req.body;


  console.log(req.body)

  try {

    console.log(shippingDetails)

    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();
    console.log('made it to the end 4')
    let {result : order } =  await ordersApi.retrieveOrder(orderId);
    console.log('made it to the end 3')
    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId: locations[0].id,
        fulfillments: [
          {
            type: 'SHIPMENT',
            state: 'PROPOSED',
            shipmentDetails: {
              recipient: {
                displayName: shippingDetails[0].firstName + " " + shippingDetails[1].lastName,
                emailAddress: shippingDetails[7].emailAddress,
                phoneNumber: shippingDetails[6].phoneNumber,
                address: {
                  addressLine1: shippingDetails[2].addressLine1,
                  locality: shippingDetails[3].city,
                  postalCode: shippingDetails[5].zip,
                  country: 'US',
                  firstName: shippingDetails[0].firstName,
                  lastName: shippingDetails[1].lastName
                }
              },
              carrier: 'USPS',
              shippingType: 'First Class'
            }
          }
        ],
        version: order.order.version,
        idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      },
    };
    console.log('made it to the end 2')
    const updateCard = new Cart(orderId, orderRequestBody);
    console.log('made it to the end')
    order = await updateCard.update();
    res.json(  
      {
          result: "Success! Cart is update (address information)!",
          updatedOrder: order
        })
    } catch (error) {
      next(error);
    }
});

export default router;