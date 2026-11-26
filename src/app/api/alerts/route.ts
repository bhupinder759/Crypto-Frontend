import { proxyJson } from "@/lib/api/route-response";

export function GET(request: Request) {
  return proxyJson(request, "/api/v1/alerts");
}

export function POST(request: Request) {
  return proxyJson(request, "/api/v1/alerts");
}
