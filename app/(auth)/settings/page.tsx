import CompanyAddComponent from "@/app/(auth)/settings/_components/CompanyAddComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCompanyDetails } from "@/app/(auth)/settings/settingActions";
import GroupComponent from "@/app/(auth)/settings/_components/GroupComponent";

const SettingsPage = async () => {
  const companiesArray = await loadCompanyDetails();

  return (
    <div className={"container"}>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <h2 className={"text-xl font-medium"}>Company details</h2>
      {companiesArray.map((company) => (
        <GroupComponent key={company.companyId} companyDetail={company} />
      ))}
      <CompanyAddComponent />
    </div>
  );
};

export default SettingsPage;
