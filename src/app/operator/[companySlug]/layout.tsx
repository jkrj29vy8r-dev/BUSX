import type { ReactNode } from "react";
import { OperatorShell } from "@/components/operator/operator-shell";

export default async function OperatorCompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  return <OperatorShell companySlug={companySlug}>{children}</OperatorShell>;
}
