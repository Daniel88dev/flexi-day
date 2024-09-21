"use client";

import { ChangeEvent, useState } from "react";
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
import { CompanyDetailType } from "@/app/(auth)/settings/settingActions";
import { slugifyText } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CheckboxWithLabel from "@/components/custom/CheckboxWithLabel";

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
        <form>
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
          <div className="flex items-center space-x-2">
            <Checkbox id={"isActive"} />
            <Label
              htmlFor={"isActive"}
              className={
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              }
            >
              Should you be visible user in Group for others?
            </Label>
          </div>
          <CheckboxWithLabel
            label={"Should you be visible user in Group for others?"}
            id={"isActive"}
          />
          {/*isAdmin*/}
          {/*canView*/}
          {/*canApprove*/}
          <DialogFooter>
            <Button type={"submit"}>Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupAddComponent;
