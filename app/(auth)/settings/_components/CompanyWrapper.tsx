"use client";

import { SettingCompanyDataType } from "@/app/(auth)/settings/settingActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GroupAddComponent from "@/app/(auth)/settings/_components/GroupAddComponent";
import GroupComponent from "@/app/(auth)/settings/_components/GroupComponent";

const CompanyWrapper = ({
  companyData,
}: {
  companyData: SettingCompanyDataType;
}) => {
  console.log(companyData);
  return (
    <Card className={"m-2"}>
      <CardHeader>
        <CardTitle>Company: {companyData.companyName}</CardTitle>
        <CardDescription>slug: {companyData.companySlug}</CardDescription>
        <CardDescription>
          default Vacation Quota: {companyData.vacationDefault} days
        </CardDescription>
        <CardDescription>
          default Home Office Quota: {companyData.homeOfficeDefault} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companyData.companyGroups.map((group) => (
          <GroupComponent key={`group-${group.groupId}`} groupData={group} />
        ))}
      </CardContent>
      <CardFooter>
        <GroupAddComponent company={companyData} />
      </CardFooter>
    </Card>
  );
};

export default CompanyWrapper;
