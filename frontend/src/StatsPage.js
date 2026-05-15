import { useState, useEffect } from "react";
import { fetchArticles as fetchArticlesAPI } from './api';
import { Download, FileJson } from 'lucide-react';
import { exportToCSV, exportToJSON } from './lib/exportUtils';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Skeleton } from "./components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { sectorConfig as sectorConfigFull } from './lib/config';
import { useSEO } from './hooks/useSEO';

const sectorConfig = Object.fromEntries(
  Object.entries(sectorConfigFull).map(([k, v]) => [k, { color: v.color }])
);

const StatsPage = () => {
  const seo = useSEO({ title: 'Statistiques', description: 'Répartition des articles par secteur, sentiment et importance — tableau de bord veille tech.' });
  const [stats, setStats] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchArticlesAPI({}, 1);
        setStats(data.stats);
        setAllArticles(data.articles);
      } catch (e) {
        toast.error("Erreur lors du chargement des stats");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleExportCSV = () => {
    exportToCSV(allArticles, 'veille-tech');
    toast.success(`${allArticles.length} articles exportés en CSV !`, {
      icon: "📥",
    });
  };

  const handleExportJSON = () => {
    exportToJSON(allArticles, 'veille-tech');
    toast.success(`${allArticles.length} articles exportés en JSON !`, {
      icon: "💾",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {seo}
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const sectorData = Object.entries(stats?.parSecteur || {}).map(([name, value]) => ({
    name,
    value,
    color: sectorConfig[name]?.color || "#6B7280"
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {seo}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Statistiques</h1>
          <p className="text-muted-foreground">Vue d'ensemble des analyses</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par secteur</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles par secteur</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
