"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getZoneLabel, type Zone } from "@/lib/zones";

type ArticleFileInfo =
  | { exists: false }
  | {
      exists: true;
      source: "uploaded" | "default";
      sizeBytes: number;
      updatedAt: string | null;
      articleCount: number | null;
      parseError: string | null;
    };

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArticleSheetCard({ zone }: { zone: Zone }) {
  const [file, setFile] = useState<ArticleFileInfo | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/articles", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed");
        const data = (await response.json()) as { file: ArticleFileInfo };
        if (!cancelled) setFile(data.file);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load article sheet info");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (selected: File | undefined) => {
    if (!selected) return;
    setIsBusy(true);

    try {
      const form = new FormData();
      form.append("file", selected);
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = (await response.json()) as {
        error?: string;
        file?: ArticleFileInfo;
      };

      if (!response.ok || !data.file) {
        throw new Error(data.error ?? "Upload failed");
      }

      setFile(data.file);
      toast.success("Article sheet uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete the current article sheet for this zone?")) {
      return;
    }
    setIsBusy(true);

    try {
      const response = await fetch("/api/admin/articles", {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await response.json()) as {
        error?: string;
        file?: ArticleFileInfo;
      };

      if (!response.ok || !data.file) {
        throw new Error(data.error ?? "Delete failed");
      }

      setFile(data.file);
      toast.success("Article sheet deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsBusy(false);
    }
  };

  const canDelete = file?.exists === true && file.source === "uploaded";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5" />
          Article Sheet – {getZoneLabel(zone)}
        </CardTitle>
        <CardDescription>
          Users in this zone see articles from this Excel file. It needs a
          &quot;size&quot; and a &quot;split&quot; sheet with Article, Color and
          Size columns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {file === null ? null : file.exists ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={file.source === "uploaded" ? "secondary" : "outline"}>
              {file.source === "uploaded" ? "Uploaded file" : "Bundled default"}
            </Badge>
            <Badge variant="outline">{formatBytes(file.sizeBytes)}</Badge>
            {file.articleCount !== null ? (
              <Badge variant="outline">{file.articleCount} articles</Badge>
            ) : null}
            {file.updatedAt ? (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(file.updatedAt).toLocaleString()}
              </span>
            ) : null}
            {file.parseError ? (
              <Badge variant="destructive">{file.parseError}</Badge>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No article sheet uploaded yet. Users in this zone cannot place
            orders until you upload one.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            {file?.exists ? "Replace Excel" : "Upload Excel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy || !canDelete}
            onClick={() => void handleDelete()}
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
