import { APIMessage, MessagePayload, WebhookClient, WebhookCreateMessageOptions } from "discord.js";

export class DiscordErrorLogger {
    private loggerWebhookClient: WebhookClient;

    constructor(url: string) {
        this.loggerWebhookClient = new WebhookClient({ url });
    }

    private async logMessage(payload: string | MessagePayload | WebhookCreateMessageOptions): Promise<APIMessage> {
        return await this.loggerWebhookClient.send(payload);
    }

    public async error(message: string, error: Error): Promise<void> {
        console.error(message, error);
        const payload = message + "\n" + "```\n" + error.stack + "```";

        await this.logMessage(payload);
    }

    public async warning(message: string): Promise<void> {
        console.warn(message);
        await this.logMessage(message);
    }
}