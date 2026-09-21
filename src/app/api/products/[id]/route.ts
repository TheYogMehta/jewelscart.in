import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  deleteProduct,
  getProductById,
  updateProduct,
  revalidateProductCatalog,
  uploadProductMedia,
  UploadError,
  type MediaItem,
} from "@/lib/products";
import { verifySameOrigin } from "@/lib/security";
import { logActivity } from "@/lib/logs";
import { listCategories } from "@/lib/categories";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(50000).optional(),
  category: z.string().min(1).optional(),
  sub_category: z.string().optional().nullable(),
  child_category: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  sku: z.string().max(100).optional(),
  price: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.number().min(0).optional().nullable(),
  ),
  qty: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.number().int().min(0).optional().nullable(),
  ),
  length: z.string().max(100).optional().nullable(),
  weight: z.string().max(100).optional().nullable(),
  stock_status: z.enum(["in_stock", "out_of_stock"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let updateData: z.infer<typeof updateSchema> & {
      media?: MediaItem[];
      image?: string;
    } = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = updateSchema.safeParse({
        name: formData.get("name") || undefined,
        description: formData.get("description") || undefined,
        category: formData.get("category") || undefined,
        sub_category:
          formData.get("sub_category") || formData.get("type") || undefined,
        child_category: formData.get("child_category") || undefined,
        type: formData.get("type") || formData.get("sub_category") || undefined,
        sku: formData.get("sku") || undefined,
        price: formData.has("price") ? formData.get("price") : undefined,
        qty: formData.has("qty") ? formData.get("qty") : undefined,
        length: formData.has("length") ? formData.get("length") : undefined,
        weight: formData.has("weight") ? formData.get("weight") : undefined,
        stock_status: formData.get("stock_status") || undefined,
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }
      updateData = parsed.data;

      // Handle existing media (JSON string or multiple entries)
      let keptMedia: MediaItem[] = [];
      const existingMediaRaw = formData.get("existing_media");
      if (existingMediaRaw && typeof existingMediaRaw === "string") {
        try {
          const parsedArr = JSON.parse(existingMediaRaw);
          if (Array.isArray(parsedArr)) {
            keptMedia = parsedArr.map((item: any) => ({
              url: typeof item === "string" ? item : item.url,
              type:
                typeof item === "object" && item.type === "video"
                  ? "video"
                  : /\.(mp4|webm|mov)$/i.test(
                        typeof item === "string" ? item : item.url,
                      )
                    ? "video"
                    : "image",
            }));
          }
        } catch {}
      }

      // Handle new media files
      const rawFiles = [
        ...formData.getAll("media"),
        ...formData.getAll("image"),
      ];
      const newFiles: File[] = [];
      for (const item of rawFiles) {
        if (item instanceof File && item.size > 0) {
          newFiles.push(item);
        }
      }

      if (formData.has("existing_media") || newFiles.length > 0) {
        if (keptMedia.length + newFiles.length > 5) {
          return NextResponse.json(
            { error: "Maximum 5 media items (images or videos) allowed" },
            { status: 400 },
          );
        }

        const existing = await getProductById(id);
        const productSku =
          parsed.data.sku?.trim() || existing?.sku || `PROD-${id}`;

        const uploadedNewMedia: MediaItem[] = [];
        const baseIndex = keptMedia.length;
        const totalCount = baseIndex + newFiles.length;

        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json(
              { error: `File "${file.name}" exceeds the 100MB limit.` },
              { status: 400 },
            );
          }
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileIndex = totalCount > 1 ? baseIndex + i + 1 : undefined;
          const item = await uploadProductMedia(
            buffer,
            file.name,
            file.type,
            productSku,
            fileIndex,
          );
          uploadedNewMedia.push(item);
        }

        const finalMedia = [...keptMedia, ...uploadedNewMedia];
        if (finalMedia.length > 0) {
          updateData.media = finalMedia;
          updateData.image =
            finalMedia.find((m) => m.type === "image")?.url ||
            finalMedia[0].url;
        }
      }
    } else {
      const body = await request.json();
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }
      updateData = parsed.data;
      if (Array.isArray(body.media)) {
        updateData.media = body.media.slice(0, 5);
      }
    }

    // Validate category & sub-category if being updated
    if (updateData.category) {
      const categories = await listCategories({ fresh: true });
      const matchingCategory = categories.find(
        (c) => c.name.toLowerCase() === updateData.category!.toLowerCase(),
      );
      if (!matchingCategory) {
        return NextResponse.json(
          {
            error: `Category "${updateData.category}" does not exist. Please create it in Category Manager first.`,
          },
          { status: 400 },
        );
      }
      updateData.category = matchingCategory.name;

      const rawSub = (updateData.sub_category || updateData.type || "").trim();
      if (rawSub && matchingCategory.children?.length) {
        const matchingSub = matchingCategory.children.find(
          (s) => s.name.toLowerCase() === rawSub.toLowerCase(),
        );
        if (!matchingSub) {
          return NextResponse.json(
            {
              error: `Sub-category "${rawSub}" is not valid for "${matchingCategory.name}". Please select one of: ${matchingCategory.children.map((c) => c.name).join(", ")}`,
            },
            { status: 400 },
          );
        }
        updateData.sub_category = matchingSub.name;
        updateData.type = matchingSub.name;
      } else {
        updateData.sub_category = rawSub || null;
        updateData.type = rawSub || null;
      }
    }

    const product = await updateProduct(id, updateData as any);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    revalidateProductCatalog();

    await logActivity({
      action: "product_edit",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "product",
      targetId: String(id),
      targetName: product.name,
      details: { updatedFields: Object.keys(updateData) },
      request,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getProductById(id);
  const product = await deleteProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateProductCatalog();

  await logActivity({
    action: "product_delete",
    actorId: session.user.id ? parseInt(session.user.id, 10) : null,
    actorEmail: session.user.email,
    actorName: session.user.name,
    targetType: "product",
    targetId: String(id),
    targetName: existing?.name || `Product #${id}`,
    details: { sku: existing?.sku },
    request,
  });

  return NextResponse.json({ ok: true });
}
