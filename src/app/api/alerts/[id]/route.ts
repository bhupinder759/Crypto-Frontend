import { proxyJson } from "@/lib/api/route-response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyJson(request, `/api/v1/alerts/${encodeURIComponent(id)}`);
}
