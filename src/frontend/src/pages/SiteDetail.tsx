import { type Labour, TransactionType, type WorkProgress } from "@/backend.d";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateLabour,
  useCreateTransaction,
  useCreateWorkProgress,
  useDeleteLabour,
  useDeleteTransaction,
  useGetLaboursBySiteId,
  useGetSite,
  useGetTransactionsBySiteId,
  useGetWorkProgressBySiteId,
  useUpdateLabour,
  useUpdateSite,
  useUpdateWorkProgress,
} from "@/hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  inputDateToBigint,
  todayInputValue,
  transactionTypeColor,
  transactionTypeLabel,
} from "@/utils/format";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// ── Transactions Tab ─────────────────────────────────────────

function TransactionsTab({ siteId }: { siteId: bigint }) {
  const { data: transactions, isLoading } = useGetTransactionsBySiteId(siteId);
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    date: todayInputValue(),
    transactionType: TransactionType.paymentReceived,
    amount: "",
    paymentMode: "Cash",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTransaction.mutateAsync({
        siteId,
        date: inputDateToBigint(form.date),
        transactionType: form.transactionType,
        amount: Number.parseFloat(form.amount),
        paymentMode: form.paymentMode,
        notes: form.notes,
      });
      toast.success("Transaction added");
      setShowAdd(false);
      setForm({
        date: todayInputValue(),
        transactionType: TransactionType.paymentReceived,
        amount: "",
        paymentMode: "Cash",
        notes: "",
      });
    } catch {
      toast.error("Failed to add transaction");
    }
  }

  const totals = transactions?.reduce(
    (acc, t) => {
      if (t.transactionType === TransactionType.paymentReceived) {
        acc.received += t.amount;
      } else {
        acc.spent += t.amount;
      }
      return acc;
    },
    { received: 0, spent: 0 },
  ) ?? { received: 0, spent: 0 };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Received
            </p>
            <p className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.received)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Spent
            </p>
            <p className="text-lg font-display font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totals.spent)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-muted-foreground">
          {transactions?.length ?? 0} transactions
        </h3>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowAdd(true)}
          data-ocid="transactions.add.button"
        >
          <Plus className="w-3.5 h-3.5" /> Add Transaction
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <div className="text-center py-10" data-ocid="transactions.empty_state">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div
              key={tx.id.toString()}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              data-ocid={`transactions.item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${transactionTypeColor(tx.transactionType)}`}
                  >
                    {transactionTypeLabel(tx.transactionType)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tx.paymentMode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(tx.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(tx.date)}
                  </span>
                </div>
                {tx.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {tx.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteId(tx.id)}
                data-ocid={`transactions.delete_button.${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent data-ocid="transactions.add.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  data-ocid="transactions.date.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                  min="0"
                  data-ocid="transactions.amount.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={form.transactionType}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    transactionType: v as TransactionType,
                  }))
                }
              >
                <SelectTrigger data-ocid="transactions.type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionType.paymentReceived}>
                    Payment Received
                  </SelectItem>
                  <SelectItem value={TransactionType.materialPurchase}>
                    Material Purchase
                  </SelectItem>
                  <SelectItem value={TransactionType.labourPayment}>
                    Labour Payment
                  </SelectItem>
                  <SelectItem value={TransactionType.miscExpense}>
                    Misc Expense
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select
                value={form.paymentMode}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, paymentMode: v }))
                }
              >
                <SelectTrigger data-ocid="transactions.payment_mode.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="transactions.notes.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                data-ocid="transactions.add.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
                data-ocid="transactions.add.submit_button"
              >
                {createTransaction.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="transactions.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="transactions.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await deleteTransaction.mutateAsync({ id: deleteId, siteId });
                  toast.success("Transaction deleted");
                  setDeleteId(null);
                } catch {
                  toast.error("Failed to delete");
                }
              }}
              data-ocid="transactions.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Labour Tab ───────────────────────────────────────────────

function LabourTab({ siteId }: { siteId: bigint }) {
  const { data: labours, isLoading } = useGetLaboursBySiteId(siteId);
  const createLabour = useCreateLabour();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Labour | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    workType: "",
    dailyWage: "",
  });
  const [editForm, setEditForm] = useState({
    totalPaid: "",
    pendingPayment: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLabour.mutateAsync({
        siteId,
        name: form.name,
        phone: form.phone,
        workType: form.workType,
        dailyWage: Number.parseFloat(form.dailyWage),
      });
      toast.success("Labour added");
      setShowAdd(false);
      setForm({ name: "", phone: "", workType: "", dailyWage: "" });
    } catch {
      toast.error("Failed to add labour");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    try {
      await updateLabour.mutateAsync({
        id: editItem.id,
        siteId,
        name: editItem.name,
        phone: editItem.phone,
        workType: editItem.workType,
        dailyWage: editItem.dailyWage,
        totalPaid: Number.parseFloat(editForm.totalPaid),
        pendingPayment: Number.parseFloat(editForm.pendingPayment),
      });
      toast.success("Labour updated");
      setEditItem(null);
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-muted-foreground">
          {labours?.length ?? 0} workers
        </h3>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowAdd(true)}
          data-ocid="labour.add.button"
        >
          <Plus className="w-3.5 h-3.5" /> Add Labour
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !labours || labours.length === 0 ? (
        <div className="text-center py-10" data-ocid="labour.empty_state">
          <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No labour added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {labours.map((l, i) => (
            <div
              key={l.id.toString()}
              className="p-4 rounded-lg border border-border bg-card space-y-2"
              data-ocid={`labour.item.${i + 1}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {l.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {l.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {l.workType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setEditItem(l);
                      setEditForm({
                        totalPaid: l.totalPaid.toString(),
                        pendingPayment: l.pendingPayment.toString(),
                      });
                    }}
                    data-ocid={`labour.edit_button.${i + 1}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(l.id)}
                    data-ocid={`labour.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Daily Wage</p>
                  <p className="font-medium text-foreground">
                    {formatCurrency(l.dailyWage)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Paid</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(l.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(l.pendingPayment)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Labour Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent data-ocid="labour.add.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add Labour</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Worker name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                data-ocid="labour.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                data-ocid="labour.phone.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Work Type *</Label>
              <Input
                placeholder="e.g. Mason, Carpenter"
                value={form.workType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, workType: e.target.value }))
                }
                required
                data-ocid="labour.work_type.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Daily Wage (₹) *</Label>
              <Input
                type="number"
                placeholder="Daily rate"
                value={form.dailyWage}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dailyWage: e.target.value }))
                }
                required
                min="0"
                data-ocid="labour.daily_wage.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                data-ocid="labour.add.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLabour.isPending}
                data-ocid="labour.add.submit_button"
              >
                {createLabour.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Labour Dialog */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
      >
        <DialogContent data-ocid="labour.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Update Payment — {editItem?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Total Paid (₹)</Label>
              <Input
                type="number"
                value={editForm.totalPaid}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, totalPaid: e.target.value }))
                }
                min="0"
                data-ocid="labour.edit.total_paid.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Pending Payment (₹)</Label>
              <Input
                type="number"
                value={editForm.pendingPayment}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, pendingPayment: e.target.value }))
                }
                min="0"
                data-ocid="labour.edit.pending.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
                data-ocid="labour.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLabour.isPending}
                data-ocid="labour.edit.submit_button"
              >
                {updateLabour.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="labour.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete labour record?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="labour.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await deleteLabour.mutateAsync({ id: deleteId, siteId });
                  toast.success("Labour deleted");
                  setDeleteId(null);
                } catch {
                  toast.error("Failed to delete");
                }
              }}
              data-ocid="labour.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Work Progress Tab ────────────────────────────────────────

