import { InputHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  title: string;
  className?: string | undefined;
  type?: string;
  defaultValue?: string | number;
};

const InputText = ({
  id,
  title,
  className,
  type = "text",
  defaultValue,
  ...props
}: Props) => {
  return (
    <div className={"grid w-full max-w-sm items-center gap-1.5 my-2"}>
      <Label htmlFor={id}>{title}</Label>
      <Input
        id={id}
        type={type}
        name={id}
        placeholder={title}
        className={className}
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );
};

export default InputText;
