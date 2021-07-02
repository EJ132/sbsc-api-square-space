import express from 'express';
const squareConnect = require('square-connect');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const accessToken = process.env.SQUARE_SANDBOX_ACCESS_TOKEN

// Set Square Connect credentials and environment
const defaultClient = squareConnect.ApiClient.instance;

// Configure OAuth2 access token for authorization: oauth2
const oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = accessToken;

// Set 'basePath' to switch between sandbox env and production env
// sandbox: https://connect.squareupsandbox.com
// production: https://connect.squareup.com
defaultClient.basePath = 'https://connect.squareupsandbox.com';

const router = express.Router();

router.post('/process-payment', async (req, res) => {
    const request_params = req.body;
  
    // length of idempotency_key should be less than 45
    const idempotency_key = crypto.randomBytes(22).toString('hex');
  
    // Charge the customer's card
    const payments_api = new squareConnect.PaymentsApi();
    const request_body = {
      source_id: request_params.nonce,
      amount_money: {
        amount: 100, // £1.00 charge
        currency: 'USD'
      },
      idempotency_key: idempotency_key
    };
  
    try {
      const response = await payments_api.createPayment(request_body);
      res.status(200).json({
        'title': 'Payment Successful',
        'result': response
      });
    } catch(error) {
      res.status(500).json({
        'title': 'Payment Failure',
        'result': error.response.text
      });
    }
});

router.post('/retrieve-payment', async (req, res) => {
  const request_params = req.body;
  console.log(req.body)

  const payments_api = new squareConnect.PaymentsApi();
  
  try {
    const response = await payments_api.getPayment(req.body.paymentId);
    res.status(200).json({
      'title': 'Receipt Received',
      'result': response
    });
  } catch(error) {
    res.status(500).json({
      'title': 'No Receipt',
      'result': error.response
    });
    console.log(error)
  }
});

export default router;