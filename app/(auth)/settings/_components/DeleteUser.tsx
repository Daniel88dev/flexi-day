"use client";

import { useState } from "react";
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
import CheckboxWithLabel from "@/components/custom/CheckboxWithLabel";
import {
  deleteUser,
  DeleteUserType,
} from "@/app/(auth)/settings/settingActions";
import { toast } from "sonner";

type State = {
  groupDelete: boolean;
  companyDelete: boolean;
};

const DeleteUser = ({
  userId,
  groupId,
  companyId,
  userName,
  companyAdmin,
}: {
  userId: number;
  groupId: number;
  companyId: number;
  userName: string;
  companyAdmin: boolean;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);
  const [data, setData] = useState<State>({
    groupDelete: false,
    companyDelete: false,
  });

  const handleGroupDeleteChange = (status: boolean) => {
    setData((prevState) => {
      return { ...prevState, groupDelete: status };
    });
  };

  const handleCompanyDeleteChange = (status: boolean) => {
    setData((prevState) => {
      return { ...prevState, companyDelete: status };
    });
  };

  const handleDeleteClick = async () => {
    setPending(true);

    const deleteData: DeleteUserType = {
      userId: userId,
      groupId: groupId,
      companyId: companyId,
      groupDelete: data.groupDelete,
      companyDelete: data.companyDelete,
    };

    const result = await deleteUser(deleteData);

    if (!result.success) {
      toast.error(result.message);
      setPending(false);
    } else {
      toast(result.message);
      setPending(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"destructive"}>Delete</Button>
      </DialogTrigger>
      <DialogContent className={"sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>Delete User {userName}</DialogTitle>
          <DialogDescription>
            Confirm deleting user from group, or also from company if needed.
            User will loose access to Group/company, but records of vacations
            and other history records will be kept.
          </DialogDescription>
        </DialogHeader>
        <CheckboxWithLabel
          label={"Confirm deleting user."}
          id={"groupDelete"}
          checked={data.groupDelete}
          onCheckedChange={handleGroupDeleteChange}
        />
        <CheckboxWithLabel
          label={"Delete" + " user also from company"}
          id={"companyDelete"}
          checked={data.companyDelete}
          onCheckedChange={handleCompanyDeleteChange}
          disabled={!companyAdmin}
        />
        <DialogFooter>
          <Button
            variant={"destructive"}
            disabled={pending || !data.groupDelete}
            onClick={handleDeleteClick}
          >
            Delete user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUser;
