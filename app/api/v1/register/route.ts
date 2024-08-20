import { NextResponse } from "next/server";
import { insertUser, updatedUser, User } from "@/drizzle/users";

export async function POST(request: Request) {
  const response = await request.json();

  if (response.type === "user.created") {
    const userObject: User = {
      clerkId: response.data.id,
      name: response.data.first_name + " " + response.data.last_name,
      email: response.data.email_addresses[0].email_address,
    };

    await insertUser(userObject);

    return NextResponse.json(
      { message: "User Created", userId: userObject.clerkId },
      { status: 201 }
    );
  } else if (response.type === "user.updated") {
    const userObject: User = {
      clerkId: response.data.id,
      name: response.data.first_name + " " + response.data.last_name,
      email: response.data.email_addresses[0].email_address,
    };
    await updatedUser(userObject);

    console.log(userObject);
    return NextResponse.json(
      { message: "User updated", userId: userObject.clerkId },
      { status: 202 }
    );
  } else {
    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  }
}
