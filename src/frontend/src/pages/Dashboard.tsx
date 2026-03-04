import { SiteStatus } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllSites } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart2,
  Building2,
  Clock,
  DollarSign,
  Package,
  Plus,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                {title}
              </p>
              <p className="text-2xl font-display font-bold text-foreground">
                {value}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: sites, isLoading: sitesLoading } = useGetAllSites();

  const activeSites = useMemo(
    () => sites?.filter((s) => s.status === SiteStatus.active) ?? [],
    [sites],
  );

  // For dashboard totals, compute from site amounts (simplified)
  const totalProjectAmount = useMemo(
    () => sites?.reduce((sum, s) => sum + s.totalAmount, 0) ?? 0,
    [sites],
  );

  if (sitesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Business overview —{" "}
            {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
        <Link to="/sites" data-ocid="dashboard.sites.link">
          <Button className="gap-2" data-ocid="dashboard.add_site.button">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Site</span>
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Sites"
          value={String(activeSites.length)}
          icon={Building2}
          color="bg-primary/10 text-primary"
          delay={0.05}
        />
        <StatCard
          title="Total Sites"
          value={String(sites?.length ?? 0)}
          icon={Clock}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          delay={0.1}
        />
        <StatCard
          title="Total Project Value"
          value={formatCurrency(totalProjectAmount)}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          delay={0.15}
        />
        <StatCard
          title="Completed Sites"
          value={String(
            sites?.filter((s) => s.status === SiteStatus.completed).length ?? 0,
          )}
          icon={TrendingUp}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          delay={0.2}
        />
      </div>

      {/* Sites list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display">
              Recent Sites
            </CardTitle>
            <Link to="/sites" data-ocid="dashboard.all_sites.link">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground h-7"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {!sites || sites.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="dashboard.sites.empty_state"
              >
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No sites yet</p>
                <Link to="/sites" className="mt-3 inline-block">
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dashboard.create_first_site.button"
                  >
                    Create your first site
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sites.slice(0, 5).map((site, i) => (
                  <Link
                    key={site.id.toString()}
                    to="/sites/$siteId"
                    params={{ siteId: site.id.toString() }}
                    data-ocid={`dashboard.site.item.${i + 1}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {site.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {site.clientName} · {site.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-foreground hidden sm:block">
                        {formatCurrency(site.totalAmount)}
                      </span>
                      <Badge
                        variant={
                          site.status === SiteStatus.active
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {site.status}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Link to="/sites" data-ocid="dashboard.quick_sites.link">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Manage Sites
                </p>
                <p className="text-xs text-muted-foreground">
                  View all construction sites
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/summary" data-ocid="dashboard.quick_summary.link">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:group-hover:bg-emerald-900/50">
                <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Financial Summary
                </p>
                <p className="text-xs text-muted-foreground">
                  Income & expense overview
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="shadow-card opacity-60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">
                Material Inventory
              </p>
              <Badge variant="secondary" className="text-xs mt-1">
                Coming Soon
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
