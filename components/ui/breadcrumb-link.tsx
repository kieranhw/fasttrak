import Link from "next/link";

interface BreadcrumbLinkProps {
    href?: string;
    text: string;
    lastItem?: boolean;
}

export const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ href, text, lastItem }) => (
    <div className="inline-flex gap-2 mx-2 ml-0">
        {lastItem &&
            <div className="text-foreground">{text}</div>
        }
        {!lastItem && href &&
            <>
                <Link draggable="false" href={href}>
                    <div className="text-foreground/50 hover:text-primary hover:underline">{text}</div>
                </Link>
                <div className="text-foreground/50">
                    /
                </div>
            </>
        }
    </div>

);