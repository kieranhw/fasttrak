"use client"

import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { AlertCircle } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface LoginFormProps {
    onSignIn: (email: string, password: string) => Promise<void>;
    message?: string;
}

const LoginForm = ({ onSignIn, message }: LoginFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSignIn(email, password);
        setIsLoading(false);
    };

    return (
        <>
            {message &&
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {message}.
                    </AlertDescription>
                </Alert>
            }
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                <div className="space-y-1">
                    <Label className="">Email</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="rounded-md px-4 py-2 bg-inherit border"
                        disabled={isLoading}
                    />
                </div>


                <div className="space-y-1">
                    <Label className="">Password</Label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="rounded-md px-4 py-2 bg-inherit border"
                        disabled={isLoading}
                    />
                </div>

                {!isLoading &&
                    <Button type="submit" disabled={isLoading || email == "" || password == ""}> Sign In </Button>
                }
                {isLoading &&
                    <Button type="submit" disabled={isLoading || email == "" || password == ""}>
                        <div className="flex gap-2 items-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>
                    </Button>
                }
                <div className="relative mt-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            New user?
                        </span>
                    </div>
                </div>
                <Link href="/register">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isLoading}
                        className="w-full mt-2">

                        Create Account
                    </Button>

                </Link>


            </form>
        </>
    );
};

export default LoginForm;
