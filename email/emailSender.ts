"use server";

import type { NextApiRequest, NextApiResponse } from "next";
import { FirstEmailTemplate } from "./FirstEmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailSend = async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: "daniel.hrynusiw@gmail.com",
      subject: "Test email",
      react: FirstEmailTemplate({ firstName: "Daniel" }),
    });

    if (error) {
      console.error(error);
    }

    console.log(data);
  } catch (error) {
    console.error(error);
    throw new Error("Error sending email.");
  }
};
