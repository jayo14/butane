import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { ProfilePageClient } from "./page-client"

export default async function ProfilePage() {
  try {
    const profile = await api.auth.profile()
    return <ProfilePageClient profile={profile} />
  } catch {
    notFound()
  }
}
