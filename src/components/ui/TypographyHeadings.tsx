import { cn } from "@/utils/cn";
import { type FC } from "react";

interface TypographyHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string;
  defaultStyle: string;
}

const TypographyHeading: FC<TypographyHeadingProps> = ({
  title,
  className,
  defaultStyle,
  ...props
}) => {
  return (
    <h1 className={cn(defaultStyle, className)} {...props}>
      {title}
    </h1>
  );
};

export default TypographyHeading;
