import Link from "next/link";

interface BreadcrumbLinkProps {
    text: string;
    href?: string;
    lastItem?: boolean;
}

export const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ href, text, lastItem }) => {
    const textColor = lastItem ? "text-foreground font-semibold" : "text-muted-foreground";
    const separator = !lastItem ? <div className="text-muted-foreground">/</div> : null;

    return (
        <div className="inline-flex gap-2 mx-2 ml-0">
            {/* If it's the last item, we display it without a link */}
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
                        {separator}
                    </>
                ) : (
                    // If there's no href and it's not the last item, we show the text with a separator
                    <>
                        <div className={textColor}>{text}</div>
                        {separator}
                    </>
                )
            )}
        </div>
    );
};
