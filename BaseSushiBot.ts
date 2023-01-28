import { Client, GatewayIntentBits } from "discord.js";
import { DiscordErrorLogger } from "DiscordErrorLogger";

export type BaseSushiBotOptions = {
    token: string;
    name: string;
    logger: DiscordErrorLogger;
};

export class BaseSushiBot {
    protected client: Client;
    protected name: string;
    protected logger: DiscordErrorLogger;

    private loginPromise: Promise<string>;

    constructor(options: BaseSushiBotOptions) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
            ],
        });

        this.name = options.name;

        this.client.on('ready', () => {
            console.log(`Bot[${this.name}]: Logged in as ${this.client?.user?.tag}!`);
        });

        this.loginPromise = this.client.login(options.token);
        this.logger = options.logger;
    }

    protected async waitForLogin(): Promise<string> {
        return await this.loginPromise;
    }
}