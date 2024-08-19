import { getUsers } from "@/drizzle/db";

const Home = async () => {
  const users = await getUsers();
  console.log("result");
  console.log(users);
  return (
    <>
      <h1>Welcome</h1>
    </>
  );
};

export default Home;
