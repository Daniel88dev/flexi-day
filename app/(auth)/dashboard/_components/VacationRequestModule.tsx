"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const VacationRequestModule = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [singleDate, setSingleDate] = useState<Date>();

  console.log(open);
  console.log(singleDate);

  useEffect(() => {
    if (!open) {
      setSingleDate(undefined); // Reset any internal states affected
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Request Vacation</Button>
      </DialogTrigger>
      <DialogContent className={"sm:max-w-[450px] h-[800px]"}>
        <DialogHeader>
          <DialogTitle>Request Vacation</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={"single"} className={"w-[400px]"}>
          <TabsList className={"w-[400px]"}>
            <TabsTrigger className={"w-[200px]"} value={"single"}>
              Single
            </TabsTrigger>
            <TabsTrigger className={"w-[200px]"} value={"multiple"}>
              Multiple
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"single"}>
            <Card>
              <CardContent>
                <Label htmlFor={"single-day"}>Select Vacation Day</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !singleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {singleDate ? (
                        format(singleDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar
                      mode="single"
                      selected={singleDate}
                      onSelect={setSingleDate}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value={"multiple"}>Multiple content</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VacationRequestModule;
