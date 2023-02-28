import { type FC, type ReactNode } from "react";

interface TypographyTableProps {
  titles: ReactNode[];
  rows: ReactNode[][];
  exclude?: string[];
}

const TypographyTable: FC<TypographyTableProps> = ({
  titles,
  rows,
  exclude,
}) => {
  const excludeIndices = new Array((exclude || []).length);
  for (let i = 0; i < excludeIndices.length; ++i) {
    if (exclude?.includes(titles[i]?.valueOf() as string)) {
      excludeIndices.push(i);
    }
  }

  return (
    <div className="my-6 w-full overflow-y-auto rounded">
      <table className="w-full">
        <thead>
          <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
            {titles.map((title, i) => {
              if (excludeIndices.includes(i)) return;
              return (
                <th
                  key={i}
                  className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right"
                >
                  {title}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            return (
              <tr
                key={rowIndex}
                className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800"
              >
                {row.map((text, colIndex) => {
                  if (excludeIndices.includes(colIndex)) return;
                  return (
                    <td
                      key={colIndex}
                      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right"
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TypographyTable;
