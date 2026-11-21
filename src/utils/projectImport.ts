export interface ImportedProjectFile { path: string; content: string }

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('مرورگر شما استخراج ZIP را پشتیبانی نمی‌کند. پوشه پروژه را انتخاب کنید.');
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipProject(file: File): Promise<ImportedProjectFile[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let eocd = -1;
  for (let i = Math.max(0, bytes.length - 65557); i <= bytes.length - 22; i++) {
    if (view.getUint32(i, true) === 0x06054b50) eocd = i;
  }
  if (eocd < 0) throw new Error('ساختار فایل ZIP معتبر نیست.');
  const count = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (count > 2000) throw new Error('ZIP بیش از ۲۰۰۰ فایل دارد.');
  const output: ImportedProjectFile[] = [];
  let cursor = centralOffset;
  let total = 0;
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.aistudio']);
  for (let n = 0; n < count; n++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('فهرست ZIP خراب است.');
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength)).replace(/\\/g, '/');
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!name || name.endsWith('/')) continue;
    if (/(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx)|credentials\.json)$/i.test(name) && !name.endsWith('.env.example')) continue;
    const parts = name.split('/');
    if (name.startsWith('/') || parts.some((p) => p === '..' || p === '.') || parts.some((p) => ignored.has(p))) continue;
    if (view.getUint32(localOffset, true) !== 0x04034b50) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(start, start + compressedSize);
    let content: Uint8Array;
    if (method === 0) content = compressed;
    else if (method === 8) content = await inflateRaw(compressed);
    else continue;
    total += content.length;
    if (content.length > 2 * 1024 * 1024 || total > 40 * 1024 * 1024) throw new Error('حجم پروژه از محدودیت ۴۰ مگابایت بیشتر است.');
    output.push({ path: name, content: btoa(Array.from(content, (c) => String.fromCharCode(c)).join('')) });
  }
  return output as unknown as ImportedProjectFile[];
}

export async function readFolderProject(files: FileList): Promise<Array<{ path: string; content: string }>> {
  const result: Array<{ path: string; content: string }> = [];
  let total = 0;
  for (const file of Array.from(files)) {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const path = relative.split('/').slice(1).join('/') || file.name;
    if (/(^|\/)(node_modules|\.git|dist|build|\.next|\.aistudio)(\/|$)/.test(relative)) continue;
    if (/(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx)|credentials\.json)$/i.test(relative) && !relative.endsWith('.env.example')) continue;
    if (file.size > 2 * 1024 * 1024) continue;
    total += file.size;
    if (total > 40 * 1024 * 1024 || result.length >= 2000) throw new Error('پروژه از محدودیت حجم یا تعداد فایل بیشتر است.');
    const buffer = new Uint8Array(await file.arrayBuffer());
    result.push({ path, content: btoa(Array.from(buffer, (c) => String.fromCharCode(c)).join('')) });
  }
  return result;
}