function WorkProgressTab({ siteId }: { siteId: bigint }) {
  const { data: items, isLoading } = useGetWorkProgressBySiteId(siteId);
  const createWP = useCreateWorkProgress();
  const updateWP = useUpdateWorkProgress();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<WorkProgress | null>(null);
  const [form, setForm] = useState({
    taskName: "",
    progressPercent: "0",
    notes: "",
  });
  const [editForm, setEditForm] = useState({ progressPercent: "0", notes: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createWP.mutateAsync({
        siteId,
        taskName: form.taskName,
        progressPercent: Number.parseInt(form.progressPercent),
        notes: form.notes,
      });
      toast.success("Task added");
      setShowAdd(false);
      setForm({ taskName: "", progressPercent: "0", notes: "" });
    } catch {
      toast.error("Failed to add task");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    try {
      await updateWP.mutateAsync({
        id: editItem.id,
        siteId,
        taskName: editItem.taskName,
        progressPercent: Number.parseInt(editForm.progressPercent),
        notes: editForm.notes,
      });
      toast.success("Progress updated");
      setEditItem(null);
    } catch {
      toast.error("Failed to update");
    }
  }

  const overallProgress =
    items && items.length > 0
      ? Math.round(
          items.reduce((s, i) => s + i.progressPercent, 0) / items.length,
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      {items && items.length > 0 && (
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-foreground">
                Overall Progress
              </p>
              <span className="text-sm font-display font-bold text-primary">
                {overallProgress}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-muted-foreground">
          {items?.length ?? 0} tasks
        </h3>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowAdd(true)}
          data-ocid="progress.add.button"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-10" data-ocid="progress.empty_state">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={item.id.toString()}
              className="p-4 rounded-lg border border-border bg-card"
              data-ocid={`progress.item.${i + 1}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {item.taskName}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary -mr-1 -mt-1"
                  onClick={() => {
                    setEditItem(item);
                    setEditForm({
                      progressPercent: item.progressPercent.toString(),
                      notes: item.notes,
                    });
                  }}
                  data-ocid={`progress.edit_button.${i + 1}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={item.progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-medium text-foreground w-8 text-right">
                  {item.progressPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent data-ocid="progress.add.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Task Name *</Label>
              <Input
                placeholder="e.g. Foundation Work"
                value={form.taskName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, taskName: e.target.value }))
                }
                required
                data-ocid="progress.task_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Progress ({form.progressPercent}%)</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={form.progressPercent}
                onChange={(e) =>
                  setForm((p) => ({ ...p, progressPercent: e.target.value }))
                }
                className="accent-primary"
                data-ocid="progress.percent.input"
              />
              <Progress
                value={Number.parseInt(form.progressPercent)}
                className="h-1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="progress.notes.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                data-ocid="progress.add.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWP.isPending}
                data-ocid="progress.add.submit_button"
              >
                {createWP.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
      >
        <DialogContent data-ocid="progress.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Update — {editItem?.taskName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Progress ({editForm.progressPercent}%)</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={editForm.progressPercent}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    progressPercent: e.target.value,
                  }))
                }
                className="accent-primary"
                data-ocid="progress.edit.percent.input"
              />
              <Progress
                value={Number.parseInt(editForm.progressPercent)}
                className="h-1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="progress.edit.notes.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
                data-ocid="progress.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateWP.isPending}
                data-ocid="progress.edit.submit_button"
              >
                {updateWP.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main SiteDetail ──────────────────────────────────────────

export default function SiteDetail() {
  const { siteId } = useParams({ from: "/sites/$siteId" });
  const id = BigInt(siteId);
  const { data: site, isLoading } = useGetSite(id);
  const updateSite = useUpdateSite();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-6 text-center" data-ocid="site_detail.error_state">
        <p className="text-muted-foreground">Site not found</p>
        <Link to="/sites">
          <Button variant="outline" className="mt-4">
            Back to Sites
          </Button>
        </Link>
      </div>
    );
  }

  async function toggleStatus() {
    if (!site) return;
    const newStatus = site.status === "active" ? "completed" : "active";
    try {
      await updateSite.mutateAsync({ ...site, id, status: newStatus as any });
      toast.success(`Site marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link to="/sites" data-ocid="site_detail.back.link">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground -ml-2 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sites
        </Button>
      </Link>

      {/* Site Info */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-display font-bold text-foreground truncate">
                  {site.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {site.clientName}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={site.status === "active" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={toggleStatus}
                  data-ocid="site_detail.status.toggle"
                >
                  {site.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{site.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatDate(site.startDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatDate(site.expectedEndDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatCurrency(site.totalAmount)}</span>
              </div>
            </div>
            {site.notes && (
              <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
                {site.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <Tabs defaultValue="transactions">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger
              value="transactions"
              data-ocid="site_detail.transactions.tab"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger value="labour" data-ocid="site_detail.labour.tab">
              Labour
            </TabsTrigger>
            <TabsTrigger value="progress" data-ocid="site_detail.progress.tab">
              Work Progress
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <TransactionsTab siteId={id} />
          </TabsContent>
          <TabsContent value="labour">
            <LabourTab siteId={id} />
          </TabsContent>
          <TabsContent value="progress">
            <WorkProgressTab siteId={id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
