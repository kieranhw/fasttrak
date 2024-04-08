'use client'
import {
    Cloud,
    CreditCard,
    Github,
    Keyboard,
    LifeBuoy,
    LogOut,
    Mail,
    MessageSquare,
    Plus,
    PlusCircle,
    Settings,
    User,
    UserPlus,
    Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProfile } from "@/types/db/UserProfile"
import { useEffect, useState } from "react"
import { db } from "@/lib/db/db"

interface ProfileDropdownProps {
    signOut: () => Promise<void>;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ signOut }) => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [initials, setInitials] = useState('')

    useEffect(() => {
        async function fetchUser() {
            const response = await db.profiles.fetch.current();
            if (response.data) {
                setUser(response.data);
                // Assuming response.data contains firstName and lastName fields
                // Update these field accesses as necessary based on your UserProfile type
                const firstNameInitial = response.data.first_name?.[0].toUpperCase() ?? '';
                const lastNameInitial = response.data.last_name?.[0].toUpperCase() ?? '';
                setInitials(`${firstNameInitial}${lastNameInitial}`);
            }
        }
        fetchUser();
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 w-10 text-center items-center tracking-tight rounded-full">{initials}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 mr-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
