import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { MenuListData } from "../navbar.types";

export type MenuListProps = {
  data: MenuListData;
  label: string;
};

export function MenuList({ data, label }: MenuListProps) {
  const columns = data.length > 16 ? 3 : data.length > 8 ? 2 : 1;
  const widthClass =
    columns === 1
      ? "w-[min(360px,calc(100vw-24px))]"
      : columns === 2
        ? "w-[min(560px,calc(100vw-24px))]"
        : "w-[min(760px,calc(100vw-24px))]";

  const chunkSize = Math.ceil(data.length / columns);
  const chunks: MenuListData[] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }

  return (
    <NavigationMenuItem className="relative">
      <NavigationMenuTrigger className="font-normal px-3">
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent
        className={cn(
          "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))] shadow-lg overflow-hidden p-2",
          widthClass
        )}
      >
        <div className="flex">
          {chunks.map((col, idx) => (
            <ul
              key={idx}
              className={cn(
                "min-w-[220px] px-2",
                idx > 0 && "border-l border-[rgb(var(--brand-200))]"
              )}
            >
              {col.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    "first:pt-0 last:pb-0",
                    "border-b border-[rgb(var(--brand-200))] last:border-b-0"
                  )}
                >
                  <Link
                    href={item.url ?? "/"}
                    className="block px-3 py-2.5 text-sm rounded-md hover:bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-900))]"
                  >
                    <div className="font-medium">{item.label}</div>
                    {item.description ? (
                      <div className="text-xs text-[rgb(var(--brand-600))] mt-0.5">
                        {item.description}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
