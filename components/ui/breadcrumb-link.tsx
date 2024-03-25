import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GoChevronRight } from "react-icons/go";

interface BreadcrumbLinkProps {
    text: string;
    href?: string;
    lastItem?: boolean;
}

export const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ href, text, lastItem }) => {
    const textColor = lastItem ? "text-foreground text-md" : "text-md text-muted-foreground";
    const separator = !lastItem ? <div className="text-foreground/50"><GoChevronRight size={18}/></div> : null;

    return (
        <>
            <div className="inline-flex gap-2 items-center">
                {/* If it's the last item, display it without a link */}
                {lastItem ? (
                    <div className={textColor}>{text}</div>
                ) : (
                    // If there's a href prop, wrap with link
                    href ? (
                        <>
                            <Link draggable="false" href={href}>
                                <div className={`${textColor} hover:text-primary hover:underline`}>
                                    {text}
                                </div>
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className={textColor}>{text}</div>
                        </>
                    )
                )}
            </div>
            <div className="items-center inline-flex mx-1">
                {separator}
            </div>
        </>
    );
};
