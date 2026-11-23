"use client";
/** Fired after ONE order is confirmed (not bulk) → opens the delivery-guide WhatsApp popup. */
export const CONFIRMED_EVENT = "homiqo:order-confirmed";
export const announceConfirmed = (orderId: string) => window.dispatchEvent(new CustomEvent(CONFIRMED_EVENT, { detail: { id: orderId } }));
