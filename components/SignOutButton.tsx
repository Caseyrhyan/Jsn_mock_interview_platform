'use client';

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SignOutButton = () => {
    const router = useRouter();

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            toast.success("Signed out successfully");
            router.push('/sign-in');
        } else {
            toast.error("Failed to sign out");
        }
    }

    return (
        <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-primary-100 hover:text-primary-100/80 hover:bg-transparent"
        >
            Sign Out
        </Button>
    )
}

export default SignOutButton;
