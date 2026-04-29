import SectorHeatWidget from "../components/SectorHeatWidget";

const TendancesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Tendances</h1>
        <p className="text-sm text-muted-foreground">Secteurs les plus actifs cette semaine, classés par score d'activité.</p>
      </div>
      <SectorHeatWidget expanded />
    </div>
  );
};

export default TendancesPage;
