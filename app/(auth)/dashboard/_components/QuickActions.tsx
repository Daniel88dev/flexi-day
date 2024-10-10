import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Button id={"requestVacationButton"}>Request Vacation</Button>
        <Button id={"requestHomeOfficeButton"} variant="outline">
          Request Home Office
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
