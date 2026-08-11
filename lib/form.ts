"use client";

import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";

export { zodResolver };

export function useZodForm<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
  defaultValues?: DefaultValues<TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, "resolver" | "defaultValues">,
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
    ...options,
  });
}
