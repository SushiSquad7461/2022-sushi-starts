import { CreatePageResponse, GetPageResponse, PageObjectResponse, PartialPageObjectResponse, PartialUserObjectResponse, QueryDatabaseParameters, QueryDatabaseResponse, UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Client } from "@notionhq/client";
import { config } from "./Environment.js";
import { ClientOptions } from "@notionhq/client/build/src/Client";

type NotionUser = PartialUserObjectResponse | UserObjectResponse;

export type DiscordTag = string;

export type RosterEntry = {
    name: string;
    discordTag?: string;
    notionUser?: NotionUser;
};

export class NotionClient {
    private client: Client;
    private rosterEntryCache: Array<RosterEntry>;

    constructor(options: ClientOptions) {
        this.client = new Client(options);
        this.rosterEntryCache = [];
    }

    private createRosterEntry(notionData: GetPageResponse): RosterEntry {
        if (!("properties" in notionData)) {
            throw new Error(`Roster entry did not have properties`);
        }

        const nameProperty = notionData.properties.Name;
        const discordTagProperty = notionData.properties["Discord Tag"];
        const notionUserProperty = notionData.properties["Notion User"];

        if (nameProperty?.type !== "title" || discordTagProperty?.type !== "rich_text" || notionUserProperty?.type !== "people") {
            throw new Error(`Roster entry did not contain the right properties.`);
        }

        const rosterEntry = {
            name: nameProperty.title[0]?.plain_text ?? "",
            discordTag: discordTagProperty.rich_text[0]?.plain_text,
            notionUser: notionUserProperty.people[0],
        };

        if (rosterEntry.name === "") {
            throw new Error(`Roster entry is empty`);
        }

        this.rosterEntryCache.push(rosterEntry);

        return rosterEntry;
    }

