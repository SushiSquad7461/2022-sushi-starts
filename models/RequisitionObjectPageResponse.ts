import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { orderFormKeys } from "../utils/NotionDatabaseConstants.js";

export interface RequisitionObjectPageResponse {
  properties: {
    "ID": Extract<PageObjectResponse["properties"][string], { type: "unique_id" }>,
    "Last edited time": Extract<PageObjectResponse["properties"][string], { type: "last_edited_time" }>,
    "Order Description": Extract<PageObjectResponse["properties"][string], { type: "title" }>,
    "Submitter": Extract<PageObjectResponse["properties"][string], { type: "people" }>,
    "Status": Extract<PageObjectResponse["properties"][string], { type: "status" }>,
    "Product Name": Extract<PageObjectResponse["properties"][string], { type: "rich_text" }>,
    "Quantity": Extract<PageObjectResponse["properties"][string], { type: "number" }>,
    "Subtotal": Extract<PageObjectResponse["properties"][string], { type: "number" }>,
    "Approver": Extract<PageObjectResponse["properties"][string], { type: "people" }>,
    "Approver's Note": Extract<PageObjectResponse["properties"][string], { type: "rich_text" }>,
    "Product Link": Extract<PageObjectResponse["properties"][string], { type: "url" }>,
    "Order Tracking Link": Extract<PageObjectResponse["properties"][string], { type: "url" }>,
  }
}

export function isRequisitionObjectPageResponse(obj: any): obj is RequisitionObjectPageResponse {
  const orderProperties = obj.properties;

  return orderProperties !== null &&
    orderProperties[orderFormKeys.id].type ===  "unique_id" && 
    orderProperties[orderFormKeys.lastEditedTime].type === "last_edited_time" &&
    orderProperties[orderFormKeys.description].type === "title" &&
    orderProperties[orderFormKeys.submitter].type === "people" &&
    orderProperties[orderFormKeys.status].type === "status" &&
    orderProperties[orderFormKeys.productName].type === "rich_text" &&
    orderProperties[orderFormKeys.quantity].type === "number" &&
    orderProperties[orderFormKeys.subtotal].type === "number" &&
    orderProperties[orderFormKeys.approver].type === "people" &&
    orderProperties[orderFormKeys.approverNote].type === "rich_text" &&
    orderProperties[orderFormKeys.productLink].type === "url" &&
    orderProperties[orderFormKeys.trackingLink].type === "url";
}
