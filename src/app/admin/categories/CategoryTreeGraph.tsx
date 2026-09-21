"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CategoryDocument } from "@/lib/categories";

interface Props {
  initialCategories: CategoryDocument[];
  onCategoryCreated?: (newCat: CategoryDocument) => void;
  onCategoryUpdated?: (updatedCat: CategoryDocument) => void;
  onCategoryDeleted?: (deletedId: number) => void;
}

export function CategoryTreeGraph({ initialCategories }: Props) {
  const router = useRouter();
  const [categories, setCategories] =
    useState<CategoryDocument[]>(initialCategories);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryDocument | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 4000);
    },
    [],
  );

  const findParentAndSiblings = (
    nodes: CategoryDocument[],
    targetId: number,
  ): {
    parent: CategoryDocument | null;
    siblings: CategoryDocument[];
  } | null => {
    const rootIndex = nodes.findIndex((n) => n.id === targetId);
    if (rootIndex !== -1) {
      return { parent: null, siblings: nodes };
    }

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childIndex = node.children.findIndex((c) => c.id === targetId);
        if (childIndex !== -1) {
          return { parent: node, siblings: node.children };
        }
        const deepFound = findParentAndSiblings(node.children, targetId);
        if (deepFound) return deepFound;
      }
    }
    return null;
  };

  const handleMoveSibling = async (
    node: CategoryDocument,
    direction: "up" | "down",
  ) => {
    const parentInfo = findParentAndSiblings(categories, node.id);
    if (!parentInfo) return;

    const { parent, siblings } = parentInfo;
    const currentIndex = siblings.findIndex((s) => s.id === node.id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const newSiblings = [...siblings];
    const [moved] = newSiblings.splice(currentIndex, 1);
    newSiblings.splice(targetIndex, 0, moved);

    const siblingOrders = newSiblings.map((cat, order) => ({
      id: cat.id,
      order,
    }));

    if (parent === null) {
      setCategories(newSiblings);
    } else {
      const updateTree = (
        treeNodes: CategoryDocument[],
      ): CategoryDocument[] => {
        return treeNodes.map((n) => {
          if (n.id === parent.id) {
            return { ...n, children: newSiblings };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: updateTree(n.children) };
          }
          return n;
        });
      };
      setCategories((prev) => updateTree(prev));
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/categories/reposition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          newParentId: node.parent_id ?? null,
          siblingOrders,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reorder categories");
      }

      showNotification(
        "success",
        `Swapped "${node.name}" with "${siblings[targetIndex].name}".`,
      );
      router.refresh();

      const freshRes = await fetch("/api/categories?fresh=true");
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setCategories(freshData);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reorder categories";
      showNotification("error", msg);
      const freshRes = await fetch("/api/categories?fresh=true");
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setCategories(freshData);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (cat: CategoryDocument) => {
    setDeletingCategory(cat);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingCategory) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      showNotification(
        "success",
        `Category "${deletingCategory.name}" deleted.`,
      );
      setDeleteModalOpen(false);
      router.refresh();

      const freshRes = await fetch("/api/categories?fresh=true");
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setCategories(freshData);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete category";
      showNotification("error", msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleVisibility = async (node: CategoryDocument) => {
    const newStatus = !node.show_in_header;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/categories/${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_in_header: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update visibility");
      }

      const updateNodeVisibility = (
        list: CategoryDocument[],
      ): CategoryDocument[] => {
        return list.map((item) => {
          if (item.id === node.id) {
            return { ...item, show_in_header: newStatus };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateNodeVisibility(item.children) };
          }
          return item;
        });
      };

      setCategories((prev) => updateNodeVisibility(prev));
      showNotification(
        "success",
        `Category "${node.name}" is now ${newStatus ? "visible" : "hidden"}.`,
      );
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update category visibility";
      showNotification("error", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const renderNode = (
    node: CategoryDocument,
    depth = 0,
    siblingsList: CategoryDocument[] = categories,
  ) => {
    const hasChildren = node.children && node.children.length > 0;
    const siblingIndex = siblingsList.findIndex((s) => s.id === node.id);
    const isFirstSibling = siblingIndex <= 0;
    const isLastSibling = siblingIndex === siblingsList.length - 1;

    return (
      <div key={node.id} className="relative flex flex-col my-1.5">
        <div className="flex items-center gap-3">
          {/* Node Card */}
          <div
            className={`group relative flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-150 shadow-2xs select-none ${
              depth === 0
                ? "border-stone-300/80 bg-white hover:border-gold/60 hover:shadow-xs"
                : "border-stone-200/90 bg-stone-50/90 hover:border-gold/50 hover:bg-white"
            }`}
            style={{ minWidth: "260px", maxWidth: "420px" }}
          >
            {/* Category Name & Badge */}
            <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
              <span
                className={`truncate font-medium tracking-wide ${
                  depth === 0
                    ? "font-display text-base text-stone-900"
                    : "text-xs font-semibold text-stone-800"
                }`}
                title={node.name}
              >
                {node.name}
              </span>

              {hasChildren && (
                <span className="shrink-0 rounded-full bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                  {node.children.length}
                </span>
              )}

              {!node.show_in_header && (
                <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 border border-amber-200/80">
                  Hidden
                </span>
              )}
            </div>

            {/* Action Buttons: Reorder (Up/Down) & Edit/Delete/Add */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
              {/* Move Up Button */}
              <button
                type="button"
                disabled={isFirstSibling || isSaving}
                onClick={() => handleMoveSibling(node, "up")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-amber-50 hover:text-gold disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition cursor-pointer disabled:cursor-not-allowed"
                title={
                  isFirstSibling
                    ? "Already at top"
                    : "Move up (swap with previous)"
                }
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                  />
                </svg>
              </button>

              {/* Move Down Button */}
              <button
                type="button"
                disabled={isLastSibling || isSaving}
                onClick={() => handleMoveSibling(node, "down")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-amber-50 hover:text-gold disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition cursor-pointer disabled:cursor-not-allowed"
                title={
                  isLastSibling
                    ? "Already at bottom"
                    : "Move down (swap with next)"
                }
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              <div className="h-4 w-px bg-stone-200 mx-0.5" />

              {/* Add Sub-category (+) */}
              <Link
                href={`/admin/categories/new?parent_id=${node.id}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                title={`Add sub-category under ${node.name}`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </Link>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleToggleVisibility(node)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer disabled:opacity-50 ${
                  node.show_in_header
                    ? "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    : "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-800"
                }`}
                title={
                  node.show_in_header
                    ? `Category is visible. Click to hide "${node.name}".`
                    : `Category is hidden. Click to unhide "${node.name}".`
                }
                aria-label={
                  node.show_in_header ? "Hide category" : "Unhide category"
                }
              >
                {node.show_in_header ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                )}
              </button>

              {/* Edit Icon -> Direct to full category edit page */}
              <Link
                href={`/admin/categories/${node.id}/edit`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-amber-50 hover:text-gold transition cursor-pointer"
                title="Edit Category & Banner Details"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </Link>

              {/* Delete Icon */}
              <button
                type="button"
                onClick={() => openDeleteModal(node)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                title="Delete Category"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Child Connector Arrow/Line */}
          {hasChildren && (
            <div className="flex items-center text-stone-300">
              <svg
                className="h-4 w-6 text-stone-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M4 12h14m-4-5l5 5-5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Child Subtree Branches */}
        {hasChildren && (
          <div className="relative ml-8 pl-6 border-l-2 border-stone-200/80 mt-2 space-y-2">
            {node.children.map((child) =>
              renderNode(child, depth + 1, node.children),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Categories Catalogue
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Saving Status Badge */}
          {isSaving && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200/80 shadow-2xs animate-pulse">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Updating order...</span>
            </div>
          )}

          {/* Add Root Category Button */}
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light transition cursor-pointer"
            title="Create a new root category"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>Add Root Category</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm shadow-sm border transition-all ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Tree Graph Container */}
      <div className="relative rounded-3xl border border-stone-200/80 bg-white/70 backdrop-blur-xs p-6 sm:p-8 shadow-2xs overflow-x-auto min-h-112.5 transition-all duration-200">
        {/* Tree Nodes */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold text-stone-800">
              No categories configured yet
            </p>
            <p className="mt-1 text-xs text-stone-500 max-w-sm">
              Get started by clicking &quot;Add Root Category&quot; to build
              your jewellery taxonomy.
            </p>
            <Link
              href="/admin/categories/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition cursor-pointer"
            >
              + Create First Category
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((rootNode) => renderNode(rootNode, 0, categories))}
          </div>
        )}
      </div>

      {/* delete modal */}
      {deleteModalOpen && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900">
                Delete Category
              </h3>
            </div>

            <p className="text-sm text-stone-600">
              Are you sure you want to delete{" "}
              <strong className="text-stone-900">
                &quot;{deletingCategory.name}&quot;
              </strong>
              ?
            </p>

            {deletingCategory.children &&
              deletingCategory.children.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                  <strong>Warning:</strong> This category has{" "}
                  <strong>{deletingCategory.children.length}</strong>{" "}
                  sub-categories. Deleting it will also delete or orphan all of
                  its child categories.
                </div>
              )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteSubmit}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
