"use client";

import { Button } from "@/components/ui/button";

const TestEmailSend = () => {
  const onClick = async () => {
    console.log("clicked");
  };

  return <Button onClick={onClick}>Test</Button>;
};

export default TestEmailSend;
