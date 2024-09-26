import CompanyAddComponent from "@/app/(auth)/settings/_components/CompanyAddComponent";
import { loadCompanyGroupsAndUserData } from "@/app/(auth)/settings/settingActions";
import CompanyWrapper from "@/app/(auth)/settings/_components/CompanyWrapper";

const SettingsPage = async () => {
  const companiesData = await loadCompanyGroupsAndUserData();

  return (
    <div className={"container"}>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      {companiesData.map((companyData) => (
        <CompanyWrapper
          key={`company-${companyData.companyId}`}
          companyData={companyData}
        />
      ))}

      <CompanyAddComponent />
    </div>
  );
};

export default SettingsPage;
