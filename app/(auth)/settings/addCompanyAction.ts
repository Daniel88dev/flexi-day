"use server";

import { getUserId } from "@/drizzle/users";
import xss from "xss";
import { CompanyType, insertCompany } from "@/drizzle/company";
import { CompanyUsersType, insertCompanyUser } from "@/drizzle/companyUsers";

export type SubmitNewCompanyType = {
  success: boolean;
  errors: null | {
    [key: string]: string | undefined;
  };
};

export const submitNewCompany = async (
  prevState: SubmitNewCompanyType,
  formData: FormData
) => {
  const userId = await getUserId();
  const companyName = xss(formData.get("companyName") as string);
  const companySlug = xss(formData.get("slug") as string);
  const vacation = +formData.get("vacation")!;
  const homeOffice = +formData.get("homeOffice")!;

  let errors: {
    server?: string;
    companyName?: string;
    companySlug?: string;
    vacation?: string;
    homeOffice?: string;
  } = {};

  console.log(formData);
  console.log(companySlug);

  if (!companyName || companyName.length > 50) {
    errors.companyName =
      "Incorrect company Name format. Maximum length of characters is 50.";
  }

  if (!companySlug || companySlug.length > 40) {
    errors.companySlug =
      "Incorrect company slug format. Maximum length of characters is 40.";
  }

  if (!vacation || isNaN(vacation)) {
    errors.vacation = "Incorrect vacation format. Vacation needs to be number.";
  }

  if (!homeOffice || isNaN(homeOffice)) {
    errors.vacation =
      "Incorrect home office format. Home office needs to be number.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ...prevState,
      errors,
    };
  }

  const companyData: CompanyType = {
    name: companyName,
    companySlug: companySlug,
    vacationDefault: vacation,
    homeOfficeDefault: homeOffice,
    managerId: userId,
  };

  const companyId = await insertCompany(companyData);

  if (!companyId || isNaN(companyId[0].insertedId)) {
    errors.server = "Error on making change in DB";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ...prevState,
      errors,
    };
  }

  const companyUserData: CompanyUsersType = {
    userId: userId,
    companyId: companyId[0].insertedId,
    isAdmin: true,
  };

  const companyUserId = await insertCompanyUser(companyUserData);

  if (!companyUserId || isNaN(companyUserId[0].insertedId)) {
    errors.server = "Error on making change in DB";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ...prevState,
      errors,
    };
  }

  return { ...prevState, success: true };
};
