import { api } from "./client";
import type { SignUpWithTeamInput, SignUpWithTeamResponse } from "./types";

export function signUpWithTeam(input: SignUpWithTeamInput): Promise<SignUpWithTeamResponse> {
  return api<SignUpWithTeamResponse>(`/api/auth/sign-up-with-team`, {
    method: "POST",
    body: input,
  });
}
