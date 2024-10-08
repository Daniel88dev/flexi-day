import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Props = {
  type: "vacation" | "homeOffice";
  used: number;
  total: number;
};

const VacationCard = ({ type, used, total }: Props) => {
  return (
    <Card>
      <CardHeader
        className={"flex flex-row items-center justify-between space-y-0 pb-2"}
      >
        <CardTitle className={"text-sm font-medium"}>
          {type === "vacation" ? "Vacation Days" : "Home Office Days"}
        </CardTitle>
        <CalendarIcon className={"h-4 w-4 text-muted-foreground"} />
      </CardHeader>
      <CardContent>
        <div className={"text-2xl font-bold"}>
          {used} / {total}
        </div>
        <Progress value={(used / total) * 100} className={"mt-2"} />
        <p className={"text-xs text-muted-foreground mt-2"}>
          Days used this year
        </p>
      </CardContent>
    </Card>
  );
};

export default VacationCard;
