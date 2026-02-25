"use client"

import { useRouter, useParams } from "next/navigation"
import {
  useEffect
} from "react"
import {
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import {
  z
} from "zod"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Input
} from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const formSchema = z.object({
  courseName: z.string().min(1),
  course_day: z.string(),
  course_time: z.string(),
  section: z.string().min(1),
  semester: z.number().min(1).max(3),
  year: z.number().min(2025)
});

interface CourseFormProps {
  course?: {
    id: string;
    name: string;
    schedule: string;
    section: string;
    semester: string;
    teacher: string;
  };
}

export default function CourseForm({ course }: CourseFormProps) {
  const { course_id } = useParams();
  const router = useRouter()
  const isEditing = !!course || !!course_id;
    
  const form = useForm < z.infer < typeof formSchema >> ({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (course) {
      // Parse course_date from format "Mon 9:30-12:30" to day and time
      const dateParts = course.schedule.split(' ');
      const courseDay = dateParts[0] || '';
      const courseTime = dateParts[1] || '';
      
      // Parse semester from format "1/2025" to semester and year
      const semesterParts = course.semester.split('/');
      const semester = parseInt(semesterParts[0]) || 1;
      const year = parseInt(semesterParts[1]) || 2025;

      // Reset form with course data
      form.reset({
        courseName: course.name || '',
        course_day: courseDay,
        course_time: courseTime,
        section: course.section || '',
        semester: semester,
        year: year
      });
    }
  }, [course, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: values.courseName,
        course_date: `${values.course_day} ${values.course_time}`,
        section: values.section,
        semester: `${values.semester}/${values.year}`,
      };

      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses`;
      
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error(e);
        alert(isEditing ? "Failed to update course" : "Failed to create course");
        return;
      }

      router.push("/courses");
      alert(isEditing ? "Course updated successfully!" : "Course created successfully!");
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "creating"} course`, err);
      alert("Something went wrong.");
    } finally {

    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to delete course");
        alert("Failed to delete course");
        return;
      }

      router.push("/courses");
      alert("Course deleted successfully!");
    } catch (err) {
      console.error("Error deleting course", err);
      alert("Something went wrong.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
      >
        <FormField
          control={form.control}
          name="courseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl className="rounded-sm">
                <Input 
                placeholder="Introduction to Computer Programming"
                type="text"
                {...field} 
                value={field.value ?? ""}
              />
              </FormControl>
              {/*<FormDescription>This is course display name.</FormDescription>*/}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="course_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days of the Week</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl className="rounded-sm w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Mon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mon">Mon</SelectItem>
                      <SelectItem value="Tue">Tue</SelectItem>
                      <SelectItem value="Wed">Wed</SelectItem>
                      <SelectItem value="Thu">Thu</SelectItem>
                      <SelectItem value="Fri">Fri</SelectItem>
                      <SelectItem value="Sat">Sat</SelectItem>
                      <SelectItem value="Sun">Sun</SelectItem>
                    </SelectContent>
                  </Select>
                    {/*<FormDescription>This display course schedule</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="course_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl className="rounded-sm w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="9:30-12:30" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="8:00-9:30">8:00-9:30</SelectItem>
                      <SelectItem value="9:30-12:30">9:30-12:30</SelectItem>
                      <SelectItem value="13:30-16:30">13:30-16:30</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl className="rounded-sm">
                <Input
                placeholder="80001"
                type="text"
                {...field}
                value={field.value ?? ""}
              />
              </FormControl>
              {/*<FormDescription>This is course section</FormDescription>*/}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-12 gap-4">   
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <FormControl className="rounded-sm">
                    <Input 
                    placeholder="1"
                    type="number"
                    {...field} 
                    value={field.value ?? ""}
                    onChange={e =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                  </FormControl>
                  {/*<FormDescription>This is semester</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl className="rounded-sm">
                    <Input 
                    placeholder="2025"
                    type="number"
                    {...field} 
                    value={field.value ?? ""}
                    onChange={e =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                  </FormControl>
                  {/*<FormDescription>This is academic year</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button 
          type="submit" 
          className="rounded-sm w-full" 
        >
          {isEditing ? "Save" : "Submit"}
        </Button>
        {isEditing && (
          <Button 
            type="button"
            variant="destructive"
            className="rounded-sm w-full" 
            onClick={handleDelete}
          >
            Delete Course
          </Button>
        )}
      </form>
    </Form>
  )
}