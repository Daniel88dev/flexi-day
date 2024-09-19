import CompanyAddComponent from "@/app/(auth)/settings/CompanyAddComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsPage = () => {
  return (
    <div className={"container grid gap-6 md:gap-8 lg:grid-cols-2"}>
      <div className={"space-y-6"}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Card>
          <CardHeader
            className={
              "flex flex-row items-center justify-between space-y-0 pb-2"
            }
          >
            <CardTitle className={"text-sm font-medium"}>
              Company details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyAddComponent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
