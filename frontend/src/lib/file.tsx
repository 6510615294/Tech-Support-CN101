import { 
  FileText, FileCode, FileSpreadsheet, FileImage, 
  FileVideo, FileAudio, FileArchive, File, Presentation 
} from "lucide-react";

export function getFileIcon(mime: string, size?: number) {
  const m = mime.toLowerCase();
  if (!size) {
    size = 5
  }

  // 1. Documents (PDF & Word)
  if (m.includes("pdf")) 
    return <FileText className={`h-${size} w-${size} text-red-500`} />;
  if (m.includes("wordprocessingml") || m.includes("msword")) 
    return <FileText className={`h-${size} w-${size} text-blue-600`} />;

  // 2. Data & Code
  if (m.includes("python") || m.includes("javascript") || m.includes("typescript") || m.includes("json") || m.includes("html") || m.includes("css"))
  return <FileCode className={`h-${size} w-${size} text-yellow-600`} />;
  
  // 3. Spreadsheets (CSV & Excel)
  if (m.includes("csv") || m.includes("spreadsheetml") || m.includes("excel"))
  return <FileSpreadsheet className={`h-${size} w-${size} text-green-600`} />;

  // 4. Presentations (PowerPoint)
  if (m.includes("presentationml") || m.includes("powerpoint"))
  return <Presentation className={`h-${size} w-${size} text-orange-500`} />;

  // 5. Media (Images, Video, Audio)
  if (m.startsWith("image/")) 
  return <FileImage className={`h-${size} w-${size} text-purple-500`} />;
  if (m.startsWith("video/")) 
  return <FileVideo className={`h-${size} w-${size} text-slate-700`} />;
  if (m.startsWith("audio/")) 
  return <FileAudio className={`h-${size} w-${size} text-pink-500`} />;

  // 6. Archives (Zip, Tar)
  if (m.includes("zip") || m.includes("compressed") || m.includes("tar"))
  return <FileArchive className={`h-${size} w-${size} text-amber-700`} />;

  // 7. Plain Text
  if (m.includes("text/plain")) 
  return <FileText className={`h-${size} w-${size} text-muted-foreground`} />;

  // Default Fallback
  return <File className={`h-${size} w-${size} text-muted-foreground`} />;
}

export function getMimeBadge(mime: string): string {
  // Normalize to lowercase to avoid casing issues
  const m = mime.toLowerCase();

  // 1. Documents & Office
  if (m.includes("pdf")) return "PDF";
  if (m.includes("wordprocessingml") || m.includes("msword")) return "DOCX";
  if (m.includes("spreadsheetml") || m.includes("excel")) return "XLSX";
  if (m.includes("presentationml") || m.includes("powerpoint")) return "PPTX";
  if (m.includes("csv")) return "CSV";

  // 2. Programming & Data
  if (m.includes("python") || m.endsWith("x-python")) return "PY";
  if (m.includes("javascript") || m.includes("typescript")) return "JS/TS";
  if (m.includes("json")) return "JSON";
  if (m.includes("html")) return "HTML";
  if (m.includes("css")) return "CSS";
  if (m.includes("markdown")) return "MD";

  // 3. Images & Media
  if (m.startsWith("image/")) {
    const type = m.split("/")[1];
    return type === "jpeg" ? "JPG" : type.toUpperCase();
  }
  if (m.startsWith("video/")) return "VIDEO";
  if (m.startsWith("audio/")) return "AUDIO";

  // 4. Archives
  if (m.includes("zip") || m.includes("compressed")) return "ZIP";
  if (m.includes("tar") || m.includes("gzip")) return "TGZ";

  // 5. Plain Text fallback
  if (m.includes("text/plain")) return "TXT";

  // Default: Grab the subtype or return "FILE"
  const subtype = m.split("/")[1];
  return subtype ? subtype.toUpperCase() : "FILE";
}