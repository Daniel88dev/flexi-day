"use server";

import { getUserId } from "@/drizzle/users";
import xss from "xss";
import {
  CompanyType,
  getCompanyDetailsById,
  insertCompany,
} from "@/drizzle/company";
import {
  checkUserCompanyPermission,
  CompanyUsersType,
  getCompaniesForUser,
  insertCompanyUser,
} from "@/drizzle/companyUsers";

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
    errors.homeOffice =
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

export type CompanyDetailType = {
  companyId: number;
  name: string;
  vacationDefault: number;
  homeOfficeDefault: number;
};

export const loadCompanyDetails = async () => {
  const userId = await getUserId();

  const companiesForUser = await getCompaniesForUser(userId);

  const formatedCompaniesDetails: CompanyDetailType[] = [];

  for (const company of companiesForUser) {
    const companyDetails = await getCompanyDetailsById(company.companyId);
    formatedCompaniesDetails.push({
      companyId: companyDetails.id,
      name: companyDetails.name,
      vacationDefault: companyDetails.vacationDefault,
      homeOfficeDefault: companyDetails.homeOfficeDefault,
    });
  }

  return formatedCompaniesDetails;
};

export type SubmitNewGroupType = {
  success: boolean;
  companyId: number;
  errors: null | {
    [key: string]: string | undefined;
  };
};

export const submitNewGroup = async (
  prevState: SubmitNewGroupType,
  formData: FormData
) => {
  const userId = await getUserId();

  let errors: {
    server?: string;
    groupName?: string;
    groupSlug?: string;
    vacation?: string;
    homOffice?: string;
    permission?: string;
  } = {};

  const userPermission = await checkUserCompanyPermission(
    prevState.companyId,
    userId
  );

  if (!userPermission) {
    errors.permission = "You dont have permission to add new group";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ...prevState,
      errors,
    };
  }

  return { ...prevState, success: true };
};
