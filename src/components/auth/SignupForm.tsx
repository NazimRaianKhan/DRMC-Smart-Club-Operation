"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validations/auth";
import { z } from "zod";
type SignupInput = z.infer<typeof signupSchema>;
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/forms";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

export function SignupForm({ dict, lang }: { dict: any; lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || `/${lang}`;

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: {
      lang: lang as any
    }
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setServerError(dict.errors.rateLimit);
        } else if (res.status === 409) {
          setServerError(dict.errors.emailInUse);
        } else {
          setServerError(result.error || dict.errors.unknown);
        }
        return;
      }

      toast(dict.auth.signupSuccess);
      const safeNext = result.redirectTo || next;
      window.location.href = safeNext;
    } catch (error) {
      setServerError(dict.errors.unknown);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 my-8">
      <h1 className="text-2xl font-heading font-bold mb-6 text-center">
        {dict.auth.signup}
      </h1>
      
      {serverError && (
        <div className="mb-4 p-3 rounded-md bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">{dict.auth.fullName}</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.fullName && (
            <FieldError error={errors.fullName.message} />
          )}
        </div>

        <div>
          <Label htmlFor="email">{dict.auth.email}</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.email && (
            <FieldError error={errors.email.message} />
          )}
        </div>

        <div>
          <Label htmlFor="password">{dict.auth.password}</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.password && (
            <FieldError error={errors.password.message} />
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">{dict.auth.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.confirmPassword && (
            <FieldError error={errors.confirmPassword.message} />
          )}
        </div>

        <div>
          <Label htmlFor="phone">{dict.auth.phone}</Label>
          <Input
            id="phone"
            {...register("phone")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.phone && (
            <FieldError error={errors.phone.message} />
          )}
        </div>

        <div>
          <Label htmlFor="institution">{dict.auth.institution}</Label>
          <Input
            id="institution"
            {...register("institution")}
            disabled={isLoading}
            className="mt-1"
          />
          {errors.institution && (
            <FieldError error={errors.institution.message} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="classLevel">{dict.auth.classLevel}</Label>
            <Input
              id="classLevel"
              {...register("classLevel")}
              disabled={isLoading}
              className="mt-1"
            />
            {errors.classLevel && (
              <FieldError error={errors.classLevel.message} />
            )}
          </div>
          <div>
            <Label htmlFor="studentId">{dict.auth.studentId}</Label>
            <Input
              id="studentId"
              {...register("studentId")}
              disabled={isLoading}
              className="mt-1"
            />
            {errors.studentId && (
              <FieldError error={errors.studentId.message} />
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? dict.auth.creatingAccount : dict.auth.signup}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {dict.auth.alreadyHaveAccount}{" "}
        <Link
          href={`/${lang}/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="text-[var(--accent)] hover:underline"
        >
          {dict.auth.login}
        </Link>
      </div>
    </Card>
  );
}
