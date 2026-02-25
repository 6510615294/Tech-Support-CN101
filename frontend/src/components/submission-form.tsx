"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CloudUpload, Edit2, Upload, X, FileText, Download } from "lucide-react";
import { useParams } from "next/navigation";

const formSchema = z.object({
  file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Comment = {
  id: string;
  comment: string;
  commentator: string;
  visible: boolean;
};

type Submission = {
  id: string;
  submitter: string;
  answer: string | null;
  point: number;
  graded_by: string | null;
  attachment_id: string;
  file_name: string;
  comments: Comment[];
};

type SubmissionFormProps = {
  submission: Submission | null;
  maxPoint:   number;
  isLoading?: boolean;
  onUpdate?: () => void;
};

export default function SubmissionForm({ 
  submission, 
  maxPoint,
  isLoading = false,
  onUpdate 
}: SubmissionFormProps) {
  const { course_id, assignment_id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: null,
    },
  });

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      if (selected.size > 1024 * 1024) {
        alert("File size must be less than 1 MB");
        return;
      }
      setFile(selected);
      form.setValue("file", selected);
    }
  };

  const handleCancel = () => {
    setFile(null);
    form.setValue("file", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    console.log("TEST1")
    // if (!submission) return;

    // const token = localStorage.getItem("token");
    // try {
    //   const res = await fetch(
    //     `${process.env.NEXT_PUBLIC_API_URL}/files/${submission.attachment_id}/download`,
    //     {
    //       method: "GET",
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     }
    //   );

    //   if (!res.ok) {
    //     alert("Failed to download file");
    //     return;
    //   }

    //   const blob = await res.blob();
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = submission.file_name;
    //   document.body.appendChild(a);
    //   a.click();
    //   window.URL.revokeObjectURL(url);
    //   document.body.removeChild(a);
    // } catch (error) {
    //   console.error("Download error:", error);
    //   alert("Failed to download file");
    // }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file to submit");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const method = submission ? "PUT" : "POST";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/submission${
          submission ? `/${submission.id}` : ""
        }`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        alert(`Failed to ${submission ? "update" : "submit"}`);
        return;
      }

      alert(`Successfully ${submission ? "updated" : "submitted"}!`);
      onUpdate?.();
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Failed to ${submission ? "update" : "submit"}`);
    } finally {
      setIsSubmitting(false);
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="*/*"
        onChange={handleFileChange}
      />
      <Card className="w-full rounded-sm">
        <CardHeader>
          <CardTitle className="text-xl">Submission</CardTitle>
          <CardAction>
            <span>{submission ? submission.point : "NA"}/{maxPoint}</span>
          </CardAction>
        </CardHeader>
        <CardFooter>
          {submission && !file && (
            <div className="space-y-3 w-full">
              {/*<div className="flex items-center gap-2 text-green-600">
                <FileBraces className="h-4 w-4" />
                <span className="font-medium">Submitted</span>
              </div>*/}
              {submission.file_name && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-full rounded-sm flex justify-between items-center p-2">
                    <div className="flex items-center flex-1 min-w-0 ml-1">
                      <FileText className="mr-1 shrink-0" size={24} />
                      <span className="truncate text-lg">{submission.file_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="shrink-0 ml-2 mr-1"
                    >
                      <Download size={24} />
                    </button>
                  </Badge>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowseClick}
                disabled={isSubmitting}
                className="mt-1 rounded-sm"
              >
                <Edit2 className="mr-1" />
                <span className="text-lg">Browse in device to update</span>
              </Button>
            </div>
          )}

          {!submission && !file && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CloudUpload className="h-8 w-8" />
                <span className="text-lg font-medium">No submission yet</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Upload your assignment (Max 1 MB)
              </p>
              <Button
                type="button"
                onClick={handleBrowseClick}
                disabled={isSubmitting}
                className="w-full max-w-xs"
              >
                <Upload className="mr-2 h-4 w-4" />
                Browse in device
              </Button>
            </div>
          )}

          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      {submission ? (
                        <>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Update
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}