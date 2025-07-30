import AuthForm from "@/components/AuthForm";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AuthForm type="sign-up" />
    </div>
  );
}