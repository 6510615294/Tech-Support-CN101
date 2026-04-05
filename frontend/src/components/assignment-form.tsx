"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";
import { SmartDatetimeInput } from "@/components/ui/smart-datetime-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import {
  CloudUpload,
  Paperclip,
} from "lucide-react";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import { useParams } from "next/navigation";
import { TipTapTextEditor } from "./ui/tiptap";

type attachment = {
  id: string
  file_name: string
}

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  attachments: attachment[]
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
  ai_agent: boolean
  visible: boolean
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required"),
  point: z.number().min(0).max(100),
  files: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.any(),
  due_date: z.any(),
  close_date: z.any().optional(),
  ai_agent: z.boolean().optional(),
  visible: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  assignment?: Assignment;
}

export default function AssignmentForm({ assignment }: AssignmentFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<{file_name: string, attachment_id: string}[]>(
    assignment?.attachments ? assignment.attachments.map(a => ({ file_name: a.file_name, attachment_id: a.id })) : []
  );
  
  const handleFileChange = (newFiles: File[] | null) => {
    const selectedFiles = newFiles ?? [];
    setFiles(selectedFiles);
    form.setValue("files", selectedFiles);
    // Clear existing attachments when new files are selected
    if (selectedFiles.length > 0) {
      setExistingAttachments([]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    form.setValue("files", updatedFiles);
  };

  const handleRemoveExistingAttachment = (index: number) => {
    const updated = existingAttachments.filter((_, i) => i !== index);
    setExistingAttachments(updated);
  };
  const { course_id, assignment_id } = useParams();
  const router = useRouter()
  const isEditing = !!assignment || !!assignment_id;
  
  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 5, // 5MB
    multiple: true,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: [],
      start_date: null,
      due_date: null,
      close_date: null,
      ai_agent: false,
      visible: true,
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description,
        point: assignment.point,
        tags: assignment.tags || [],
        start_date: assignment.start_date ? new Date(assignment.start_date) : null,
        due_date: assignment.due_date ? new Date(assignment.due_date) : null,
        close_date: assignment.close_date ? new Date(assignment.close_date) : null,
        ai_agent: assignment.ai_agent,
        visible: assignment.visible,
      });
    }
  }, [assignment, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("point", String(values.point));
      formData.append("start", values.start_date.toISOString());
      formData.append("due", values.due_date.toISOString());

      if (values.close_date) {
        formData.append("close", values.close_date.toISOString());
      }

      if (values.ai_agent !== undefined) {
        formData.append("ai_agent", String(values.ai_agent));
      }

      if (values.visible !== undefined) {
        formData.append("visible", String(values.visible));
      }

      if (values.tags) {
        values.tags.forEach(tag => formData.append("tags", tag));
      }

      if (values.files && Array.isArray(values.files) && values.files.length > 0) {
        values.files.forEach((file) => {
          if (file instanceof File) {
            formData.append("files", file);
          }
        });
      } else if (existingAttachments && existingAttachments.length > 0) {
        existingAttachments.forEach((attachment) => {
          formData.append("attachments", attachment.attachment_id);
        });
      }

      const token = localStorage.getItem("token");

      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id || assignment?.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`;
      
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("Error: " + (errorData.message || res.statusText));
        return;
      }

      const successMessage = isEditing 
        ? "Assignment updated successfully!" 
        : "Assignment created successfully!";
      alert(successMessage);
      router.push(`/courses/${course_id}/assignments`);
    } catch (error) {
      alert("Failed to submit assignment. Please try again.");
      console.error(error);
    }
  };
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            (e.target as HTMLElement).tagName !== "TEXTAREA"
          ) {
            e.preventDefault()
          }
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl className="rounded-sm">
                <Input
                  placeholder=""
                  type="text"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl className="rounded-sm">
                <TipTapTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  editable={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="point"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Point</FormLabel>
              <FormControl className="rounded-sm">
                <Input
                  placeholder=""
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="files"
          render={() => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <FileUploader
                  value={files.length > 0 ? files : null}
                  onValueChange={handleFileChange}
                  dropzoneOptions={dropZoneConfig}
                  className="relative bg-background p-1"
                > 
                  {(files.length === 0 && existingAttachments.length === 0) && (
                    <FileInput
                      id="fileInput"
                      className="outline-dashed outline-1 outline-slate-500 rounded-sm"
                    >
                      <div className="flex flex-col items-center justify-center p-8 w-full">
                        <CloudUpload className="text-gray-500 w-10 h-10" />
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF, PNG or PY
                        </p>
                      </div>
                    </FileInput>
                  )}
                  <FileUploaderContent>
                    {files.map((file, index) => (
                      <FileUploaderItem 
                        key={index}
                        onClick={() => handleRemoveFile(index)}
                        index={index}
                      >
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{file.name}</span>
                      </FileUploaderItem>
                    ))}
                    {existingAttachments.map((attachment, index) => (
                      <FileUploaderItem 
                        key={attachment.attachment_id}
                        onClick={() => handleRemoveExistingAttachment(index)}
                        index={index}
                      >
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{attachment.file_name}</span>
                      </FileUploaderItem>
                    ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl className="rounded-sm">
                <TagsInput
                  value={field.value ?? []}
                  onValueChange={field.onChange}
                  placeholder="Enter your tags"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <SmartDatetimeInput
                  value={field.value instanceof Date ? field.value : null}
                  onValueChange={field.onChange}
                  placeholder="e.g. Tomorrow morning 9am"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <SmartDatetimeInput
                  value={field.value instanceof Date ? field.value : null}
                  onValueChange={field.onChange}
                  placeholder="e.g. Tomorrow morning 9am"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Close Date</FormLabel>
              <FormControl>
                <SmartDatetimeInput
                  value={field.value instanceof Date ? field.value : null}
                  onValueChange={field.onChange}
                  placeholder="e.g. Tomorrow morning 9am"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ai_agent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">AI Agent</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visible</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit">
          {isEditing ? "Save" : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
