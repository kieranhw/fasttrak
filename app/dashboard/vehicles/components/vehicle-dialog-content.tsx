import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "./add-vehicle-form/vehicle-form";
import { VehicleSchema } from "./add-vehicle-form/vehicle-schema";
import * as z from "zod";
import { Vehicle } from '@/types/vehicle';

interface VehicleDialogProps {
  vehicle?: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof VehicleSchema>) => Promise<void>;
  dialogTitle: string;
  dialogDescription: string;
  submitting: boolean;
}

export const VehicleDialogContent: React.FC<VehicleDialogProps> = ({ vehicle, open, onOpenChange, onSubmit, dialogTitle, dialogDescription, submitting }) => {
  return (

    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          {dialogDescription}
        </DialogDescription>
        <VehicleForm vehicle={vehicle} onSubmit={onSubmit} submitting={submitting} />
      </DialogHeader>
    </DialogContent>

  );
};
