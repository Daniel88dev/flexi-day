"use client";

import {
  CompanyDetailType,
  SettingGroupDataType,
} from "@/app/(auth)/settings/settingActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GroupAddComponent from "@/app/(auth)/settings/_components/GroupAddComponent";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SettingUserRow from "@/app/(auth)/settings/_components/SettingUserRow";
import TableHeadWithHover from "@/components/custom/TableHeadWithHover";

type Props = {
  groupData: SettingGroupDataType;
  companyId: number;
  companyAdmin: boolean;
};

const GroupComponent = ({ groupData, companyId, companyAdmin }: Props) => {
  return (
    <Card className={"m-2"}>
      <CardHeader>
        <CardTitle>Group: {groupData.groupName}</CardTitle>
        <CardDescription>slug: {groupData.groupSlug}</CardDescription>
        <CardDescription>
          default Vacation Quota: {groupData.vacationDefault} days
        </CardDescription>
        <CardDescription>
          default Home Office Quota: {groupData.homeOfficeDefault} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>User Email</TableHead>
              <TableHeadWithHover
                hoverDetail={
                  "Should be user able to manage permissions of whole Company users? (Only company admin can modify)"
                }
              >
                Company Admin
              </TableHeadWithHover>
              <TableHeadWithHover
                hoverDetail={
                  "Should be user able to manage users in this Group?"
                }
              >
                Group Admin
              </TableHeadWithHover>
              <TableHeadWithHover
                hoverDetail={
                  "Should be user visible in Group for others users in Group?"
                }
              >
                Active user
              </TableHeadWithHover>
              <TableHeadWithHover
                hoverDetail={
                  "Should be user able to see this group in his lists of vacation? (suggested: yes)"
                }
              >
                Can view Group
              </TableHeadWithHover>
              <TableHeadWithHover
                hoverDetail={
                  "Should be user able to approve vacation/home office and other events?"
                }
              >
                Can Approve
              </TableHeadWithHover>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupData.groupUsers.map((user) => (
              <SettingUserRow
                key={`user-${groupData.groupId}-${user.userId}`}
                userData={user}
                editable={groupData.canEdit}
                groupId={groupData.groupId}
                companyId={companyId}
                groupName={groupData.groupName}
                companyAdmin={companyAdmin}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button id={"test"}>Button to add user</Button>
      </CardFooter>
    </Card>
  );
};

export default GroupComponent;
