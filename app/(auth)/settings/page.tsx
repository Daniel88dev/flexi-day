import CompanyAddComponent from "@/app/(auth)/settings/CompanyAddComponent";
import TestEmailSend from "@/app/(auth)/settings/TestEmailSend";

const SettingsPage = () => {
  return (
    <>
      <h1>Settings</h1>
      <CompanyAddComponent />
      <TestEmailSend />
    </>
  );
};

export default SettingsPage;
