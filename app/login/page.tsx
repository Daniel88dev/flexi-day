import { currentUser } from "@clerk/nextjs/server";
import { db, getUser } from "@/drizzle/db";
import { redirect } from "next/navigation";
import { users } from "@/db/schema";
import { UsersTable } from "@/drizzle/schema";

const Login = async () => {
  const userClerk = await currentUser();

  console.log(userClerk?.id);
  console.log(userClerk?.fullName);
  console.log(userClerk?.primaryEmailAddress?.emailAddress);

  let userDrizzle = await getUser(userClerk?.id!);

  console.log(userDrizzle);

  if (!userDrizzle) {
    await db.insert(UsersTable).values({
      clerkId: userClerk?.id,
      name: userClerk?.fullName,
      email: userClerk?.primaryEmailAddress?.emailAddress,
    });

    userDrizzle = await getUser(userClerk?.id!);

    if (!userDrizzle) {
      console.log("error");
    } else {
      console.log(userDrizzle);
    }
  } else {
    console.log(userDrizzle);
  }

  /*



  */
  //redirect("/welcome");

  return (
    <>
      <h1>Login test</h1>
    </>
  );
};

export default Login;
