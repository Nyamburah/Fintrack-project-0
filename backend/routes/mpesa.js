import express from 'express';
import Transaction from '../models/transactions.js';
import User from '../models/users.js';

const router = express.Router();

// STK Push Callback - for money sent by user
router.post('/callback/stkpush', async (req, res) => {
  try {
    console.log('STK Push Callback:', JSON.stringify(req.body, null, 2));
   
    const result = req.body.Body?.stkCallback;
    if (!result || result.ResultCode !== 0) {
      return res.status(200).json({ message: 'Transaction failed or no data' });
    }
    
    const metadata = result.CallbackMetadata?.Item || [];
    const amount = metadata.find(i => i.Name === "Amount")?.Value;
    const mpesaReceiptNumber = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const transactionDate = metadata.find(i => i.Name === "TransactionDate")?.Value;
    const phoneNumber = metadata.find(i => i.Name === "PhoneNumber")?.Value;
   
    // Find user by phone number
    const user = await User.findOne({ phoneNumber: phoneNumber });
   
    if (user) {
      const transaction = new Transaction({
        amount,
        mpesaReceiptNumber,
        transactionDate: parseTransactionDate(transactionDate),
        phoneNumber,
        transactionType: 'sent',
        userId: user._id,
        status: 'completed',
        rawCallbackData: req.body
      });
     
      await transaction.save();
      console.log('Transaction saved:', transaction._id);
    }
   
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('STK Callback error:', error);
    res.status(200).json({ message: 'Error processed' });
  }
});

// C2B Callback - for money received by user
router.post('/callback/c2b', async (req, res) => {
  try {
    console.log('C2B Callback:', JSON.stringify(req.body, null, 2));
   
    const { TransAmount, TransID, TransTime, MSISDN, FirstName, LastName } = req.body;
   
    // Find user by phone number (adjust logic as needed)
    const user = await User.findOne({ phoneNumber: MSISDN });
   
    if (user) {
      const transaction = new Transaction({
        amount: TransAmount,
        mpesaReceiptNumber: TransID,
        transactionDate: parseTransactionDate(TransTime),
        phoneNumber: MSISDN,
        transactionType: 'received',
        senderName: `${FirstName} ${LastName}`.trim(),
        senderPhone: MSISDN,
        userId: user._id,
        status: 'completed',
        description: `Payment from ${FirstName} ${LastName}`,
        rawCallbackData: req.body
      });
     
      await transaction.save();
      console.log('C2B Transaction saved:', transaction._id);
    }
   
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('C2B Callback error:', error);
    res.status(200).json({ message: 'Error processed' });
  }
});

function parseTransactionDate(rawDate) {
  if (!rawDate) return new Date();
 
  const year = rawDate.slice(0, 4);
  const month = rawDate.slice(4, 6);
  const day = rawDate.slice(6, 8);
  const hour = rawDate.slice(8, 10);
  const min = rawDate.slice(10, 12);
  const sec = rawDate.slice(12, 14);
 
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
}

export default router;