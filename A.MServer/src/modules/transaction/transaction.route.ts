import express from 'express';
import * as TransactionService from './transaction.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import { createTransactionSchema } from './transaction.types';

const router = express.Router();

router.post('/', validate(createTransactionSchema), async (req, res) => {
    const result = await TransactionService.createTransaction(req.body);
    res.status(201).json({
        success: true,
        message: 'Transaction completed successfully.',
        data: result
    });
});

export default router;
