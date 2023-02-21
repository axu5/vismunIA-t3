import { type FC } from "react";
import TypographyHeading from "./TypographyHeadings";

interface TypographyH1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
}

const TypographyH1: FC<TypographyH1Props> = ({ ...props }) => {
  return (
    <TypographyHeading
      defaultStyle="mt-10 scroll-m-20 border-b border-b-slate-200 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-slate-700"
      {...props}
    />
  );
};

export default TypographyH1;
