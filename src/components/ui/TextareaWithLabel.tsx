import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextareaWithLabel({
  label,
  placeholder,
  ...props
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">{label}</Label>
      <Textarea placeholder={placeholder} id="message" {...props} />
    </div>
  );
}
