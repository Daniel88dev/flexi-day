import { TableHead } from "@/components/ui/table";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ReactNode } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";

type Props = {
  children: ReactNode;
  hoverDetail: string;
};

const TableHeadWithHover = ({ children, hoverDetail }: Props) => {
  return (
    <TableHead>
      <HoverCard>
        <HoverCardTrigger className={"flex items-center gap-1"}>
          {children}
          <IoIosInformationCircleOutline />
        </HoverCardTrigger>
        <HoverCardContent>{hoverDetail}</HoverCardContent>
      </HoverCard>
    </TableHead>
  );
};

export default TableHeadWithHover;
