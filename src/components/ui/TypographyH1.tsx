import { type FC } from "react";
import TypographyHeading from "./TypographyHeadings";

interface TypographyH1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
}

const TypographyH1: FC<TypographyH1Props> = ({ ...props }) => {
  return (
    <TypographyHeading
      defaultStyle="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
      {...props}
    />
  );
};

export default TypographyH1;
