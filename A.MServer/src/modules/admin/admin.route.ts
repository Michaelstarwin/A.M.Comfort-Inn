import express from 'express';
import * as AdminService from './admin.service';

const router = express.Router();

// Create or promote a user to ADMIN role
router.post('/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await AdminService.createAdminUser({ email, name });
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Error creating admin user' });
  }
});
router.get('/users', async (req, res) => {
  try {
    const users = await AdminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Error fetching users' });
  }
});

export default router;
