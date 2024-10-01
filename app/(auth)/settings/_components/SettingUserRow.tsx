"use client";
import { SettingGroupUsersType } from "@/app/(auth)/settings/settingActions";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useState } from "react";

type Props = {
  userData: SettingGroupUsersType;
  editable: boolean;
  groupId: number;
  companyId: number;
  groupName: string;
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
  groupName,
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
      <TableCell>
        <Button variant={"default"} type={"submit"}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default SettingUserRow;
