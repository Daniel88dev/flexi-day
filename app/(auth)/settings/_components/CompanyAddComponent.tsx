"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useEffect, useState } from "react";
import InputText from "@/components/custom/InputText";
import { slugifyText } from "@/lib/utils";
import { useFormState } from "react-dom";
import {
  submitNewCompany,
  SubmitNewCompanyType,
} from "@/app/(auth)/settings/settingActions";
import { toast } from "sonner";

type State = {
  name: string;
  slug: string;
};

const CompanyAddComponent = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [names, setNames] = useState<State>({
    name: "",
    slug: "",
  });

  const [newCompanyFormState, newCompanyFormAction] = useFormState(
    submitNewCompany,
    {
      errors: null,
      success: false,
    } as SubmitNewCompanyType
  );

  useEffect(() => {
    if (newCompanyFormState.success && open) {
      toast("Company successfully created!");
      setNames({ name: "", slug: "" });
      setOpen(false);
    } else if (
      !newCompanyFormState.success &&
      newCompanyFormState.errors &&
      open
    ) {
      toast.error("Error creating new company!");
    }
  }, [newCompanyFormState, open]);

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const slug = slugifyText(value);
    setNames((prevState) => {
      return {
        ...prevState,
        name: value,
        slug: slug,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"}>Create New Company</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            New Company should be registered by Manager.
          </DialogDescription>
        </DialogHeader>
        <form action={newCompanyFormAction}>
          <InputText
            id={"companyName"}
            title={"Enter Company Name"}
            onChange={onNameChange}
          />
          <h3 className={"text-sm py-2"}>
            Generated Company slug: {names.slug}
          </h3>
          <InputText type={"number"} id={"vacation"} title={"Vacation Quota"} />
          <InputText
            type={"number"}
            id={"homeOffice"}
            title={"Home Office Quota"}
          />
          <input
            className={"hidden"}
            value={names.slug}
            readOnly
            name={"slug"}
          />
          <ul>
            {newCompanyFormState.errors &&
              Object.keys(newCompanyFormState.errors!).map((error) => (
                <li key={error}>{newCompanyFormState.errors![error]}</li>
              ))}
          </ul>
          <DialogFooter className="flex p-2 gap-2">
            <Button type={"submit"}>Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyAddComponent;
