import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { deleteUser, insertUser, updatedUser, User } from "@/drizzle/users";
import { WebhookEvent, UserJSON } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  //Below code is security protection for clerk webhook API
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { message: "Error occured -- no svix headers" },
      {
        status: 400,
      }
    );
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  if (evt.type === "user.created") {
    const userObject: User = {
      clerkId: evt.data.id,
      name: evt.data.first_name + " " + evt.data.last_name,
      email: evt.data.email_addresses[0].email_address,
    };

    await insertUser(userObject);

    return NextResponse.json(
      { message: "User Created", userId: userObject.clerkId },
      { status: 201 }
    );
  } else if (evt.type === "user.updated") {
    const defaultEmailId = evt.data.primary_email_address_id;

    const defaultEmailObject = evt.data.email_addresses.find((emailObject) => {
      return defaultEmailId === emailObject.id;
    });

    const userObject: User = {
      clerkId: evt.data.id,
      name: evt.data.first_name + " " + evt.data.last_name,
      email: defaultEmailObject!.email_address,
    };
    await updatedUser(userObject);

    console.log(userObject);
    return NextResponse.json(
      {
        message: "User updated",
        userId: userObject.clerkId,
        newEmail: defaultEmailObject!.email_address,
      },
      { status: 202 }
    );
  } else if (evt.type === "user.deleted") {
    const clerkId = evt.data.id!;

    await deleteUser(clerkId);
    return NextResponse.json(
      { message: "User deleted", clerkId },
      { status: 202 }
    );
  } else {
    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  }
}
