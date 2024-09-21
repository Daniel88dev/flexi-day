"use client";

import { CompanyDetailType } from "@/app/(auth)/settings/settingActions";
import { Card } from "@/components/ui/card";
import GroupAddComponent from "@/app/(auth)/settings/_components/GroupAddComponent";

type Props = {
  companyDetail: CompanyDetailType;
};

const GroupComponent = ({ companyDetail }: Props) => {
  console.log(companyDetail);
  return (
    <Card>
      <h1>Group Component</h1>
      <GroupAddComponent company={companyDetail} />
    </Card>
  );
};

export default GroupComponent;
