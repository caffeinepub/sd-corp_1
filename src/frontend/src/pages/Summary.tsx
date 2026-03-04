import { SiteStatus, TransactionType } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { useGetAllSites, useGetTransactionsBySiteId } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { useQueries } from "@tanstack/react-query";
import { Building2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

function SiteSummaryCard({
  site,
  index,
}: {
  site: {
    id: bigint;
    name: string;
    clientName: string;
    totalAmount: number;
    status: SiteStatus;
    received: number;
    spent: number;
  };
  index: number;
}) {
  const profit = site.received - site.spent;
  const receivePercent =
    site.totalAmount > 0
      ? Math.min(100, (site.received / site.totalAmount) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      data-ocid={`summary.site.item.${index + 1}`}
    >
      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-display font-bold text-sm text-foreground truncate">
                {site.name}
              </h3>
              <p className="text-xs text-muted-foreground">{site.clientName}</p>
            </div>
            <Badge
              variant={
                site.status === SiteStatus.active ? "default" : "secondary"
              }
              className="text-xs flex-shrink-0"
            >
              {site.status}
            </Badge>
          </div>

          {/* Payment progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Payment received</span>
              <span className="font-medium text-foreground">
                {Math.round(receivePercent)}%
              </span>
            </div>
            <Progress value={receivePercent} className="h-1.5" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 rounded-md bg-muted/50">
              <p className="text-muted-foreground mb-0.5">Contract</p>
              <p className="font-medium text-foreground">
                {formatCurrency(site.totalAmount)}
              </p>
            </div>
            <div className="text-center p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-muted-foreground mb-0.5">Received</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(site.received)}
              </p>
            </div>
            <div className="text-center p-2 rounded-md bg-orange-50 dark:bg-orange-900/20">
              <p className="text-muted-foreground mb-0.5">Spent</p>
              <p className="font-medium text-orange-600 dark:text-orange-400">
                {formatCurrency(site.spent)}
              </p>
            </div>
          </div>

          <div
            className={`mt-3 flex items-center justify-between p-2.5 rounded-md ${profit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
          >
            <span className="text-xs font-medium text-muted-foreground">
              Profit / Loss
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-display font-bold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {profit >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {formatCurrency(Math.abs(profit))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Summary() {
  const { data: sites, isLoading: sitesLoading } = useGetAllSites();
  const { actor, isFetching } = useActor();

  const transactionQueries = useQueries({
    queries: (sites ?? []).map((site) => ({
      queryKey: ["transactions", site.id.toString()],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getTransactionsBySiteId(site.id);
      },
      enabled: !!actor && !isFetching,
    })),
  });

  const siteData = useMemo(() => {
    if (!sites) return [];
    return sites.map((site, i) => {
      const txs = transactionQueries[i]?.data ?? [];
      const received = txs
        .filter((t) => t.transactionType === TransactionType.paymentReceived)
        .reduce((s, t) => s + t.amount, 0);
      const spent = txs
        .filter((t) => t.transactionType !== TransactionType.paymentReceived)
        .reduce((s, t) => s + t.amount, 0);
      return { ...site, received, spent };
    });
  }, [sites, transactionQueries]);

  const totals = useMemo(
    () =>
      siteData.reduce(
        (acc, s) => ({
          totalContract: acc.totalContract + s.totalAmount,
          totalReceived: acc.totalReceived + s.received,
          totalSpent: acc.totalSpent + s.spent,
        }),
        { totalContract: 0, totalReceived: 0, totalSpent: 0 },
      ),
    [siteData],
  );

  if (sitesLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">
          Financial Summary
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Income vs expenses across all sites
        </p>
      </motion.div>

      {/* Overall totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sites",
            value: String(sites?.length ?? 0),
            icon: Building2,
            color: "bg-primary/10 text-primary",
            delay: 0.05,
          },
          {
            label: "Total Contract",
            value: formatCurrency(totals.totalContract),
            icon: DollarSign,
            color: "bg-muted text-muted-foreground",
            delay: 0.1,
          },
          {
            label: "Total Received",
            value: formatCurrency(totals.totalReceived),
            icon: TrendingUp,
            color:
              "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
            delay: 0.15,
          },
          {
            label: "Total Spent",
            value: formatCurrency(totals.totalSpent),
            icon: TrendingDown,
            color:
              "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
            delay: 0.2,
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay, duration: 0.35 }}
          >
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}
                  >
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Net P/L Banner */}
      {siteData.length > 0 &&
        (() => {
          const net = totals.totalReceived - totals.totalSpent;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className={`rounded-xl p-4 flex items-center justify-between ${net >= 0 ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}
              data-ocid="summary.net_pl.card"
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Net Profit / Loss
                </p>
                <p
                  className={`text-2xl font-display font-bold mt-0.5 ${net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                >
                  {net >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(net))}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${net >= 0 ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}
              >
                {net >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </motion.div>
          );
        })()}

      {/* Per-site breakdown */}
      {siteData.length === 0 ? (
        <div className="text-center py-16" data-ocid="summary.empty_state">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No sites to show. Add sites to see financial summary.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-base font-display font-semibold text-foreground mb-3">
            Site-wise Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {siteData.map((site, i) => (
              <SiteSummaryCard key={site.id.toString()} site={site} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