    private async createRosterEntryFromNotionResponse(response: QueryDatabaseResponse): Promise<RosterEntry> {
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

    public async getRosterEntryFromDiscordTag(tag: DiscordTag): Promise<RosterEntry> {
        const entryFromCache = this.rosterEntryCache.find((entry) => entry.discordTag === tag);

        if (entryFromCache != null) return entryFromCache;

        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": "Discord Tag",
                    "rich_text": {
                        "contains": tag,
                    },
                },
            });

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for Discord tag "${tag}"`, error);
        }
    }

    public async getRosterEntryFromName(name: string): Promise<RosterEntry> {
        const entryFromCache = this.rosterEntryCache.find((entry) => entry.name === name);

        if (entryFromCache != null) return entryFromCache;

        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": "Name",
                    "rich_text": {
                        "contains": name,
                    },
                },
            });

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for name "${name}"`, error);
        }
    }

    public async getRosterEntryFromNotionUser(user: NotionUser): Promise<RosterEntry> {
        const entryFromCache = this.rosterEntryCache.find((entry) => entry.notionUser === user);

        if (entryFromCache != null) return entryFromCache;

        try {
            const response = await this.client.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": "Notion User",
                    "people": {
                        "contains": user.id,
                    },
                },
            });

            return await this.createRosterEntryFromNotionResponse(response);
        } catch (error) {
            throw new Error(`Could not fetch roster entry for user ID "${user.id}"`, error);
        }
    }

    public async logAttendance(isLeaving: boolean, discordTag: string): Promise<void> {
        try {
            const user = await this.getRosterEntryFromDiscordTag(discordTag);

            if (!user.notionUser) {
                console.warn(`NotionClient: Notion user was not present for Discord tag "${discordTag}".`);
                return;
            }

            await this.client.pages.create({
                parent: {
                    database_id: config.notion.attendanceLogDatabaseId,
                },
                properties: {
                    Leaving: {
                        type: "checkbox",
                        checkbox: isLeaving,
                    },
                    Person: {
                        type: "people",
                        people: [
                            user.notionUser
                        ],
                    },
                },
            });
        } catch (error) {
            throw new Error(`Error logging attendance for Discord tag "${discordTag}".`, error);
        }
    }

    private getEngineeringNotebookTitle(date: Date): string {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    public async getEngineeringNotebookEntry(date: Date): Promise<GetPageResponse | null> {
        const name = this.getEngineeringNotebookTitle(date);

        const queryResponse = await this.client.databases.query({
            database_id: config.notion.engineeringNotebookDatabaseId,
            filter: {
                "property": "Name",
                "rich_text": {
                    "contains": name,
                },
            },
        });

        if (queryResponse.results.length === 0 || queryResponse.results[0] == null || !("properties" in queryResponse.results[0])) {
            return null;
        }

        return queryResponse.results[0];
    }

    public async createEngineeringNotebookEntry(date: Date): Promise<CreatePageResponse> {
        const name = this.getEngineeringNotebookTitle(date);

        return await this.client.pages.create({
            parent: {
                database_id: config.notion.engineeringNotebookDatabaseId,
            },
            icon: {
                type: "emoji",
                emoji: "📝",
            },
            properties: {
                Name: {
                    type: "title",
                    title: [
                        {
                            text: { content: name },
                        },
                    ],
                },
            },
        });
    }

    private async getOrCreateEngineeringNotebookEntry(date: Date): Promise<PageObjectResponse | PartialPageObjectResponse> {
        const entry = await this.getEngineeringNotebookEntry(date);

        if (entry == null) {
            return this.createEngineeringNotebookEntry(date);
        } else {
            return entry;
        }
    }

    public async getAttendees(engNotebookPage: PageObjectResponse | PartialPageObjectResponse): Promise<{ attendees: RosterEntry[]; lateAttendees: RosterEntry[]; }> {
        if (engNotebookPage == null || !("properties" in engNotebookPage)) {
            return {
                attendees: [],
                lateAttendees: [],
            };
        }

        if (engNotebookPage.properties["Late Attendees"] == null || engNotebookPage.properties["Attendees"] == null ||
            engNotebookPage.properties["Late Attendees"].type !== "people" || engNotebookPage.properties["Attendees"].type !== "people") {
            throw new Error(`Engineering notebook entry did not have the correct attendance properties.`);
        }

        const lateAttendees = await Promise.all(
            engNotebookPage.properties["Late Attendees"].people.map(
                user => this.getRosterEntryFromNotionUser(user)));

        const attendees = await Promise.all(
            engNotebookPage.properties.Attendees.people.map(
                user => this.getRosterEntryFromNotionUser(user)));

        return {
            attendees,
            lateAttendees,
        };
    }

    public async markPresent(tag: DiscordTag, date: Date): Promise<void> {
        const engNotebookPage = await this.getOrCreateEngineeringNotebookEntry(date);
        const rosterEntry = await this.getRosterEntryFromDiscordTag(tag);
        const attendees = await this.getAttendees(engNotebookPage);

        const findAttendeeByTag = (attendee: RosterEntry): boolean => attendee.discordTag === tag;

        if (attendees.attendees.find(findAttendeeByTag) || attendees.lateAttendees.find(findAttendeeByTag)) return;

        const pageId = engNotebookPage.id;
        const day = date.getDay();
        const time = date.getHours();

        const isOnTime = ((day > 0 && day < 6) && (time < 16)) || (day === 6 && time < 11);
        const attendeeProperty = isOnTime ? "Attendees" : "Late Attendees";

        const attendeeList = [
            ...(isOnTime ? attendees.attendees : attendees.lateAttendees),
            rosterEntry
        ].map(entry => entry.notionUser).filter((user: NotionUser | undefined): user is NotionUser => user !== null);

        await this.client.pages.update({
            page_id: pageId,
            properties: {
                [attendeeProperty]: {
                    type: "people",
                    people: attendeeList,
                },
            },
        });
    }

    public async logPing(leaving: boolean, tag: DiscordTag): Promise<void> {
        const user = await this.getRosterEntryFromDiscordTag(tag);

        if (user.notionUser == null) {
            console.log("user is not in team roster");
            return;
        }

        await this.client.pages.create({
            parent: {
                database_id: config.notion.attendanceLogDatabaseId,
            },
            properties: {
                Leaving: {
                    type: "checkbox",
                    checkbox: leaving,
                },
                Person: {
                    type: "people",
                    people: [user.notionUser],
                },
            },
        });
    }

    public async queryDatabase(queryOptions: QueryDatabaseParameters): Promise<QueryDatabaseResponse> {
        return this.client.databases.query(queryOptions);
    }
}