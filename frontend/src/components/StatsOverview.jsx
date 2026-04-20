import { Card, CardContent } from "./ui/card";

const StatsOverview = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.total || 0}</p>
          <p className="text-sm text-muted-foreground">Articles analysés</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{Object.keys(stats.parSecteur || {}).length}</p>
          <p className="text-sm text-muted-foreground">Secteurs couverts</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.sentimentPositif || 0}</p>
          <p className="text-sm text-muted-foreground">Positifs</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.importanceMoyenne || "0"}</p>
          <p className="text-sm text-muted-foreground">Importance moy.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
