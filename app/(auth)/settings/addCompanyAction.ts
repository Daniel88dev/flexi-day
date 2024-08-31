"use server";

import { getUserId } from "@/drizzle/users";

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

  console.log(formData);
  console.log(userId);

  return { ...prevState, success: true };
};
