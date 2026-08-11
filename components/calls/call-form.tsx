"use client";

import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_ASSISTANT_NAME } from "@/constants/api";
import { useZodForm } from "@/lib/form";
import {
  startCallFormSchema,
  type StartCallFormInput,
} from "@/validators/call";

interface CallFormProps {
  onSubmit?: (data: StartCallFormInput) => void;
  isSubmitting?: boolean;
}

export function CallForm({ onSubmit, isSubmitting = false }: CallFormProps) {
  const form = useZodForm(
    startCallFormSchema,
    {
      customerName: "",
      phoneNumber: "",
      assistantName: DEFAULT_ASSISTANT_NAME,
    },
    { mode: "onSubmit", reValidateMode: "onSubmit" },
  );

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.({
      ...data,
      assistantName: DEFAULT_ASSISTANT_NAME,
    });
  });

  return (
    <form
      id="start-call-form"
      onSubmit={handleSubmit}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-end"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          placeholder="John Smith"
          aria-invalid={!!form.formState.errors.customerName}
          {...form.register("customerName")}
        />
        {form.formState.errors.customerName ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.customerName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+15555555555"
          aria-invalid={!!form.formState.errors.phoneNumber}
          {...form.register("phoneNumber")}
        />
        {form.formState.errors.phoneNumber ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.phoneNumber.message}
          </p>
        ) : null}
      </div>

      <div>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full rounded-xl transition-transform hover:scale-[1.02] md:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          {isSubmitting ? "Starting Call..." : "Start Call"}
        </Button>
      </div>
    </form>
  );
}
