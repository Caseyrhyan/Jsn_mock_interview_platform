'use server';

import { auth, db } from "@/Firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7;
export async function signUp(params: signUpParams) {
    const { uid, username, email } = params;

    try {
        const userRecord = await db.collection('users').doc(uid).get();

        if(userRecord.exists){
            return{
                success: false,
                message: 'User already exist. Please sign in instead.'
            }
        }

        await db.collection('users').doc(uid).set({
            username, email
        })

        return{
            success: true,
            message: 'Account created successfully, please sign in.'
        }
    } catch (e: any) {
        console.error('Error creating a user', e);

        if(e.code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'This email is already in use. '
            }
        }
    }

    return {
    success: false,
    message: 'Failed to create an account'
    }
}
// Define SignInParams type
type SignInParams = {
    email: string;
    idToken: string;
};

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try{
        const userRecord = await auth.getUserByEmail(email);

        if(!userRecord) {
            return {
                success: false,
                message: 'User does not exist. Create an account instead'
            }
        }

        await setSessionCookie(idToken)
    }catch (e) {
        console.log(e);

        return {
            success: false,
            message: 'Failed to sign in into an account'
        }
    }

}

export async function setSessionCookie(idToken: string) {
    const cookiestore = await cookies();

        const sessionCookie = await auth.createSessionCookie(idToken, {
             expiresIn: ONE_WEEK * 1000,
        });

        cookiestore.set('session', sessionCookie, {
            maxAge: ONE_WEEK,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax'
        });
    }



// Define AppUser type (customize fields as needed)
type AppUser = {
    id: string;
    username: string;
    email: string;
    // add other fields if needed
};

export async function getCurrentUser(): Promise<AppUser | null> {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const userRecord = await db.
            collection('users')
            .doc(decodedClaims.uid)
            .get();

        if (!userRecord.exists) return null;

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as AppUser;
    } catch(e) {
        console.log(e)

        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();

    return !!user; 
}