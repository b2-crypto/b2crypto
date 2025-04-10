export enum OutboxEvents {
  sendOutboxReadyForPublish = 'SEND.OUTBOX.READY.FOR.PUBLISH',
  sendOutboxLagging = 'SEND.OUTBOX.LAGGING',
  removeOutbox = 'REMOVE.OUTBOX',
}
