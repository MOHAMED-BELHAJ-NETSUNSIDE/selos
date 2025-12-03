'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, Mail, Loader2 } from 'lucide-react';

interface DataTableProps {
  title: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  columns: {
    key: string;
    label: string;
    render?: (value: unknown, row: unknown) => React.ReactNode;
  }[];
  stats?: {
    total: number;
    active?: number;
    blocked?: number;
    withEmail?: number;
  };
}

export function DataTable({ title, description, endpoint, icon, columns, stats }: DataTableProps) {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = search ? `${endpoint}?search=${encodeURIComponent(search)}` : endpoint;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, endpoint]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {stats.active !== undefined && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.blocked !== undefined && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-rose-100 rounded-xl shadow-sm">
                    <Users className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bloqués</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.withEmail !== undefined && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-violet-100 rounded-xl shadow-sm">
                    <Mail className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avec Email</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.withEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recherche */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-xl">
            {icon}
            <span>{title}</span>
          </CardTitle>
          <CardDescription className="text-gray-600">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Erreur: {error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                {icon}
              </div>
              <p className="text-gray-600">Aucun résultat trouvé</p>
              {search && (
                <p className="text-sm text-gray-500 mt-1">
                  Essayez de modifier vos critères de recherche
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key} className="bg-gray-50">{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                      {columns.map((column) => (
                        <TableCell key={column.key} className="py-4">
                          {column.render 
                            ? column.render((row as Record<string, unknown>)[column.key], row)
                            : String((row as Record<string, unknown>)[column.key] || '')
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de pagination */}
      {data.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Affichage de {data.length} résultat(s)
          {search && ` pour la recherche "${search}"`}
        </div>
      )}
    </div>
  );
}

