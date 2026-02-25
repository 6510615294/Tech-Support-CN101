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
  // FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
import { Textarea } from "./ui/textarea";

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  attachment_id: string
  file_name: string
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required"),
  point: z.number().min(0).max(100),
  file: z.any().optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.any(),
  due_date: z.any(),
  close_date: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  assignment?: Assignment;
}

export default function AssignmentForm({ assignment }: AssignmentFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<{file_name: string, attachment_id: string} | null>(
    assignment?.attachment_id && assignment?.file_name 
      ? { file_name: assignment.file_name, attachment_id: assignment.attachment_id }
      : null
  );
  
  const handleFileChange = (files: File[] | null) => {
    const selected = files?.[0] ?? null;
    setFile(selected);
    form.setValue("file", selected);
    // Clear existing attachment when a new file is selected
    if (selected) {
      setExistingAttachment(null);
    }
  };

  const handleRemoveExistingAttachment = () => {
    setExistingAttachment(null);
  };
  const { course_id, assignment_id } = useParams();
  const router = useRouter()
  const isEditing = !!assignment || !!assignment_id;
  
  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 4, // 4MB
    multiple: false,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: [],
      start_date: null,
      due_date: null,
      close_date: null,
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

      if (values.tags) {
        values.tags.forEach(tag => formData.append("tags", tag));
      }

      if (values.file && values.file instanceof File) {
        formData.append("file", values.file);
      } else if (existingAttachment) {
        formData.append("attachment_id", existingAttachment.attachment_id);
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
                <Textarea
                  placeholder=""
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
          name="file"
          render={() => (
            <FormItem>
              <FormLabel>Attachment</FormLabel>
              <FormControl>
                <FileUploader
                  value={file ? [file] : null}
                  onValueChange={handleFileChange}
                  dropzoneOptions={dropZoneConfig}
                  className="relative bg-background p-1"
                > 
                  {(!file && !existingAttachment) && (
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
                    {file && (
                      <FileUploaderItem 
                        onClick={() => {
                          setFile(null);
                          form.setValue("file", null);
                        }}
                        index={0}
                      >
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{file.name}</span>
                      </FileUploaderItem>
                    )}
                    {existingAttachment && !file && (
                      <FileUploaderItem 
                        onClick={handleRemoveExistingAttachment}
                        index={0}
                      >
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{existingAttachment.file_name}</span>
                      </FileUploaderItem>
                    )}
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

        <Button className="w-full" type="submit">
          {isEditing ? "Save" : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
