import type { ReactNode, ThHTMLAttributes } from "react";

export type DataListDensity = "compact" | "default" | "comfortable";

export type SortDirection = "asc" | "desc";

export type DataListColumn = {
  key: string;
  label: ReactNode;
  align?: "left" | "right" | "center";
  sortDirection?: SortDirection;
  className?: string;
};

export type DataListProps = {
  columns: DataListColumn[];
  children: ReactNode;
  density?: DataListDensity;
  className?: string;
  caption?: string;
};

const densityClasses: Record<DataListDensity, string> = {
  compact: "px-2.5 py-1.5",
  default: "px-3 py-2.5",
  comfortable: "px-4 py-3.5",
};

const alignClasses: Record<
  NonNullable<DataListColumn["align"]>,
  "text-left" | "text-right" | "text-center"
> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function dataListDensityClasses(density: DataListDensity = "default") {
  return densityClasses[density];
}

function ariaSort(
  direction: SortDirection | undefined,
): ThHTMLAttributes<HTMLTableCellElement>["aria-sort"] {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return undefined;
}

export function DataList({
  columns,
  children,
  density = "default",
  className,
  caption,
}: DataListProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] ${className ?? ""}`}
    >
      <table className="w-full border-collapse text-sm">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead className="sticky top-0 z-10 bg-[var(--muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={ariaSort(column.sortDirection)}
                className={`whitespace-nowrap text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] ${
                  alignClasses[column.align ?? "left"]
                } ${densityClasses[density]} ${column.className ?? ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export type DataRowProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export function DataRow({
  children,
  className,
  interactive = false,
}: DataRowProps) {
  return (
    <tr
      className={`border-t border-[var(--border)] transition-colors ${
        interactive
          ? "hover:bg-[var(--muted)] focus-within:bg-[var(--muted)]"
          : ""
      } ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}

export type DataCellProps = {
  children: ReactNode;
  density?: DataListDensity;
  align?: DataListColumn["align"];
  className?: string;
  mono?: boolean;
};

export function DataCell({
  children,
  density = "default",
  align = "left",
  className,
  mono = false,
}: DataCellProps) {
  return (
    <td
      className={`align-middle text-[var(--foreground)] ${
        alignClasses[align]
      } ${densityClasses[density]} ${mono ? "font-mono text-xs" : ""} ${
        className ?? ""
      }`}
    >
      {children}
    </td>
  );
}
