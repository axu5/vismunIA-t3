import { type FC } from "react";
import TypographyHeading from "./TypographyHeadings";

interface TypographyH1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
}

const TypographyH1: FC<TypographyH1Props> = ({ ...props }) => {
  return (
    <TypographyHeading
      defaultStyle="mt-8 scroll-m-20 text-xl font-semibold tracking-tight"
      {...props}
    />
  );
};

export default TypographyH1;
