import express from 'express';
import { initializeWorkerForCampaign, addEmailToQueue } from './emailQueue';
import { authMiddleware } from './middleware';
import { isCampaignOrg, isEmail } from './types';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(authMiddleware); // Apply the authentication middleware to all routes

// Initialize the worker for a campaign
app.post('/initialize-worker', async (req, res) => {
  const { campaignId } = req.body;
  if (!campaignId) {
    return res.status(400).json({
      success: false,
      message: 'Campaign ID is required',
    });
  }

  try {
    await initializeWorkerForCampaign(campaignId);
    res.status(200).json({
      success: true,
      message: 'Worker initialized',
    });
  } catch (error: any) {
    console.error(`Failed to initialize worker: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize worker',
    });
  }
});

// Add an email to the queue
app.post('/add-email', async (req, res) => {
  const { email, campaignOrg, interval, index } = req.body;
  
  if (!isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email',
    });
  }
  if (!isCampaignOrg(campaignOrg)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid campaignOrg',
    });
  }
  if (!interval) {
    return res.status(400).json({
      success: false,
      message: 'Invalid interval',
    });
  }
  if (!index) {
    return res.status(400).json({
      success: false,
      message: 'Invalid index',
    });
  }

  try {
    await addEmailToQueue(email, campaignOrg, interval, index);
    res.status(200).json({
      success: true,
      message: 'Email added to queue',
    });
  } catch (error: any) {
    console.error(`Failed to add email to queue: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to add email to queue',
    });
  }
});

app.get("/", (req:any, res: any) => {
  res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
