"use client";
import {
  SettingGroupUsersType,
  updateUserPermissions,
  UpdateUserPermissionType,
} from "@/app/(auth)/settings/settingActions";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import DeleteUser from "@/app/(auth)/settings/_components/DeleteUser";

type Props = {
  userData: SettingGroupUsersType;
  editable: boolean;
  groupId: number;
  companyId: number;
  companyAdmin: boolean;
};

type State = {
  companyAdmin: boolean;
  isAdmin: boolean;
  isActive: boolean;
  canView: boolean;
  canApprove: boolean;
  wasUpdated: boolean;
};

const SettingUserRow = ({
  userData,
  editable,
  groupId,
  companyId,
  companyAdmin,
}: Props) => {
  const [data, setData] = useState<State>({
    companyAdmin: userData.companyAdmin,
    isAdmin: userData.groupAdmin,
    isActive: userData.isActive,
    canView: userData.canView,
    canApprove: userData.canApprove,
    wasUpdated: false,
  });
  const [pending, setPending] = useState(false);

  const handleCompanyAdminChange = (status: boolean) => {
    setData((prevState) => {
      return {
        ...prevState,
        companyAdmin: status,
        wasUpdated: true,
      };
    });
  };

  const handleGroupAdminChange = (status: boolean) => {
    setData((prevState) => {
      return {
        ...prevState,
        isAdmin: status,
        wasUpdated: true,
      };
    });
  };

  const handleIsActiveChange = (status: boolean) => {
    setData((prevState) => {
      return {
        ...prevState,
        isActive: status,
        wasUpdated: true,
      };
    });
  };

  const handleCanViewChange = (status: boolean) => {
    setData((prevState) => {
      return {
        ...prevState,
        canView: status,
        wasUpdated: true,
      };
    });
  };

  const handleCanApproveChange = (status: boolean) => {
    setData((prevState) => {
      return {
        ...prevState,
        canApprove: status,
        wasUpdated: true,
      };
    });
  };

  const style = data.wasUpdated ? "bg-blue-200 dark:bg-blue-600" : "";

  const onSaveButtonClick = async () => {
    setPending(true);

    const updateDate: UpdateUserPermissionType = {
      userId: userData.userId,
      companyId: companyId,
      groupId: groupId,
      previousCompanyAdmin: companyAdmin,
      ...data,
    };

    const result = await updateUserPermissions(updateDate);
    console.log(result);
    if (!result.success) {
      toast.error(result.message);
      setPending(false);
    } else {
      toast(result.message);
      setPending(false);
      setData((prevState) => {
        return { ...prevState, wasUpdated: false };
      });
    }
  };

  return (
    <TableRow className={style}>
      <TableCell>{userData.userName}</TableCell>
      <TableCell>{userData.userEmail}</TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-compAdmin`}
          disabled={!companyAdmin}
          checked={data.companyAdmin}
          onCheckedChange={handleCompanyAdminChange}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-groupAdmin`}
          disabled={!companyAdmin || !editable}
          checked={data.isAdmin}
          onCheckedChange={handleGroupAdminChange}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-isActive`}
          disabled={!companyAdmin || !editable}
          checked={data.isActive}
          onCheckedChange={handleIsActiveChange}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-canView`}
          disabled={!companyAdmin || !editable}
          checked={data.canView}
          onCheckedChange={handleCanViewChange}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-canApprove`}
          disabled={!companyAdmin || !editable}
          checked={data.canApprove}
          onCheckedChange={handleCanApproveChange}
        />
      </TableCell>
      <TableCell className={"flex gap-2"}>
        <Button
          variant={"default"}
          disabled={pending}
          onClick={onSaveButtonClick}
        >
          Save
        </Button>
        <DeleteUser
          key={`delete-${groupId}-${userData.userId}`}
          userId={userData.userId}
          userName={userData.userName}
          groupId={groupId}
          companyId={companyId}
          companyAdmin={companyAdmin}
        />
      </TableCell>
    </TableRow>
  );
};

export default SettingUserRow;
