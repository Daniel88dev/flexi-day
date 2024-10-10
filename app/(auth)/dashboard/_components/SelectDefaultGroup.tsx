"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DashboardGroupArrayType,
  submitDefaultGroup,
} from "@/app/(auth)/dashboard/dashboardActions";
import { toast } from "sonner";

type Props = {
  groupData: DashboardGroupArrayType[];
  defaultGroupId: number | null;
};

const SelectDefaultGroup = ({ groupData, defaultGroupId }: Props) => {
  const [selectedValue, setSelectedValue] = useState(
    defaultGroupId?.toString()
  );
  const [pending, setPending] = useState(false);

  const onSubmit = async () => {
    if (!selectedValue) {
      alert("Need to select default group to submit");
    } else {
      setPending(true);
      const submit = await submitDefaultGroup(+selectedValue);

      if (!submit.success) {
        toast.error(submit.message);
        setPending(false);
      } else {
        toast(submit.message);
        setPending(false);
      }
    }
  };

  const check = () => {
    if (selectedValue === defaultGroupId?.toString()) {
      return true;
    } else return pending;
  };

  return (
    <>
      <Select onValueChange={setSelectedValue} value={selectedValue}>
        <SelectTrigger className={"w-52"}>
          <SelectValue placeholder={"Select default group"} />
        </SelectTrigger>
        <SelectContent>
          {groupData.map((group) => (
            <SelectItem
              key={`groupSelect-${group.groupId}`}
              value={group.groupId.toString()}
            >
              {group.groupName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button disabled={check()} onClick={onSubmit}>
        Save
      </Button>
    </>
  );
};

export default SelectDefaultGroup;
