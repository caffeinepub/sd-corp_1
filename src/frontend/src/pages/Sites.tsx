import { SiteStatus } from "@/backend.d";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSite,
  useDeleteSite,
  useGetAllSites,
} from "@/hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  inputDateToBigint,
  todayInputValue,
} from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface SiteFormData {
  name: string;
  clientName: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  totalAmount: string;
  notes: string;
}

const defaultForm: SiteFormData = {
  name: "",
  clientName: "",
  location: "",
  startDate: todayInputValue(),
  expectedEndDate: "",
  totalAmount: "",
  notes: "",
};

export default function Sites() {
  const { data: sites, isLoading } = useGetAllSites();
  const createSite = useCreateSite();
  const deleteSite = useDeleteSite();

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<SiteFormData>(defaultForm);

  const filtered =
    sites?.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.location.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  function handleFormChange(field: keyof SiteFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.name ||
      !form.clientName ||
      !form.location ||
      !form.startDate ||
      !form.totalAmount
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createSite.mutateAsync({
        name: form.name,
        clientName: form.clientName,
        location: form.location,
        startDate: inputDateToBigint(form.startDate),
        expectedEndDate: form.expectedEndDate
          ? inputDateToBigint(form.expectedEndDate)
          : inputDateToBigint(form.startDate),
        totalAmount: Number.parseFloat(form.totalAmount),
        notes: form.notes,
      });
      toast.success("Site created successfully");
      setShowAddDialog(false);
      setForm(defaultForm);
    } catch {
      toast.error("Failed to create site");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSite.mutateAsync(deleteId);
      toast.success("Site deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete site");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Sites
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sites?.length ?? 0} total sites
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="gap-2"
          data-ocid="sites.add_site.button"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Site</span>
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sites, clients, locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="sites.search_input"
        />
      </motion.div>

      {/* Sites grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" data-ocid="sites.empty_state">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            {search ? "No sites match your search" : "No sites yet"}
          </p>
          {!search && (
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
              data-ocid="sites.create_first.button"
            >
              Create your first site
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((site, i) => (
            <motion.div
              key={site.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              data-ocid={`sites.site.item.${i + 1}`}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-display font-bold text-foreground text-base truncate">
                        {site.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {site.clientName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        site.status === SiteStatus.active
                          ? "default"
                          : "secondary"
                      }
                      className="flex-shrink-0 text-xs"
                    >
                      {site.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{site.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(site.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {formatCurrency(site.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/sites/$siteId"
                      params={{ siteId: site.id.toString() }}
                      className="flex-1"
                      data-ocid={`sites.site.link.${i + 1}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                      >
                        Open Site <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(site.id)}
                      data-ocid={`sites.site.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Site Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          data-ocid="sites.add_site.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add New Site</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Sharma Residence"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                required
                data-ocid="sites.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="e.g. Rajesh Sharma"
                value={form.clientName}
                onChange={(e) => handleFormChange("clientName", e.target.value)}
                required
                data-ocid="sites.client_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Sector 12, Noida"
                value={form.location}
                onChange={(e) => handleFormChange("location", e.target.value)}
                required
                data-ocid="sites.location.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    handleFormChange("startDate", e.target.value)
                  }
                  required
                  data-ocid="sites.start_date.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedEndDate">End Date</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={form.expectedEndDate}
                  onChange={(e) =>
                    handleFormChange("expectedEndDate", e.target.value)
                  }
                  data-ocid="sites.end_date.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Project Amount (₹) *</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="e.g. 2500000"
                value={form.totalAmount}
                onChange={(e) =>
                  handleFormChange("totalAmount", e.target.value)
                }
                required
                min="0"
                data-ocid="sites.total_amount.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the site..."
                value={form.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                rows={3}
                data-ocid="sites.notes.textarea"
              />
            </div>
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                data-ocid="sites.add_site.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSite.isPending}
                data-ocid="sites.add_site.submit_button"
              >
                {createSite.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Site"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="sites.delete_site.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the site and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="sites.delete_site.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="sites.delete_site.confirm_button"
            >
              {deleteSite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
