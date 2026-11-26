import { proxyJson } from "@/lib/api/route-response";

export function POST(request: Request) {
  return proxyJson(request, "/api/v1/notifications/read-all");
}
