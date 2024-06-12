

import { SendEmailCommand, SESClient, SESClientConfig } from "@aws-sdk/client-ses";

const sesClient: SESClient = new SESClient({
	region: process.env.S3_REGION,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
	},
} as SESClientConfig);

export async function sendEmailSES(sender: string, senderName: string, recipient: string, subject: string, body: string, replyToEmail?: string) {
	const sendEmailCommand = new SendEmailCommand({
		Destination: {
			/* required */
			CcAddresses: [
				/* more items */
			],
			ToAddresses: [
				/* more To-email addresses */
				// recipient,
				recipient,
			],
		},
		Message: {
			/* required */
			Body: {
				/* required */
				Html: {
					Charset: "UTF-8",
					Data: body,
				},
				// Text: {
				// 	Charset: "UTF-8",
				// 	Data: "TEXT_FORMAT_BODY",
				// },
			},
			Subject: {
				Charset: "UTF-8",
				Data: subject,
			},
		},
		Source: `${senderName} <${sender}>`,
		ReplyToAddresses: [
			/* more items */
			replyToEmail || sender,
		],
	});

	try {
		const reponse = await sesClient.send(sendEmailCommand);
		return { success: true, message: reponse };
	} catch (e: any) {
		return { success: false, message: e.message };
	}
}
