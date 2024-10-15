"use server";

import { getUserId } from "@/drizzle/users";
import { getGroupsForUser } from "@/drizzle/groupUsers";
import {
  getDefaultGroupId,
  insertUserDefaultGroup,
  UserDefaultGroupType,
} from "@/drizzle/userDefaulGroup";
import { revalidatePath } from "next/cache";
import { getGroupDataForDashboard } from "@/drizzle/workingGroup";
import { getUserQuotasForSelectedYear } from "@/drizzle/userQuotas";

export const submitDefaultGroup = async (groupId: number) => {
  const userId = await getUserId();

  if (!groupId) {
    return { success: false, message: "No group selected." };
  } else if (isNaN(groupId)) {
    return { success: false, message: "Invalid group selection." };
  }

  if (!userId) {
    return { success: false, message: "Error loading active user." };
  }

  const defaultGroupUpdateData: UserDefaultGroupType = {
    groupId: groupId,
    userId: userId,
  };

  const updateResult = await insertUserDefaultGroup(defaultGroupUpdateData);

  if (isNaN(updateResult)) {
    return { success: false, message: "Error updating default group." };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Successfully updated default group." };
};

export type DashboardGroupArrayType = {
  groupId: number;
  groupName: string;
};

export type DashboardGroupDataType = null | {
  companyName: string;
  homeOfficeDefault: number;
  vacationDefault: number;
  vacationUsed: number;
  vacationTotal: number;
  homeOfficeUsed: number;
  homeOfficeTotal: number;
};

export const loadDashboardInitialData = async () => {
  const userId = await getUserId();
  const date = new Date();

  const getYear = date.getFullYear().toString();
  const getMonth = date.getMonth();

  const loadedGroups = await getGroupsForUser(userId);

  const defaultGroupId = await getDefaultGroupId(userId);

  const groupsDataArray: DashboardGroupArrayType[] = loadedGroups.map(
    (group) => {
      return {
        groupId: group.groupId,
        groupName: `${group.companyName} - ${group.groupName}`,
      };
    }
  );

  let groupData: {
    companyName?: string | undefined;
    homeOfficeDefault?: number | undefined;
    vacationDefault?: number | undefined;
    vacationUsed?: number | undefined;
    vacationTotal?: number | undefined;
    homeOfficeUsed?: number | undefined;
    homeOfficeTotal?: number | undefined;
  } = {};

  if (defaultGroupId) {
    const loadedGroupData = await getGroupDataForDashboard(defaultGroupId);
    const loadedUserQuotas = await getUserQuotasForSelectedYear(
      userId,
      getYear,
      loadedGroupData.companyId
    );

    groupData = {
      companyName: loadedGroupData.companyName!,
      homeOfficeDefault: loadedGroupData.homeOfficeDefault!,
      vacationDefault: loadedGroupData.vacationDefault!,
    };

    if (getMonth === 11) {
      const nextYear = (+getYear + 1).toString();

      const loadNextYear = await getUserQuotasForSelectedYear(
        userId,
        nextYear,
        loadedGroupData.companyId
      );

      groupData = {
        ...groupData,
        vacationUsed:
          loadedUserQuotas.vacationSpend! +
          (loadNextYear ? loadNextYear.vacationSpend! : 0),
        vacationTotal:
          loadedUserQuotas.vacationQuota! + loadedGroupData.vacationDefault!,
        homeOfficeUsed:
          loadedUserQuotas.homeOfficeSpend! +
          (loadNextYear ? loadNextYear.vacationSpend! : 0),
        homeOfficeTotal:
          loadedUserQuotas.homeOfficeQuota! +
          loadedGroupData.homeOfficeDefault!,
      };
    } else {
      groupData = {
        ...groupData,
        vacationUsed: loadedUserQuotas.vacationSpend!,
        vacationTotal: loadedUserQuotas.vacationQuota!,
        homeOfficeUsed: loadedUserQuotas.homeOfficeSpend!,
        homeOfficeTotal: loadedUserQuotas.homeOfficeQuota!,
      };
    }
  }

  const finalGroupData: DashboardGroupDataType = !defaultGroupId
    ? null
    : {
        companyName: groupData.companyName!,
        homeOfficeDefault: groupData.homeOfficeDefault!,
        vacationDefault: groupData.vacationDefault!,
        vacationUsed: groupData.vacationUsed!,
        vacationTotal: groupData.vacationTotal!,
        homeOfficeUsed: groupData.homeOfficeUsed!,
        homeOfficeTotal: groupData.homeOfficeTotal!,
      };

  return {
    groupData: groupsDataArray,
    defaultGroupId: defaultGroupId,
    companyUserData: finalGroupData,
  };
};
