"use client"
import { useState } from 'react';
import RegisterForm from './register-form'; // Ensure path is correct
import { db } from '@/lib/db/db';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface EmailCheckerProps {
    signUp: (email: string, password: string) => Promise<void>;
}

export const EmailChecker = ({ signUp }: EmailCheckerProps) => {
    const [email, setEmail] = useState('');
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const checkEmailExists = async (email: string) => {
        setIsLoading(true);
        // Simulate checking email existence, adjust with actual API call
        try {
            const { found } = await db.profiles.fetch.profile.byEmail(email); // Adjust based on actual API
            setIsLoading(false);
            setEmailExists(found);
            if (!found) {
                setEmailChecked(true);
            } else {
                setError("Email already exists."); // Adjust error handling as needed
            }
        } catch (err) {
            setError("Failed to check the email.");
            setIsLoading(false);
        }
    };

    if (emailChecked && !emailExists) {
        return <RegisterForm onRegister={signUp} email={email} message="" />;
    }

    return (
        <>
            <div className="flex flex-col text-center mb-8">
                <h1 className="text-2xl font-semibold tracking-normal">
                    Create Account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please enter your email to get started
                </p>
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="flex flex-col gap-4">
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                />
                <Button onClick={() => checkEmailExists(email)} disabled={isLoading || !email}>
                    Submit
                </Button>
                <div className="relative mt-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Already registered?
                        </span>
                    </div>
                </div>
                <Link href="/login">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isLoading}
                        className="w-full mt-2">
                        Sign In
                    </Button>
                </Link>
            </div>

        </>
    );
};
