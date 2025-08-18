"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

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
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/Firebase/Client";
import { signIn, signUp } from "@/lib/actions/auth.action";

type FormType = "sign-in" | "sign-up";

const formSchema = z.object({
  username: z.string().min(2).max(50).optional(), // Optional for sign-in
  email: z.string().email({ message: "Enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
           const { username, email, password } = values;
  
           const userCredentails = await createUserWithEmailAndPassword(auth, email, password);

           const result = await signUp({
               uid: userCredentails.user.uid,
               username: username!,
               email,
               password,
           })


           if(!result.success) {
            toast.error(result.message);
            return;
           }

        toast.success('Account created successfully. Please sign in.');
        router.push('/sign-in')
         
      } else {
          const { email, password } = values;

          const userCredentails = await signInWithEmailAndPassword(auth ,email, password);

          const idToken = await userCredentails.user.getIdToken();

          if(!idToken) {
            toast.error('Sign in failed')
            return;
          }

          await signIn({
            email,idToken
          })


        toast.success('Sign in successfully.');
        router.push('/')
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        {/* Logo Section */}
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100 text-xl font-bold">VocaPrep</h2>
        </div>

        <h3 className="text-lg text-center">Practice job interviews with AI</h3>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4">
            {/* Show username only for sign-up */}
            {!isSignIn && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              {!isSignIn ? "Create an Account" : "Sign In"}
            </Button>
          </form>
        </Form>

        {/* Switch between Sign In / Sign Up */}
        <p className="text-center text-sm">
          {isSignIn ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
