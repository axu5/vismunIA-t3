import { cn } from "@/utils/cn";
import { type FC } from "react";

interface PProps extends React.HTMLAttributes<HTMLParagraphElement> {
  text: string;
  className?: string;
}

const P: FC<PProps> = ({ text, className, ...props }) => {
  return (
    <p className={cn("leading-7", className)} {...props}>
      {text}
    </p>
  );
};

export default P;
