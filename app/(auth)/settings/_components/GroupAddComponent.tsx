"use client";

import { ChangeEvent, useEffect, useState } from "react";
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
import InputText from "@/components/custom/InputText";
import {
  CompanyDetailType,
  submitNewGroup,
  SubmitNewGroupType,
} from "@/app/(auth)/settings/settingActions";
import { slugifyText } from "@/lib/utils";
import CheckboxWithLabel from "@/components/custom/CheckboxWithLabel";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import FormSubmitButton from "@/components/custom/FormSubmitButton";

type State = {
  name: string;
  slug: string;
};

const GroupAddComponent = ({ company }: { company: CompanyDetailType }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [data, setData] = useState<State>({
    name: "",
    slug: "",
  });

  const [newGroupFormState, newGroupFormAction] = useFormState(submitNewGroup, {
    errors: null,
    success: false,
    companyId: company.companyId,
  } as SubmitNewGroupType);

  useEffect(() => {
    if (newGroupFormState.success && open) {
      toast("Group successfully created!");
      setData({ name: "", slug: "" });
      setOpen(false);
    } else if (!newGroupFormState.success && newGroupFormState.errors && open) {
      toast.error("Error creating new group!");
    }
  }, [newGroupFormState, open]);

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const slug = slugifyText(value);
    setData((prevState) => {
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
        <Button variant={"outline"}>Create New Group</Button>
      </DialogTrigger>
      <DialogContent className={"sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Group is for managing Vacation in smaller team of People working in
            Company. (Users in group wont be able to see other group members, if
            not assigned to that group)
          </DialogDescription>
        </DialogHeader>
        <form action={newGroupFormAction}>
          {/*groupName*/}
          <InputText
            id={"groupName"}
            title={"Enter Group Name"}
            onChange={onNameChange}
          />
          {/*groupSlug*/}
          <h3 className={"text-sm py-2"}>Generated Group slug: {data.slug}</h3>
          {/*vacationDefault*/}
          <InputText
            type={"number"}
            id={"vacation"}
            title={"Vacation Quota"}
            defaultValue={company.vacationDefault}
          />
          {/*homeOfficeDefault*/}
          <InputText
            type={"number"}
            id={"homeOffice"}
            title={"Home Office Quota"}
            defaultValue={company.homeOfficeDefault}
          />
          {/*isActive as isVisible*/}
          <CheckboxWithLabel
            label={"Should you be visible user in Group for others?"}
            id={"isActive"}
          />
          {/*isAdmin*/}
          <CheckboxWithLabel
            label={
              "Should you be able to manage users (add/remove) in this group?"
            }
            id={"isAdmin"}
            defaultChecked={true}
          />
          {/*canView*/}
          <CheckboxWithLabel
            label={
              "Should you be able to see this group in your lists of vacations?"
            }
            id={"canView"}
            defaultChecked={true}
          />
          {/*canApprove*/}
          <CheckboxWithLabel
            label={
              "Should you be able to approve vacation/home office in this group?"
            }
            id={"canApprove"}
            defaultChecked={true}
          />
          <input
            className={"hidden"}
            value={data.slug}
            readOnly
            name={"slug"}
          />
          <ul>
            {newGroupFormState.errors &&
              Object.keys(newGroupFormState.errors!).map((error) => (
                <li key={error}>{newGroupFormState.errors![error]}</li>
              ))}
          </ul>
          <DialogFooter>
            <FormSubmitButton>Submit</FormSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupAddComponent;
