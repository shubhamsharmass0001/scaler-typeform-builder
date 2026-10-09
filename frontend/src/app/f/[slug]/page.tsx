import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { FormRunner } from "@/components/runner/FormRunner";
import { PublicForm } from "@/types";
import { BASE_URL } from "@/lib/api";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPublicFormData(slug: string): Promise<PublicForm | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/public/forms/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as PublicForm;
  } catch (error) {
    console.error("Failed to fetch public form:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const form = await fetchPublicFormData(slug);
  if (!form) {
    return {
      title: "Form Not Available",
      description: "This form is not available or does not exist.",
    };
  }
  return {
    title: `${form.title} | FormCraft`,
    description: form.description || "Fill out this form on FormCraft",
  };
}

async function PublicRespondentContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await fetchPublicFormData(slug);

  if (!form) {
    return (
      <div data-theme-isolated="true" className="min-h-screen w-full bg-app flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 sm:p-10 border border-subtle shadow-sm space-y-5 flex flex-col items-center animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-default text-muted flex items-center justify-center">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              This form is not available
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              This form is either unpublished, closed to new responses, or the link may be incorrect.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <FormRunner mode="live" form={form} questions={form.questions} />;
}

export default function PublicRespondentPage({ params }: PublicPageProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-800" />
        </div>
      }
    >
      <PublicRespondentContent params={params} />
    </Suspense>
  );
}
