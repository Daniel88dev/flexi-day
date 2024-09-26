import { SettingGroupUsersType } from "@/app/(auth)/settings/settingActions";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Props = {
  userData: SettingGroupUsersType;
  editable: boolean;
  groupId: number;
};
const SettingUserRow = ({ userData, editable, groupId }: Props) => {
  return (
    <TableRow>
      <TableCell>{userData.userName}</TableCell>
      <TableCell>{userData.userEmail}</TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-compAdmin`}
          disabled
          checked={userData.companyAdmin}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-groupAdmin`}
          disabled
          checked={userData.groupAdmin}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-isActive`}
          disabled
          checked={userData.isActive}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-canView`}
          disabled
          checked={userData.canView}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          id={`checkbox-${groupId}-${userData.userId}-canApprove`}
          disabled
          checked={userData.canApprove}
        />
      </TableCell>
      <TableCell>
        <Button>Edit</Button>
      </TableCell>
    </TableRow>
  );
};

export default SettingUserRow;
