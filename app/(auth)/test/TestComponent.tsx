"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TestComponent = () => {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState<boolean>(false);

  console.log(open);
  console.log(date);

  // Ensure modal state is reset correctly.
  useEffect(() => {
    if (!open) {
      setDate(undefined); // Reset any internal states affected
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] h-[800px]">
        <DialogHeader>
          <DialogTitle>Heading</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single" className="w-[400px]">
          <TabsList className="w-[400px]">
            <TabsTrigger className="w-[200px]" value="single">
              Single
            </TabsTrigger>
            <TabsTrigger className="w-[200px]" value="multiple">
              Multiple
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <Card>
              <CardContent>
                <Label>Label</Label>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent onClick={(e) => e.stopPropagation()}>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="multiple">
            <h1>multiple</h1>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TestComponent;
