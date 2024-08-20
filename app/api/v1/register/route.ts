import { NextResponse } from "next/server";
import { insertUser, User } from "@/drizzle/users";

export async function POST(request: Request) {
  const response = await request.json();

  if (response.type === "user.created") {
    const userObject: User = {
      clerkId: response.data.id,
      name: response.data.first_name + " " + response.data.last_name,
      email: response.data.email_addresses[0].email_address,
    };

    await insertUser(userObject);

    return NextResponse.json({ message: "success" }, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "Error creating user." },
      { status: 400 }
    );
  }
}
