import { Queue, Worker } from "bullmq";
import { sendEmailSES } from "./aws";
import { getRedisConnection } from "./redis";
import { query } from "./db";

const sendEmail = async (email: { senderId: string; leadId: string; subject: string; bodyHTML: string; replyToEmail: string; id: string; emailCampaignId: string; }, campaignOrg: { name: string; id: any; }) => {
	try {
		const userResult = await query('SELECT * FROM users WHERE id = $1', [email.senderId]);
		const user = userResult.rows[0];
		if (!user) throw new Error("User not found");
	
		const leadResult = await query('SELECT * FROM leads WHERE id = $1', [email.leadId]);
		const lead = leadResult.rows[0];
		if (!lead) throw new Error("Lead not found");
	
		const emailSent = await sendEmailSES(
		  `${campaignOrg.name.toLowerCase().replace(" ", "-").replace(".", "")}-${campaignOrg.id}@theprospect.ai`,
		  campaignOrg.name,
		  lead.email,
		  email.subject,
		  email.bodyHTML,
		  email.replyToEmail,
		);
	
		if (emailSent.success) {
		  await query('UPDATE emails SET status = $1 WHERE id = $2', ['SENT', email.id]);
	
		  await query('UPDATE email_campaigns SET sent_email_count = sent_email_count + 1 WHERE id = $1', [email.emailCampaignId]);
	
		  await query('UPDATE organizations SET sent_email_count = sent_email_count + 1 WHERE id = $1', [campaignOrg.id]);
		} else {
		  throw new Error("Email not sent by AWS");
		}
	  } catch (error) {
		await query('UPDATE emails SET status = $1 WHERE id = $2', ['ERROR', email.id]);
		throw new Error("Error in sendEmail: " + error);
	  }
};

const createWorker = async (campaignId: string) => {
	const connection = await getRedisConnection();
	if (!connection) {
		console.error("Redis connection failed");
		return;
	}

	const queueName = `emailQueue-${campaignId}`;

	const worker = new Worker(
		queueName,
		async (job) => {
			const { email, campaignOrg } = job.data;
			await sendEmail(email, campaignOrg);
		},
		{
			limiter: {
				max: 1,
				duration: 1000,
			},
			concurrency: 1,
			connection,
		},
	);

	worker.on("failed", (job, err) => {
		console.error(`Job ${job?.id} failed with ${job?.attemptsMade} attempts: ${err.message}`);
	});

	console.log(`Worker created for queue: ${queueName}`);
};

export async function initializeWorkerForCampaign(campaignId: string) {
	try {
		await createWorker(campaignId);
	} catch (error) {
		console.error(`Failed to initialize worker for campaign ${campaignId}:`, error);
	}
}

export async function addEmailToQueue(email: { senderId: string; leadId: string; subject: string; bodyHTML: string; replyToEmail: string; id: string; emailCampaignId: string; }, campaignOrg: string, campaignId: string, interval: number, index: number) {
	const connection = await getRedisConnection();
	if (!connection) {
		console.error("Redis connection failed");
		return;
	}
	const queueName = `emailQueue-${campaignId}`;
	const emailQueue = new Queue(queueName, { connection });

	// Calculate delay based on the job's index in the batch
	const delay = index * interval * 1000;

	await emailQueue.add(
		email.id,
		{ email, campaignOrg },
		{
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 3, // Total attempts including the first try and two retries
			delay: delay,
			backoff: {
				type: "exponential", // Exponential backoff strategy
				delay: 1000, // Initial delay of 1 second
			},
		},
	);
}
