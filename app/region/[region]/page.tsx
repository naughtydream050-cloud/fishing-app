import { redirect } from 'next/navigation'

type Props = { params: Promise<{ region: string }> }

export async function generateStaticParams() {
  return []
}

export default async function RegionRedirect({ params }: Props) {
  const { region } = await params
  redirect(`/areas/${region}`)
}
