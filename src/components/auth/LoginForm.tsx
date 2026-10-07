"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";
type LoginInput = z.infer<typeof loginSchema>;
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/forms";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

export function LoginForm({ dict, lang }: { dict: any; lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || `/${lang}`;

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setServerError(dict.errors.rateLimit);
        } else {
          setServerError(dict.errors.invalidEmailPassword);
        }
        return;
      }

      toast(dict.auth.loginSuccess);
      
      const safeNext = result.redirectTo || next;
      window.location.href = safeNext;
    } catch (error) {
      setServerError(dict.errors.unknown);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-heading font-bold mb-6 text-center">
        {dict.auth.login}
      </h1>
      
      {serverError && (
        <div className="mb-4 p-3 rounded-md bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? dict.auth.loggingIn : dict.auth.login}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {dict.auth.dontHaveAccount}{" "}
        <Link
          href={`/${lang}/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="text-[var(--accent)] hover:underline"
        >
          {dict.auth.signup}
        </Link>
      </div>
    </Card>
  );
}
