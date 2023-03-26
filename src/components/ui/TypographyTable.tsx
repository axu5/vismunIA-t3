import { type FC, type ReactNode } from "react";

interface TypographyTableProps {
  titles: ReactNode[];
  rows: ReactNode[][];
  exclude?: string[];
}

const stylingColumnTitle =
  "border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right";
const stylingRow =
  "m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800";
const stylingRowItem =
  "border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right";

const TypographyTable: FC<TypographyTableProps> = ({
  titles,
  rows,
  exclude,
}) => {
  // Find the indices of the columns to exclude based on
  // the name matching the column title
  const excludeLUT: boolean[] =
    exclude == undefined
      ? new Array(titles.length).fill(false)
      : new Array(titles.length).fill(false).map((_, i) => {
          const title = titles[i];
          if (typeof title !== "string") return false;
          return exclude.includes(title);
        });

  // Go over each title and print it to the head of the HTML table component
  const titlesFormatted = titles.map((title, i) => {
    // If i is in "excludeIndices" continue with the function
    // without appending it to the titles.
    if (excludeLUT[i]) return;
    return (
      <th
        // Key identifies in which order the column headers are sorted
        key={i}
        className={stylingColumnTitle}
      >
        {/* Return the title as the head */}
        {title}
      </th>
    );
  });

  // 2d array requires 2 for loops
  const rowsFormatted = rows.map((row, rowIndex) => {
    // Create a row for each element in rows array
    return (
      <tr
        // Key identifies in which order the rows are sorted
        key={rowIndex}
        className={stylingRow}
      >
        {row.map((text, colIndex) => {
          // If i is in "excludeIndices" continue with the function
          // without appending it to the row.
          if (excludeLUT[colIndex]) return;
          // Return
          return (
            <td
              // Key classifies the order in which the rows are sorted
              key={colIndex}
              className={stylingRowItem}
            >
              {/* Text content from the 2d array */}
              {text}
            </td>
          );
        })}
      </tr>
    );
  });

  // Return JSX Component ...
  return (
    <div className="my-6 w-full rounded">
      <table className="w-full">
        <thead>
          <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
            {titlesFormatted}
          </tr>
        </thead>
        <tbody>{rowsFormatted}</tbody>
      </table>
    </div>
  );
};

export default TypographyTable;
