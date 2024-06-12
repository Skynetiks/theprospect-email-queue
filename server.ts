import express from 'express';
import { initializeWorkerForCampaign, addEmailToQueue } from './emailQueue';
import { authMiddleware } from './middleware';
import { isCampaignOrg, isEmail } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config()
app.use(express.json()); // Middleware to parse JSON bodies
app.use(authMiddleware); // Apply the authentication middleware to all routes

// Initialize the worker for a campaign
app.post('/initialize-worker', async (req, res) => {
  const { campaignId } = req.body;
  if (!campaignId) {
    return res.status(400).send('Campaign ID is required');
  }

  try {
    await initializeWorkerForCampaign(campaignId);
    res.status(200).send('Worker initialized');
  } catch (error: any) {
    console.error(`Failed to initialize worker: ${error.message}`);
    res.status(500).send('Failed to initialize worker');
  }
});

// Add an email to the queue
app.post('/add-email', async (req, res) => {
  const { email, campaignOrg, interval, index } = req.body;
  
  if(!isEmail(email)){
    return res.status(400).send('Invalid email');
  }
  if(!isCampaignOrg(campaignOrg)){
    return res.status(400).send('Invalid campaignOrg');
  }
  if(!interval){
    return res.status(400).send('Invalid interval');
  }
  if(!index){
    return res.status(400).send('Invalid index');
  }

  try {
    await addEmailToQueue(email, campaignOrg, interval, index);
    res.status(200).send('Email added to queue');
  } catch (error: any) {
    console.error(`Failed to add email to queue: ${error.message}`);
    res.status(500).send('Failed to add email to queue');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
