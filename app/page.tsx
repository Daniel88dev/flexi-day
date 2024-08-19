import { currentUser } from "@clerk/nextjs/server";

const Home = async () => {
  const user = await currentUser();

  console.log(user?.fullName);

  return (
    <>
      <h1>Welcome</h1>
    </>
  );
};

export default Home;
