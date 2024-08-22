import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Home = async () => {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main>
      <h1>Welcome on Home Page</h1>
    </main>
  );
};

export default Home;
