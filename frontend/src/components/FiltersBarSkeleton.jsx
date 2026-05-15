import { Skeleton } from './ui/skeleton';
import { sectorConfig } from '../lib/config';

/**
 * FiltersBarSkeleton — reproduit fidèlement la hauteur/layout de FiltersBar
 * pour éviter tout layout shift lors du chargement initial.
 */
const FiltersBarSkeleton = () => {
  const sectorCount = Object.keys(sectorConfig).length;

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-border animate-pulse">
      <div className="flex flex-col gap-4">

        {/* Ligne 1 : search + selects */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Selects */}
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-[130px] rounded-md" />
            <Skeleton className="h-10 w-[140px] rounded-md" />
            <Skeleton className="h-10 w-[130px] rounded-md" />
          </div>
        </div>

        {/* Ligne 2 : pills secteurs */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: sectorCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-full"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FiltersBarSkeleton;
