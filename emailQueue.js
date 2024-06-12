import { Queue, Worker } from "bullmq";
import { db } from "@/db";
import { sendEmailSES } from "./aws";

const sendEmail = async (email, campaignOrg) => {
	try {
		const user = await db.user.findFirst({
			where: { id: email.senderId },
		});
		if (!user) throw new Error("User not found");

		const lead = await db.lead.findFirst({
			where: { id: email.leadId },
		});
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
			await db.email.update({
				where: { id: email.id },
				data: { status: "SENT" },
			});

			await db.emailCampaign.update({
				where: { id: email.emailCampaignId },
				data: { sentEmailCount: { increment: 1 } },
			});

			await db.organization.update({
				where: { id: campaignOrg.id },
				data: { sentEmailCount: { increment: 1 } },
			});
		} else {
			throw new Error("Email not sent by AWS");
		}
	} catch (error) {
		await db.email.update({
			where: { id: email.id },
			data: { status: "ERROR" },
		});
		throw new Error("Error in sendEmail: " + error);
	}
};

const createWorker = async (campaignId) => {
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

export async function initializeWorkerForCampaign(campaignId) {
	try {
		await createWorker(campaignId);
	} catch (error) {
		console.error(`Failed to initialize worker for campaign ${campaignId}:`, error);
	}
}

export async function addEmailToQueue(email, campaignOrg, campaignId, interval, index) {
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

import { Redis } from "ioredis";

let connection = null;
export async function getRedisConnection() {
	if (process.env.REDIS_URL && !connection) {
		connection = new Redis(process.env.REDIS_URL, {
			maxRetriesPerRequest: null,
			lazyConnect: true,
		});
		connection.on("error", function (err) {
			connection = null;
		});
	}
	return connection;
}
