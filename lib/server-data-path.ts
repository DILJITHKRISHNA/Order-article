import { constants as fsConstants, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

let cachedDataDirectory: string | null = null;
let writableDirectoryChecked = false;

export async function getWritableDataDirectory(): Promise<string | null> {
  if (writableDirectoryChecked) {
    return cachedDataDirectory;
  }

  writableDirectoryChecked = true;

  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(os.tmpdir(), "order-management-data"),
  ];

  for (const directory of candidates) {
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.access(directory, fsConstants.W_OK);

      const testFile = path.join(directory, ".write-test");
      await fs.writeFile(testFile, "ok", "utf8");
      await fs.unlink(testFile);

      cachedDataDirectory = directory;
      return directory;
    } catch {
      continue;
    }
  }

  cachedDataDirectory = null;
  return null;
}

export async function getWritableDataFilePath(
  filename: string
): Promise<string | null> {
  const directory = await getWritableDataDirectory();
  if (!directory) return null;
  return path.join(directory, filename);
}
