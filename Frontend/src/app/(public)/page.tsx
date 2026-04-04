import HomeClient from './HomeClient';

async function getPublicStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/public`, {
      next: { revalidate: 300 }, // Cache 5 minutos
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  } catch {
    return {
      totalCourts: 0,
      totalBookings: 0,
      totalCities: 0,
      avgRating: 4.8,
      featuredCourts: [],
    };
  }
}

export default async function HomePage() {
  const stats = await getPublicStats();
  return <HomeClient stats={stats} />;
}
