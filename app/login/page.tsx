import { currentUser } from "@clerk/nextjs/server";
import { getUser } from "@/drizzle/db";
import { redirect } from "next/navigation";
import { insertUser, User } from "@/drizzle/users";

const Login = async () => {
  /*const userClerk = await currentUser();

  let userDrizzle = await getUser(userClerk?.id!);

  console.log(userDrizzle);

  if (!userDrizzle) {
    const newUser: User = {
      clerkId: userClerk?.id!,
      name: userClerk?.fullName!,
      email: userClerk?.primaryEmailAddress?.emailAddress!,
    };

    await insertUser(newUser);

    userDrizzle = await getUser(userClerk?.id!);

    if (!userDrizzle) {
      console.log("error");
    } else {
      console.log(userDrizzle);
    }
  } else {
    console.log(userDrizzle);
  }*/

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
