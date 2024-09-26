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

type Props = {
  groupData: SettingGroupDataType;
};

const GroupComponent = ({ groupData }: Props) => {
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
              <TableHead>Company Admin</TableHead>
              <TableHead>Group Admin</TableHead>
              <TableHead>Active user</TableHead>
              <TableHead>Can view Group</TableHead>
              <TableHead>Can Approve</TableHead>
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
