import { Client, Intents } from "discord.js";

export class BaseSushiBot {
    protected client: Client;
    protected name: string;

    private loginPromise: Promise<string>;

    constructor(options: {
        token: string,
        name: string,
    }) {
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
            ],
        });

        this.name = options.name;

        this.client.on('ready', () => {
            console.log(`Bot[${this.name}]: Logged in as ${this.client?.user?.tag}!`);
        });

        this.loginPromise = this.client.login(options.token);
    }

    protected async waitForLogin(): Promise<string> {
        return await this.loginPromise;
    }
}