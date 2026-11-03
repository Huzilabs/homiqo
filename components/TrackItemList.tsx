"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/types";

/** Fires the GA4 view_item_list event once for a product listing. */
export default function TrackItemList({ listId, listName, products }: { listId: string; listName: string; products: Product[] }) {
  useEffect(() => {
    if (products.length) track.viewItemList(listId, listName, products);
  }, [listId, listName, products]);
  return null;
}
