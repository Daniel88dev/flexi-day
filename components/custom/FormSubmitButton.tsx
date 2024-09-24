import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

const FormSubmitButton = ({ children }: { children: ReactNode }) => {
  const { pending } = useFormStatus();

  console.log(pending);

  return (
    <Button type={"submit"} disabled={pending}>
      {children}
    </Button>
  );
};

export default FormSubmitButton;
