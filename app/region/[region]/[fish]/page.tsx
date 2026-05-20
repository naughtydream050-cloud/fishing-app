import { redirect } from 'next/navigation'

type Props = { params: Promise<{ region: string; fish: string }> }

export async function generateStaticParams() {
  return []
}

export default async function FishRedirect({ params }: Props) {
  const { region } = await params
  redirect(`/areas/${region}`)
}
