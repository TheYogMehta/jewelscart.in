import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/rbac";
import { uploadCatelogMedia, UploadError } from "@/lib/uploads";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file =
      formData.get("file") || formData.get("image") || formData.get("media");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Media file is required" },
        { status: 400 },
      );
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Media file must be under 100MB" },
        { status: 400 },
      );
    }

    const identifier =
      (formData.get("id") as string) ||
      (formData.get("categoryId") as string) ||
      (formData.get("identifier") as string) ||
      (formData.get("slug") as string) ||
      undefined;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadCatelogMedia(
      buffer,
      file.name,
      file.type,
      identifier,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[Category Media Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload category media" },
      { status: 500 },
    );
  }
}
