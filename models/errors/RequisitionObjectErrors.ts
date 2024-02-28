export class IncompleteRequisitionObjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncompleteRequisitionObjectError';
  }
}
