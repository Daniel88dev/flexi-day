import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<typeof Checkbox> & {
  id: string;
  label: string;
  className?: string;
  defaultChecked?: boolean;
};

const CheckboxWithLabel = ({
  id,
  label,
  className,
  defaultChecked = false,
  ...props
}: Props) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        name={id}
        className={className}
        defaultChecked={defaultChecked}
        {...props}
      />
      <Label
        htmlFor={id}
        className={
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        }
      >
        {label}
      </Label>
    </div>
  );
};

export default CheckboxWithLabel;
