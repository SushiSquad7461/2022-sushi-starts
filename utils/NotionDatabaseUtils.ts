import { isFullUser } from "@notionhq/client";
import { PageObjectResponse, UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function getId(obj: Extract<PageObjectResponse["properties"][string], { type: "unique_id" }>): number | null {
  return obj.unique_id?.number ?? null;
}

export function getLastEditedTime(obj: Extract<PageObjectResponse["properties"][string], { type: "last_edited_time" }>): string | null {
  return obj.last_edited_time ?? null;
}

export function getTitle(obj: Extract<PageObjectResponse["properties"][string], { type: "title" }>): string | null {
  return obj.title?.at(0)?.plain_text ?? null;
}

export function getNumber(obj: Extract<PageObjectResponse["properties"][string], { type: "number" }>): number | null {
  return obj.number ?? null;
}

export function getFirstPerson(obj: Extract<PageObjectResponse["properties"][string], { type: "people" }>): UserObjectResponse | null {
  const firstSubmitter = obj.people.at(0);
  return firstSubmitter!= null && isFullUser(firstSubmitter) ? firstSubmitter : null;
}

export function getStatusName(obj: Extract<PageObjectResponse["properties"][string], { type: "status" }>): string | null {
  return obj.status?.name ?? null;
}

export function getRichText(obj: Extract<PageObjectResponse["properties"][string], { type: "rich_text" }>): string | null {
  return obj.rich_text.at(0)?.plain_text ?? null;
}

export function getUrl(obj: Extract<PageObjectResponse["properties"][string], { type: "url" }>): string | null {
  return obj.url;
}
