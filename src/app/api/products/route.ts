import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  createProduct,
  getNextSku,
  listProducts,
  revalidateProductCatalog,
  uploadProductMedia,
  UploadError,
  type MediaItem,
} from "@/lib/products";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";
import { listCategories } from "@/lib/categories";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(50000).optional(),
  category: z.string().min(1),
  sub_category: z.string().optional().nullable(),
  child_category: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  sku: z.string().max(100).optional(),
  price: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.number().min(0).optional(),
  ),
  qty: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.number().int().min(0).optional(),
  ),
  length: z.string().max(100).optional(),
  weight: z.string().max(100).optional(),
  stock_status: z.enum(["in_stock", "out_of_stock"]).default("out_of_stock"),
});

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
    const parsed = productSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      category: formData.get("category"),
      sub_category:
        formData.get("sub_category") || formData.get("type") || undefined,
      child_category: formData.get("child_category") || undefined,
      type: formData.get("type") || formData.get("sub_category") || undefined,
      sku: formData.get("sku") || undefined,
      price: formData.get("price") || undefined,
      qty: formData.get("qty") || undefined,
      length: formData.get("length") || undefined,
      weight: formData.get("weight") || undefined,
      stock_status: formData.get("stock_status") || "out_of_stock",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    // Verify category exists in database
    const categories = await listCategories({ fresh: true });
    const matchingCategory = categories.find(
      (c) => c.name.toLowerCase() === parsed.data.category.toLowerCase(),
    );

    if (!matchingCategory) {
      return NextResponse.json(
        {
          error: `Category "${parsed.data.category}" does not exist. Please create it in Category Manager first.`,
        },
        { status: 400 },
      );
    }

    // Verify sub-category if provided
    const rawSub = (parsed.data.sub_category || parsed.data.type || "").trim();
    let finalType = rawSub || undefined;
    if (
      rawSub &&
      matchingCategory.children &&
      matchingCategory.children.length > 0
    ) {
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
      finalType = matchingSub.name;
    }

    // Handle uploaded media files (up to 5 max)
    const rawFiles = [...formData.getAll("media"), ...formData.getAll("image")];
    const mediaFiles: File[] = [];

    for (const item of rawFiles) {
      if (item instanceof File && item.size > 0) {
        mediaFiles.push(item);
      }
    }

    if (mediaFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one product image or video is required" },
        { status: 400 },
      );
    }

    if (mediaFiles.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 media items (images or videos) allowed" },
        { status: 400 },
      );
    }

    const productSku = parsed.data.sku?.trim() || (await getNextSku());

    const uploadedMedia: MediaItem[] = [];
    const mediaCount = mediaFiles.length;
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 100MB limit.` },
          { status: 400 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const item = await uploadProductMedia(
        buffer,
        file.name,
        file.type,
        productSku,
        mediaCount > 1 ? i + 1 : undefined,
      );
      uploadedMedia.push(item);
    }

    const product = await createProduct({
      ...parsed.data,
      sku: productSku,
      category: matchingCategory.name,
      sub_category: finalType || null,
      child_category: parsed.data.child_category || null,
      type: finalType || null,
      media: uploadedMedia,
      image: uploadedMedia[0].url,
    });
    revalidateProductCatalog();

    await logActivity({
      action: "product_create",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "product",
      targetId: String(product._id),
      targetName: product.name,
      details: {
        category: product.category,
        type: product.type,
        sku: product.sku,
        price: product.price,
        qty: product.qty,
        mediaCount: uploadedMedia.length,
      },
      request,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await listProducts(undefined, { fresh: true });
  return NextResponse.json(products);
}
