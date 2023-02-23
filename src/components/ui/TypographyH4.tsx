import { type FC } from "react";
import TypographyHeading from "./TypographyHeadings";

interface TypographyH4Props extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
}

const TypographyH4: FC<TypographyH4Props> = ({ ...props }) => {
  return (
    <TypographyHeading
      defaultStyle="scroll-m-20 text-xl font-semibold tracking-tight"
      {...props}
    />
  );
};

export default TypographyH4;
