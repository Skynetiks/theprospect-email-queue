import express from 'express';
import { initializeWorkerForCampaign, addEmailToQueue } from './path-to-your-worker-file';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Initialize the worker for a campaign
app.post('/initialize-worker', async (req, res) => {
  const { campaignId } = req.body;
  if (!campaignId) {
    return res.status(400).send('Campaign ID is required');
  }

  try {
    await initializeWorkerForCampaign(campaignId);
    res.status(200).send('Worker initialized');
  } catch (error) {
    console.error(`Failed to initialize worker: ${error.message}`);
    res.status(500).send('Failed to initialize worker');
  }
});

// Add an email to the queue
app.post('/add-email', async (req, res) => {
  const { email, campaignOrg, campaignId, interval, index } = req.body;

  if (!email || !campaignOrg || !campaignId || interval == null || index == null) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    await addEmailToQueue(email, campaignOrg, campaignId, interval, index);
    res.status(200).send('Email added to queue');
  } catch (error) {
    console.error(`Failed to add email to queue: ${error.message}`);
    res.status(500).send('Failed to add email to queue');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
