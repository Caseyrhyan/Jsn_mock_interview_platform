'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateInterviewRoom } from "@/lib/actions/interview.action";

const formSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters").max(100),
  level: z.string().min(2, "Level is required"),
  techStack: z.string().min(2, "Please provide at least one technology (e.g. React, Node)"),
  jobDescription: z.string().optional(),
});

export default function InterviewSetupForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "",
      level: "",
      techStack: "",
      jobDescription: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const result = await generateInterviewRoom({
        userId,
        ...values
      });

      if (result.success && result.id) {
        toast.success('Interview setup complete. Redirecting to room...');
        router.push(`/interview/${result.id}`);
      } else {
        toast.error(result.message || "Something went wrong while setting up your interview.");
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to submit form");
      setIsLoading(false);
    }
  };

  return (
    <div className="card-border w-full max-w-2xl mx-auto mt-8">
      <div className="flex flex-col gap-6 card py-10 px-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Setup Your Mock Interview</h1>
          <p className="text-light-100 text-sm">Fill in the details below so our AI can generate hyper-realistic, targeted questions for your session.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Frontend Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                        {/* Using a native select styled similarly to inputs for simplicity, or just a standard text input for now since they didn't specify strict enums, though a select is better. */}
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full text-white">
                          <SelectValue placeholder="Select Level" />
                        </SelectTrigger>
                        <SelectContent className="text-white">
                          <SelectItem value="Intern">Intern</SelectItem>
                          <SelectItem value="Junior">Junior</SelectItem>
                          <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                          <SelectItem value="Lead/Principal">Lead / Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="techStack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tech Stack / Key Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. React, Next.js, Tailwind, TypeScript" {...field} />
                  </FormControl>
                  <FormDescription>Comma separated list of skills.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Paste the job description here to better contextualize the questions..." 
                        className="min-h-[120px] resize-y"
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full relative group transition-transform duration-200 active:scale-95" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Custom Interview...
                </>
              ) : (
                "Create Interview Room"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
