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
  getCompaniesIdForUser,
  insertCompanyUser,
  updateCompanyUserPermission,
  UpdateCompanyUserPermissionType,
} from "@/drizzle/companyUsers";
import {
  getGroupsForCompany,
  insertWorkingGroup,
  WorkingGroupType,
} from "@/drizzle/workingGroup";
import {
  checkUserGroupAdmin,
  getUsersForGroup,
  GroupUsersType,
  insertGroupUser,
  updateUserGroupPermissions,
  UpdateUserGroupPermissionsType,
} from "@/drizzle/groupUsers";
import { createUserQuotasRecord, UserQuotasType } from "@/drizzle/userQuotas";

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

  const userQuotaData: UserQuotasType = {
    userId: userId,
    companyId: companyId[0].insertedId,
    vacationQuota: vacation,
    vacationSpend: 0,
    homeOfficeQuota: homeOffice,
    homeOfficeSpend: 0,
    activeYear: new Date().getFullYear().toString(),
  };

  const insertedUserQuotas = await createUserQuotasRecord(userQuotaData);

  if (!insertedUserQuotas || isNaN(insertedUserQuotas[0].insertedId)) {
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
  const groupName = xss(formData.get("groupName") as string);
  const groupSlug = xss(formData.get("slug") as string);
  const vacation = +formData.get("vacation")!;
  const homeOffice = +formData.get("homeOffice")!;
  const isAdminRaw = formData.get("isAdmin") as string;
  const isAdmin: boolean = isAdminRaw === "on";
  const isVisibleRaw = formData.get("isActive") as string;
  const isVisible: boolean = isVisibleRaw === "on";
  const canViewRaw = formData.get("canView") as string;
  const canView: boolean = canViewRaw === "on";
  const canApproveRaw = formData.get("canApprove") as string;
  const canApprove: boolean = canApproveRaw === "on";

  let errors: {
    server?: string;
    groupName?: string;
    groupSlug?: string;
    vacation?: string;
    homeOffice?: string;
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

  if (!groupName || groupName.length > 50) {
    errors.groupName =
      "Incorrect group Name format. Maximum length of characters is 50.";
  }

  if (!groupSlug || groupSlug.length > 40) {
    errors.groupSlug =
      "Incorrect group Slug format. Maximum length of characters is 40.";
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

  const groupData: WorkingGroupType = {
    groupSlug: groupSlug,
    groupName: groupName,
    groupAdmin: userId,
    vacationDefault: vacation,
    homeOfficeDefault: homeOffice,
    companyId: prevState.companyId,
  };

  const groupId = await insertWorkingGroup(groupData);

  const groupUser: GroupUsersType = {
    userId: userId,
    groupId: groupId[0].insertedId,
    isActive: isVisible,
    isAdmin: isAdmin,
    canView: canView,
    canApprove: canApprove,
  };

  const groupUserId = await insertGroupUser(groupUser);

  if (!groupUserId || isNaN(groupUserId[0].insertedId)) {
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

export type SettingGroupUsersType = {
  userId: number;
  userName: string;
  userEmail: string;
  companyAdmin: boolean;
  groupAdmin: boolean;
  isActive: boolean;
  canView: boolean;
  canApprove: boolean;
};

export type SettingGroupDataType = {
  groupId: number;
  groupName: string;
  groupSlug: string;
  vacationDefault: number;
  homeOfficeDefault: number;
  canEdit: boolean;
  groupUsers: SettingGroupUsersType[];
};

export type SettingCompanyDataType = {
  companyId: number;
  companyName: string;
  companySlug: string;
  vacationDefault: number;
  homeOfficeDefault: number;
  isUserAdmin: boolean;
  companyGroups: SettingGroupDataType[];
};

export const loadCompanyGroupsAndUserData = async () => {
  const userId = await getUserId();

  const companies = await getCompaniesIdForUser(userId);

  const companiesData: SettingCompanyDataType[] = [];

  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const groups = await getGroupsForCompany(
      companies[companyIndex].companyId!
    );

    const groupArray: SettingGroupDataType[] = [];

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const groupUsers = await getUsersForGroup(groups[groupIndex].groupId);

      const groupUsersArray: SettingGroupUsersType[] = [];

      for (let userIndex = 0; userIndex < groupUsers.length; userIndex++) {
        groupUsersArray.push({
          userId: groupUsers[userIndex].userId!,
          userName: groupUsers[userIndex].userName!,
          userEmail: groupUsers[userIndex].userEmail!,
          companyAdmin: groupUsers[userIndex].companyAdmin!,
          groupAdmin: groupUsers[userIndex].groupAdmin!,
          isActive: groupUsers[userIndex].isActive!,
          canView: groupUsers[userIndex].canView!,
          canApprove: groupUsers[userIndex].canApprove!,
        });
      }
      const checkPermission = await checkUserGroupAdmin(
        groups[groupIndex].groupId,
        userId
      );

      groupArray.push({
        groupId: groups[groupIndex].groupId!,
        groupName: groups[groupIndex].groupName!,
        groupSlug: groups[groupIndex].groupSlug!,
        vacationDefault: groups[groupIndex].vacationDefault!,
        homeOfficeDefault: groups[groupIndex].homeOfficeDefault!,
        canEdit: checkPermission.isAdmin,
        groupUsers: groupUsersArray,
      });
    }

    companiesData.push({
      companyId: companies[companyIndex].companyId!,
      companyName: companies[companyIndex].companyName!,
      companySlug: companies[companyIndex].companySlug!,
      vacationDefault: companies[companyIndex].vacationDefault!,
      homeOfficeDefault: companies[companyIndex].homeOfficeDefault!,
      isUserAdmin: companies[companyIndex].isUserAdmin!,
      companyGroups: groupArray,
    });
  }

  return companiesData;
};

export type UpdateUserPermissionType = {
  userId: number;
  companyId: number;
  groupId: number;
  previousCompanyAdmin: boolean;
  companyAdmin: boolean;
  isAdmin: boolean;
  isActive: boolean;
  canView: boolean;
  canApprove: boolean;
  wasUpdated: boolean;
};

export const updateUserPermissions = async (
  userData: UpdateUserPermissionType
) => {
  const activeUserId = await getUserId();

  const checkGroupPermission = await checkUserGroupAdmin(
    userData.groupId,
    activeUserId
  );

  if (!checkGroupPermission.isAdmin) {
    return {
      success: false,
      message: "You dont have permission to make changes.",
    };
  }

  let companyChangeSuccess: boolean = false;

  if (userData.previousCompanyAdmin !== userData.companyAdmin) {
    const checkAdminPermission = await checkUserCompanyPermission(
      userData.companyId,
      activeUserId
    );

    if (!checkAdminPermission.permission) {
      return {
        success: false,
        message: "You dont have permission to change company permissions.",
      };
    }

    const adminUpdateData: UpdateCompanyUserPermissionType = {
      companyId: userData.companyId,
      userId: userData.userId,
      isAdmin: userData.companyAdmin,
    };

    const companyUpdate = await updateCompanyUserPermission(adminUpdateData);

    if (
      typeof companyUpdate[0].updateId === "number" &&
      !isNaN(companyUpdate[0].updateId)
    ) {
      companyChangeSuccess = true;
    }
  } else companyChangeSuccess = true;

  const groupUpdateData: UpdateUserGroupPermissionsType = {
    userId: userData.userId,
    groupId: userData.groupId,
    isActive: userData.isActive,
    isAdmin: userData.isAdmin,
    canView: userData.canView,
    canApprove: userData.canApprove,
  };
  let groupChangeSuccess: boolean = false;

  const groupUpdate = await updateUserGroupPermissions(groupUpdateData);

  if (
    typeof groupUpdate[0].updatedId === "number" &&
    !isNaN(groupUpdate[0].updatedId)
  ) {
    groupChangeSuccess = true;
  }

  if (!companyChangeSuccess || !groupChangeSuccess) {
    return {
      success: false,
      message: "Updating permissions of user was not successful.",
    };
  }

  return { success: true, message: "Successfully updated" };
};
