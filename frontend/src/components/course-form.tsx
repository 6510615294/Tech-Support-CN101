"use client"
import {
  useState
} from "react"
import {
  toast
} from "sonner"
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
  cn
} from "@/lib/utils"
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

export default function CourseForm() {

  const form = useForm < z.infer < typeof formSchema >> ({
    resolver: zodResolver(formSchema),

  })

  function onSubmit(values: z.infer < typeof formSchema > ) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        
        <FormField
          control={form.control}
          name="courseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input 
                placeholder="Introduction to Computer Programming"
                
                type="text"
                {...field} />
              </FormControl>
              <FormDescription>This is course display name.</FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
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
                <FormDescription>This display course schedule</FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
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
              <FormControl>
                <Input 
                placeholder="80051"
                
                type="text"
                {...field} />
              </FormControl>
              <FormDescription>This is course section</FormDescription>
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
              <FormControl>
                <Input 
                placeholder="1"
                
                type="number"
                {...field} />
              </FormControl>
              <FormDescription>This is semester</FormDescription>
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
              <FormControl>
                <Input 
                placeholder="2025"
                
                type="number"
                {...field} />
              </FormControl>
              <FormDescription>This is academic year</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
          </div>
          
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}