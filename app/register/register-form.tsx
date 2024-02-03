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
import { useRouter } from 'next/navigation';
import validator from 'validator';

interface RegisterFormProps {
    onRegister: (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => Promise<void>;
    errorMsg?: string;
    email: string;
    setEmailChecked: (checked: boolean) => void;
}

const RegisterForm = ({ onRegister, errorMsg, email: initialEmail, setEmailChecked }: RegisterFormProps) => {
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [stage, setStage] = useState(1);
    const [error, setError] = useState('');

    // Decide on which error message to display, prioritising server errors first   
    const errorMessage = errorMsg || error;
   
    // Password contains at least 8 characters, matches confirm password and one special character
    const passwordValid = password === confirmPassword && password.length >= 8 && /[^A-Za-z0-9]/.test(password);

    const validateFirstStage = () => {
        return password.length >= 8 && validator.equals(password, confirmPassword) && validator.matches(password, /[^A-Za-z0-9]/);
    };

    const validateSecondStage = () => {
        if (!validator.isAlpha(firstName) && !validator.isAlpha(lastName)) {
            setError("First and last name format is invalid")
            return
        } else if (!validator.isAlpha(firstName)) {
            setError("First name format is invalid")
            return
        } else if (!validator.isAlpha(lastName)) {
            setError("Last name format is invalid")
            return
        }

        return validator.isAlpha(firstName) && validator.isAlpha(lastName);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (stage === 1 && validateFirstStage()) {
            setStage(2); // Move to next stage only if first stage validates
        } else if (stage === 2 && validateSecondStage()) {
            await onRegister(email, password, confirmPassword, firstName, lastName);
            return;
        }
        setError('');
        setIsLoading(false);
    };

    const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (isLoading) return;

        if (stage > 1) {
            setStage(stage - 1);
        } else {
            setEmailChecked(false);
        }
    };

    return (
        <>
            <Link
                href="/register"
                onClick={e => handleBackClick(e)}
                className="absolute left-3 top-2 p-2 rounded-md no-underline text-muted-foreground hover:text-foreground transition-colors bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1"
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>{" "}
                Back
            </Link>
            <div className="h-[80px] flex justify-center items-center">
                <div className="h-12 w-12 border rounded-lg drop-shadow-sm bg-card flex justify-center items-center font-bold text-2xl text-primary">
                    <i>FT</i>
                </div>
            </div>
            <div className="flex flex-col text-center mb-8">
                <h1 className="text-2xl font-semibold tracking-normal">
                    Create Account
                </h1>
                {stage === 1 &&
                    <p className="text-sm text-muted-foreground">
                        Please enter your account information
                    </p>
                }
                {stage === 2 &&
                    <p className="text-sm text-muted-foreground">
                        Please enter your personal information
                    </p>
                }

                <div className="px-28 h-2 mt-4 flex justify-center gap-2">
                    {stage === 1 &&
                        <>
                            <div className="border border-primary rounded-lg bg-primary h-2 w-2">
                            </div>
                            <div className="border rounded-lg bg-card h-2 w-2"></div>
                        </>
                    }
                    {stage === 2 &&
                        <>
                            <div className="border rounded-lg bg-card h-2 w-2"></div>
                            <div className="border border-primary rounded-lg bg-primary h-2 w-2"></div>
                        </>
                    }
                </div>
            </div>
            {errorMessage && stage === 2 &&
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {errorMessage}.
                    </AlertDescription>
                </Alert>
            }
            {stage === 1 &&
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
                            disabled={true}
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
                    <div className="space-y-1">
                        <Label className="">Confirm Password</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="rounded-md px-4 py-2 bg-inherit border"
                            disabled={isLoading}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Passwords must match and be a minimum of 8 characters with at least one special character.
                    </p>
                    {!isLoading &&
                        <Button type="submit" disabled={isLoading || email == "" || password == "" || !passwordValid}>Next</Button>
                    }
                    {isLoading &&
                        <Button type="button" disabled={isLoading || email == "" || password == ""}>
                            <div className="flex gap-2 items-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>
                        </Button>
                    }

                </form>


            }
            {stage === 2 &&
                <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="">First Name</Label>
                            <Input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                required
                                className="rounded-md px-4 py-2 bg-inherit border"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="">Last Name</Label>
                            <Input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Smith"
                                required
                                className="rounded-md px-4 py-2 bg-inherit border"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    {!isLoading &&
                        <Button type="submit" disabled={isLoading || email == "" || password == "" || password != confirmPassword || !firstName || !lastName}>Register</Button>
                    }
                    {isLoading &&
                        <Button type="submit" disabled={isLoading || email == "" || password == ""}>
                            <div className="flex gap-2 items-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>
                        </Button>
                    }
                </form >
            }

        </>
    );
};

export default RegisterForm;
