import { redirect } from "next/navigation";
import { DEFAULT_SYMBOL } from "@/lib/constants/config";

export default function TradingIndexPage() {
  redirect(`/trading/${DEFAULT_SYMBOL}`);
}
