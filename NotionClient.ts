import { DatabasesQueryParameters, DatabasesQueryResponse, PagesRetrieveResponse } from "@notionhq/client/build/src/api-endpoints";
import { PeoplePropertyValue, RichTextPropertyValue, TitlePropertyValue, User } from "@notionhq/client/build/src/api-types";
import Client, { ClientOptions } from "@notionhq/client/build/src/Client";
import { config } from "Environment";

export type RosterEntry = {
    name: string;
    discordTag?: string;
    notionUser?: User;
};

export class NotionClient {
    private client: Client;

    constructor(options: ClientOptions) {
        this.client = new Client(options);
    }

    private createRosterEntry(notionData: PagesRetrieveResponse): RosterEntry {
        const nameProperty = notionData.properties.Name as TitlePropertyValue | undefined;
        const discordTagProperty = notionData.properties["Discord Tag"] as RichTextPropertyValue | undefined;
        const notionUserProperty = notionData.properties["Notion User"] as PeoplePropertyValue | undefined;

        const rosterEntry = {
            name: nameProperty?.title[0]?.plain_text ?? "",
            discordTag: discordTagProperty?.rich_text[0]?.plain_text,
            notionUser: notionUserProperty?.people[0],
        };

        if (rosterEntry.name === "") {
            throw new Error(`Roster entry is empty`);
        }

        return rosterEntry;
    }

    private async createRosterEntryFromNotionResponse(response: DatabasesQueryResponse): Promise<RosterEntry> {
        if (response.results.length === 0) {
            throw new Error(`Query for roster entry returned 0 results`);
        }

        const userRosterPageId = response.results[0]?.id;
    
        if (userRosterPageId != null) {
            try {
                const rosterEntry = await this.client.pages.retrieve({ page_id: userRosterPageId });
                return this.createRosterEntry(rosterEntry);
            } catch (error) {
                throw new Error(`Fetch failed for Notion roster entry with ID ${userRosterPageId}`);
            }
        } else {
            throw new Error(`Could not find the roster entry page ID`);
        }
    }

    public async getRosterEntryFromDiscordTag(tag: string): Promise<RosterEntry> {
        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": 'Discord Tag',
                    "text": {
                        "contains": tag,
                    }
                },
            })

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for Discord tag "${tag}"`, error);
        }
    }

    public async getRosterEntryFromName(name: string): Promise<RosterEntry> {
        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": "Name",
                    "text": {
                        "contains": name,
                    }
                },
            })

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for name "${name}"`, error);
        }
    }

    public async getRosterEntryFromNotionUser(user: User): Promise<RosterEntry> {
        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": "Notion User",
                    "people": {
                        "contains": user.id,
                    }
                },
            })

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for user ID "${user.id}"`, error);
        }
    }

    public async queryDatabase(queryOptions: DatabasesQueryParameters): Promise<DatabasesQueryResponse> {
        return this.client.databases.query(queryOptions);
    }
}