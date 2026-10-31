import ClubCard from '@/components/clubs/ClubCard';
import { Club } from '@/types/club.types';
import { Building2 } from 'lucide-react';

interface ClubListProps {
  clubs: Club[];
  onSelect: (club: Club) => void;
}

export default function ClubList({ clubs, onSelect }: ClubListProps) {
  if (!clubs.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <Building2 className="h-14 w-14 text-gray-300 mx-auto" strokeWidth={1.5} />
        <p className="text-xl font-black text-gray-900 uppercase">No hay clubs disponibles</p>
        <p className="text-gray-500 text-sm">Intenta con otro deporte</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {clubs.map((club) => (
        <ClubCard key={club._id} club={club} onClick={() => onSelect(club)} />
      ))}
    </div>
  );
}
