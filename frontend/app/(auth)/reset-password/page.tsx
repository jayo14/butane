import { ResetPasswordForm } from "@/components/auth/reset-password-form"

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token} />
}
