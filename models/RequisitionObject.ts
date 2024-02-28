import { UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getFirstPerson, getId, getLastEditedTime, getNumber, getRichText, getStatusName, getTitle, getUrl } from "../utils/NotionDatabaseUtils.js";
import { IncompleteRequisitionObjectError } from "./errors/RequisitionObjectErrors.js";
import { OrderStatus } from "./OrderStatus.js";
import { isRequisitionObjectPageResponse } from "./RequisitionObjectPageResponse.js";

export type RequisitionObject = {
  orderId: string;
  lastEditedTime: string;
  description: string;
  submitter: UserObjectResponse;
  status: OrderStatus;
  productName: string;
  quantity: number;
  subtotal: number;
  approver: UserObjectResponse | null;
  approverNote: string | null;
  productLink: string;
  trackingLink: string | null;
};

export function toRequisitionObject(obj: any): RequisitionObject {  
  if (!isRequisitionObjectPageResponse(obj)) {
    throw new TypeError("Input object is not of type RequisitionObjectPageResponse");
  }

  const props = obj.properties;
  const orderId = getId(props.ID);
  const lastEditedTime = getLastEditedTime(props["Last edited time"]);
  const description = getTitle(props["Order Description"]);
  const submitter = getFirstPerson(props.Submitter);
  const status = getStatusName(props.Status);
  const productName = getRichText(props["Product Name"]);
  const quantity = getNumber(props.Quantity);
  const subtotal = getNumber(props.Subtotal);
  const approver = getFirstPerson(props.Approver);
  const approverNote = getRichText(props["Approver's Note"]);
  const productLink = getUrl(props["Product Link"]);
  const trackingLink = getUrl(props["Order Tracking Link"]);

  const requiredFields = [orderId, lastEditedTime, description, submitter, status, productName, quantity, subtotal, productLink];
  
  if (orderId == null || lastEditedTime == null || description == null || submitter == null || status == null || productName == null || quantity == null || subtotal == null || productLink == null) {
    throw new IncompleteRequisitionObjectError("Missing required RequisitionObject fields: " + JSON.stringify(requiredFields));
  }

  return {
    orderId: orderId.toString(),
    lastEditedTime: lastEditedTime,
    description: description,
    submitter: submitter,
    status: status as OrderStatus,
    productName: productName,
    quantity: quantity,
    subtotal: subtotal,
    approver: approver,
    approverNote: approverNote,
    productLink: productLink,
    trackingLink: trackingLink,
  };
}
