import Image from "next/image";
import { cn } from "@/lib/utils";

type WebResultCardProps = {
  title: string;
  url: string;
  snippet: string;
  thumbnail?: string;
  source: string;
  className?: string;
};

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-3 w-3", className)}
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm4.943-.69a.75.75 0 01.933-.485l5.5 1.75a.75.75 0 01.485.933l-1.75 5.5a.75.75 0 11-1.428-.454l1.084-3.41-4.08 4.08a.75.75 0 11-1.06-1.06l4.079-4.08-3.41 1.085a.75.75 0 01-.453-1.429z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function WebResultCard({
  title,
  url,
  snippet,
  thumbnail,
  source,
  className,
}: WebResultCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block space-y-3 transition-transform duration-300 hover:scale-[1.02]",
        className,
      )}
    >
      {/* image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-border-subtle">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-secondary">
            no preview
          </div>
        )}
      </div>

      {/* info */}
      <div className="space-y-1 px-1">
        <div className="flex items-start gap-1">
          <p className="line-clamp-2 text-sm font-medium text-primary lowercase">
            {title}
          </p>
          <ExternalLinkIcon className="mt-0.5 shrink-0 text-secondary" />
        </div>
        <p className="flex items-center gap-1 text-xs text-secondary lowercase">
          via {source}
        </p>
      </div>
    </a>
  );
}
